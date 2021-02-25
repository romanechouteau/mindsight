import { AxesHelper, Object3D, WebGLRenderer } from 'three'

import AmbientLightSource from './AmbientLight'
import PointLightSource from './PointLight'
import Suzanne from './Suzanne'
import Character from './Character'

export default class World {
  time: any
  debug: any
  container: Object3D
  renderer: WebGLRenderer
  debugFolder: any
  loadDiv: any
  loadModels: any
  progress: any
  ambientlight: AmbientLightSource
  light: PointLightSource
  suzanne: Suzanne
  character: Character
  constructor(options) {
    // Set options
    this.time = options.time
    this.debug = options.debug
    this.renderer = options.renderer

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
    this.setCharacter()
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
  setCharacter() {
    this.character = new Character({
      time: this.time,
      renderer: this.renderer
    })
    this.container.add(this.character.container)
  }
}
