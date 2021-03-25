import { AxesHelper, Camera, FogExp2, Fog, Object3D } from 'three'
import { Mouse } from '../Tools/Mouse'

import AmbientLightSource from './AmbientLight'
import Ground from './Ground'
import PointLightSource from './PointLight'
import User from './User'

export default class World {
  time: any
  debug: any
  container: Object3D
  debugFolder: any
  loadDiv: any
  loadModels: any
  progress: any
  ambientlight: AmbientLightSource
  light: PointLightSource
  ground: Ground
  mouse: Mouse
  camera: Camera
  pixelRatio: number
  user: User
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
    this.setGround()
    this.setUser()
    setTimeout(() => {
      this.setFog()
    }, 50);
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
  setFog() {
    const fog = new FogExp2(0x212121, 0.08)
    // const fog = new Fog(0x212121, 0, 10)
    App.scene.fog = fog
  }
  setUser() {
    this.user = new User({
      camera: this.camera,
      mouse: this.mouse,
      ground: this.ground
    })
  }
}
