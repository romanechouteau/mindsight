import { Scene, sRGBEncoding, WebGLRenderer } from 'three'
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

import Stats from 'stats.js'
import Time from './Tools/Time'
import { createState, State } from './World/State'
import PointerCursor from './Tools/PointerCursor'

const stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)

export default class App {
  canvas: any
  time: any
  sizes: any
  scene: Scene
  renderer: WebGLRenderer
  renderOnBlur: any
  camera: any
  debug: dat.GUI
  world: any
  mouse: Mouse
  state: { time: Time }
  pointerCursor: PointerCursor
  constructor(options) {
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
    this.setWorld()
    this.setPointerCursor()

  }
  setPointerCursor() {
    this.pointerCursor = PointerCursor
  }
  setRenderer() {
    // Set scene
    this.scene = new Scene()
    // Set renderer
    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
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
        this.renderer.render(this.scene, this.camera.camera)
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
      pixelRatio: this.renderer.getPixelRatio()
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
}

// export interface App {

// }

// export declare namespace App {
//   state: number
// }
