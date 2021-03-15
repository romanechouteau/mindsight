import { AxesHelper, Object3D } from 'three'

// @ts-ignore
import Time from '@tools/Time'
// @ts-ignore
import Mouse from '@tools/Mouse'
import Brush from './Brush'
// @ts-ignore
import Camera from '@js/Camera'
import Suzanne from './Suzanne'
import PointLightSource from './PointLight'
import AmbientLightSource from './AmbientLight'

export default class World {
  time: Time
  debug: any
  mouse: Mouse
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
  pixelRatio: number
  constructor(options) {
    // Set options
    this.time = options.time
    this.debug = options.debug
    this.mouse = options.mouse
    this.camera = options.camera
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
    this.setSuzanne()
    this.setBrush()
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
  setBrush() {
    this.brush = new Brush({
      time: this.time,
      debug: this.debug,
      mouse: this.mouse,
      scene: this.container,
      camera: this.camera,
      pixelRatio: this.pixelRatio,
    })
  }
}
