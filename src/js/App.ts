import { Scene, sRGBEncoding, Vector2, WebGLRenderer, ShaderMaterial, Layers } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js'
import * as dat from 'dat.gui'

// @ts-ignore
import Mouse from '@tools/Mouse'
// @ts-ignore
import Sizes from '@tools/Sizes'
// // @ts-ignore
// import Time from '@tools/Time'
// @ts-ignore
import { Mouse } from '@tools/Mouse'
// @ts-ignore
// import Assets from '@tools/Loader'

// @ts-ignore
import Camera from './Camera'
// @ts-ignore
import World from '@world/index'
// @ts-ignore
import store from '@store/index'

import IntroController from './IntroController'

import Stats from 'stats.js'
import Time from './Tools/Time'
import { createState, State } from './World/State'
import PointerCursor from './Tools/PointerCursor'
import Component from './Lib/Component'

// @ts-ignore
import bloomVertShader from '@shaders/bloomVert.glsl'
// @ts-ignore
import bloomFragShader from '@shaders/bloomFrag.glsl'
import { BLOOM_LAYER } from './constants'

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
  state: { time: Time }
  bloomLayer: Layers
  // @ts-ignore
  pointerCursor: PointerCursor
  intro: IntroController
  bloomPass: UnrealBloomPass
  bloomComposer: EffectComposer
  finalComposer: EffectComposer
  constructor(options) {
    super({
      store
    })

    // Set options
    this.canvas = options.canvas

    // Set up
    this.time = new Time()
    this.sizes = new Sizes()
    this.mouse = Mouse
    // this.assets = new Assets()
    this.mouse = new Mouse()

    // ! Only state shall be accessed on global App namespace
    this.state = createState()
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
    this.renderer.setClearColor(0xF4C5B5, 1)
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
      if (!(this.renderOnBlur?.activated && !document.hasFocus())) {
        stats.begin()
        this.scene.traverse(this.darkenNonBloomed.bind(this))
        this.renderer.setClearColor(0x000000, 1.)
        this.bloomComposer.render()
        this.renderer.setClearColor(0xF4C5B5, 1.)
        this.scene.traverse(this.restoreMaterial.bind(this))
        this.finalComposer.render()
        stats.end()
      }
    })

    if (this.debug) {
      this.renderOnBlur = { activated: true }
      const folder = this.debug.addFolder('Renderer')
      folder.open()
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
    this.bloomComposer = new EffectComposer(this.renderer)

    this.bloomPass = new UnrealBloomPass(new Vector2(this.sizes.viewport.width, this.sizes.viewport.height), 1.5, 0.4, 0.85)
    this.bloomPass.threshold = 0
    this.bloomPass.strength = 1.5
    this.bloomPass.radius = 0.1

    const gammaCorrection = new ShaderPass(GammaCorrectionShader)

    this.bloomComposer.addPass(renderScene)
    this.bloomComposer.addPass(this.bloomPass)
    this.bloomComposer.addPass(gammaCorrection)

    // FINAL COMPOSER
    const finalPass = new ShaderPass(
      new ShaderMaterial({
        uniforms: {
          baseTexture: {
            value: null
          },
          bloomTexture: {
            value: this.bloomComposer.renderTarget2.texture
          }
        },
        vertexShader: bloomVertShader,
        fragmentShader: bloomFragShader,
        defines: {}
      }), "baseTexture"
    )
    finalPass.needsSwap = true

    this.finalComposer = new EffectComposer(this.renderer)
    this.finalComposer.addPass(renderScene)
    this.finalComposer.addPass(finalPass)

    // debug
    if (this.debug) {
      const folder = this.debug.addFolder('Bloom')
      folder.open()
      folder
        .add(this.bloomPass, 'threshold')
        .step(0.1)
        .min(0)
        .max(1)
        .name('Threshold')
      folder.add(this.bloomPass, 'strength')
        .step(0.01)
        .min(0)
        .max(3)
        .name('Strength')
      folder.add(this.bloomPass, 'radius')
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
    //   assets: this.assets,
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
    if (store.state.isIntro && this.intro === undefined) {
      this.intro = new IntroController({time: this.time, debug: this.debug})
    } else if (document.querySelector('#intro')) {
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

// export interface App {

// }

// export declare namespace App {
//   state: number
// }
