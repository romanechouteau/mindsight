import { AxesHelper, Object3D } from 'three'

// @ts-ignore
import Time from '@tools/Time'
// @ts-ignore
import { Mouse } from '@tools/Mouse'
// @ts-ignore
import Camera from '@js/Camera'

import User from './User'
import Brush from './Brush'
import Ground from './Ground'
import Suzanne from './Suzanne'
import PointLightSource from './PointLight'
import AmbientLightSource from './AmbientLight'

export default class World {
  time: Time
  debug: any
  mouse: Mouse
  canvas: HTMLElement
  camera: Camera
  container: Object3D
  debugFolder: any
  loadDiv: any
  loadModels: any
  progress: any
  ambientlight: AmbientLightSource
  light: PointLightSource
  suzanne: Suzanne
  brush: Brush
  ground: Ground
  pixelRatio: number
  user: User
  constructor(options) {
    // Set options
    this.time = options.time
    this.debug = options.debug
    this.mouse = options.mouse
    this.camera = options.camera
    this.canvas = options.canvas
    this.pixelRatio = options.pixelRatio

    // Set up
    this.container = new Object3D()
    this.container.name = 'World'

    if (this.debug) {
      this.container.add(new AxesHelper(5))
      this.debugFolder = this.debug.addFolder('World')
      this.debugFolder.open()
    }

    this.setLoader()
  }
  init() {
    this.setAmbientLight()
    this.setPointLight()
    // this.setSuzanne()
    this.setBrush()
    this.setGround()
    this.setUser()
  }
  setLoader() {
    this.loadDiv = document.querySelector('.loadScreen')
    this.loadModels = this.loadDiv.querySelector('.load')
    this.progress = this.loadDiv.querySelector('.progress')

    // TODO: implement load screen
    this.init()
    this.loadDiv.remove()
  }
  setAmbientLight() {
    this.ambientlight = new AmbientLightSource({
      debug: this.debugFolder,
    })
    this.container.add(this.ambientlight.container)
  }
  setPointLight() {
    this.light = new PointLightSource({
      debug: this.debugFolder,
    })
    this.container.add(this.light.container)
  }
  setGround() {
    this.ground = new Ground({
      time: this.time,
      mouse: this.mouse
    })
    this.container.add(this.ground.container)
  }
  setUser() {
    this.user = new User({
      camera: this.camera,
      mouse: this.mouse
    })
  }
  setBrush() {
    this.brush = new Brush({
      time: this.time,
      mouse: this.mouse,
      scene: this.container,
      camera: this.camera,
      canvas: this.canvas,
      pixelRatio: this.pixelRatio,
    })
  }
}
