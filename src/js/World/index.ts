import { AxesHelper, Object3D } from 'three'

// @ts-ignore
import Mouse from '@tools/Mouse'
import AmbientLightSource from './AmbientLight'
import PointLightSource from './PointLight'
import Suzanne from './Suzanne'
import EyeTracking from './EyeTracking'

export default class World {
  time: any
  debug: any
  mouse: Mouse
  camera: any
  container: Object3D
  debugFolder: any
  loadDiv: any
  loadModels: any
  progress: any
  ambientlight: AmbientLightSource
  light: PointLightSource
  suzanne: Suzanne
  eyeTracking: EyeTracking
  windowWidth: number
  windowHeight: number
  constructor(options) {
    // Set options
    this.time = options.time
    this.debug = options.debug
    this.mouse = options.mouse
    this.camera = options.camera
    this.windowWidth = options.windowWidth
    this.windowHeight = options.windowHeight
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
    this.setEyeTracking()
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
  setSuzanne() {
    this.suzanne = new Suzanne({
      time: this.time
    })
    this.container.add(this.suzanne.container)
  }
  setEyeTracking() {
    this.eyeTracking = new EyeTracking({
      windowWidth: this.windowWidth,
      windowHeight: this.windowHeight,
      mouse: this.mouse,
      camera: this.camera,
    })
    this.container.add(this.eyeTracking.container)
  }
}
