import { Scene, sRGBEncoding, Vector2, WebGLRenderer, ShaderMaterial, Layers } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js'
import * as dat from 'dat.gui'

// @ts-ignore
import Sizes from '@tools/Sizes'
// @ts-ignore
import { Mouse } from '@tools/Mouse'
// @ts-ignore
import Camera from './Camera'
// @ts-ignore
import World from '@world/index'
// @ts-ignore
import store from '@store/index'
import IntroController from './IntroController'
import Stats from 'stats.js'
import Time from './Tools/Time'
import PointerCursor from './Tools/PointerCursor'
import Component from './Lib/Component'

// @ts-ignore
import bloomVertShader from '@shaders/bloomVert.glsl'
// @ts-ignore
import bloomFragShader from '@shaders/bloomFrag.glsl'

import {
  BLOOM_LAYER, SCENES, BLOOM_THRESHOLD, BLOOM_STRENGTH, BLOOM_RADIUS, SELECTIVE_BLOOM_THRESHOLD,
  SELECTIVE_BLOOM_STRENGTH, SELECTIVE_BLOOM_RADIUS
} from './constants'

const stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)

export default class App extends Component {
  canvas: any
  time: Time
  sizes: any
  scene: Scene
  renderer: WebGLRenderer
  renderOnBlur: any
  camera: any
  debug: dat.GUI
  world: any
  mouse: Mouse
  bloomLayer: Layers
  // @ts-ignore
  pointerCursor: PointerCursor
  intro: IntroController
  finalComposer: EffectComposer
  globalBloomPass: UnrealBloomPass
  selectiveBloomPass: UnrealBloomPass
  selectiveBloomComposer: EffectComposer
  constructor(options) {
    super({
      store
    })

    // Set options
    this.canvas = options.canvas

    // Set up
    this.time = new Time()
    this.sizes = new Sizes()
    this.mouse = new Mouse()

    this.setConfig()
    this.setRenderer()
    this.setCamera()
    this.setPostprocessing()
    this.setPointerCursor()
    this.setWorld()
    this.render()
  }

  setPointerCursor() {
    this.pointerCursor = new PointerCursor({
      time: this.time
    })
  }

  setRenderer() {
    // Set scene
    this.scene = new Scene()

    // Bloom layers
    this.bloomLayer = new Layers()
    this.bloomLayer.set(BLOOM_LAYER)

    // Set renderer
    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    this.renderer.outputEncoding = sRGBEncoding
    this.renderer.gammaFactor = 2.2
    // Set background color
    this.renderer.setClearColor(0x000000, 1.)
    // Set renderer pixel ratio & sizes
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.sizes.viewport.width, this.sizes.viewport.height)
    // Resize renderer on resize event
    this.sizes.on('resize', () => {
      this.renderer.setSize(
        this.sizes.viewport.width,
        this.sizes.viewport.height
      )
    })
    // Set RequestAnimationFrame with 60fps
    this.time.on('tick', () => {
      // When tab is not visible (tab is not active or window is minimized), browser stops requesting animation frames. Thus, this does not work
      // if the window is only in the background without focus (for example, if you select another window without minimizing the browser one),
      // which might cause some performance or batteries issues when testing on multiple browsers
      if (!(this.renderOnBlur?.activated && !document.hasFocus()) && store.state.scene > SCENES.EYETRACKING && store.state.scene < SCENES.SUMUP) {
        stats.begin()
        this.scene.traverse(this.darkenNonBloomed.bind(this))
        this.selectiveBloomComposer.render()
        this.scene.traverse(this.restoreMaterial.bind(this))
        this.finalComposer.render()
        stats.end()
      }
    })

    if (this.debug) {
      this.renderOnBlur = { activated: true }
      const folder = this.debug.addFolder('Renderer')
      folder
        .add(this.renderOnBlur, 'activated')
        .name('Render on window blur')
    }
  }
  setCamera() {
    // Create camera instance
    this.camera = new Camera({
      sizes: this.sizes,
      renderer: this.renderer,
      debug: this.debug,
    })
    // Add camera to scene
    this.scene.add(this.camera.container)
  }

  setPostprocessing() {
    const renderScene = new RenderPass(this.scene, this.camera.camera)

    // BLOOM COMPOSER
    this.selectiveBloomComposer = new EffectComposer(this.renderer)

    this.selectiveBloomPass = new UnrealBloomPass(new Vector2(this.sizes.viewport.width, this.sizes.viewport.height), 1.5, 0.4, 0.85)
    this.selectiveBloomPass.threshold = SELECTIVE_BLOOM_THRESHOLD
    this.selectiveBloomPass.strength = SELECTIVE_BLOOM_STRENGTH
    this.selectiveBloomPass.radius = SELECTIVE_BLOOM_RADIUS

    const gammaCorrection = new ShaderPass(GammaCorrectionShader)

    this.selectiveBloomComposer.addPass(renderScene)
    this.selectiveBloomComposer.addPass(this.selectiveBloomPass)
    this.selectiveBloomComposer.addPass(gammaCorrection)

    // FINAL COMPOSER
    const finalPass = new ShaderPass(
      new ShaderMaterial({
        uniforms: {
          baseTexture: {
            value: null
          },
          bloomTexture: {
            value: this.selectiveBloomComposer.renderTarget2.texture
          }
        },
        vertexShader: bloomVertShader,
        fragmentShader: bloomFragShader,
        defines: {}
      }), "baseTexture"
    )
    finalPass.needsSwap = true

    // GLOBAL BLOOM
    this.globalBloomPass = new UnrealBloomPass(new Vector2(this.sizes.viewport.width, this.sizes.viewport.height), 1.5, 0.4, 0.85)
    this.globalBloomPass.threshold = BLOOM_THRESHOLD
    this.globalBloomPass.strength = BLOOM_STRENGTH
    this.globalBloomPass.radius = BLOOM_RADIUS

    this.finalComposer = new EffectComposer(this.renderer)
    this.finalComposer.addPass(renderScene)
    this.finalComposer.addPass(this.globalBloomPass)
    this.finalComposer.addPass(finalPass)

    // debug
    if (this.debug) {
      const folder = this.debug.addFolder('Selective Bloom')
      folder
        .add(this.selectiveBloomPass, 'threshold')
        .step(0.01)
        .min(0)
        .max(1)
        .name('Threshold')
      folder.add(this.selectiveBloomPass, 'strength')
        .step(0.01)
        .min(0)
        .max(3)
        .name('Strength')
      folder.add(this.selectiveBloomPass, 'radius')
        .step(0.01)
        .min(0)
        .max(1)
        .name('Radius')
      const folder2 = this.debug.addFolder('Global Bloom')
      folder2
        .add(this.globalBloomPass, 'threshold')
        .step(0.01)
        .min(0)
        .max(1)
        .name('Threshold')
      folder2.add(this.globalBloomPass, 'strength')
        .step(0.01)
        .min(0)
        .max(3)
        .name('Strength')
      folder2.add(this.globalBloomPass, 'radius')
        .step(0.01)
        .min(0)
        .max(1)
        .name('Radius')
    }
  }

  setWorld() {
    // Create world instance
    this.world = new World({
      time: this.time,
      debug: this.debug,
      mouse: this.mouse,
      sizes: this.sizes,
      camera: this.camera,
      canvas: this.canvas,
      globalScene: this.scene,
      pixelRatio: this.renderer.getPixelRatio(),
      pointerCursor: this.pointerCursor
    })
    // Add world to scene
    this.scene.add(this.world.container)
  }

  setConfig() {
    if (window.location.hash === '#debug') {
      this.debug = new dat.GUI({ width: 450 })
    }
  }

  render = () => {
    // render intro
    if (store.state.isIntro && this.intro === undefined) {
      this.intro = new IntroController({time: this.time, pointerCursor: this.pointerCursor, debug: this.debug})
    } else if (store.state.scene === SCENES.EYETRACKING && this.world.eyeTrackingManager === undefined) {
      this.intro.flyLines()
    } else if (!store.state.isIntro && document.querySelector('#intro')) {
      this.intro.dispose()
    }
  }

  darkenNonBloomed(obj) {
    if ((obj.isMesh || obj.isPoints) && this.bloomLayer.test(obj.layers) === false) {
      obj.material.colorWrite = false
    }
  }

  restoreMaterial(obj) {
    if (obj.material) {
      obj.material.colorWrite = true
    }
  }
}