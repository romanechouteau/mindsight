import { AxesHelper, FogExp2, Fog, Object3D } from 'three'

// @ts-ignore
import Time from '@tools/Time'
// @ts-ignore
import { Mouse } from '@tools/Mouse'
// @ts-ignore
import Camera from '@js/Camera'

import User from './User'
// @ts-ignore
import store from '@store/index'
import Brush from './Brush'
import Ground from './Ground'
import Suzanne from './Suzanne'
import SceneManager from "../Behavior/SceneManager"
import AudioManager from "../Behavior/AudioManager"
// @ts-ignore
import Component from '@lib/Component'
import PointLightSource from './PointLight'
import AmbientLightSource from './AmbientLight'
import { AUDIO_INPUT_MODES } from '../constants'
import Spotify from '../Behavior/Sound/Spotify'
import SceneManager from "../Behavior/SceneManager"

export default class World extends Component {
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
  spotify: Spotify
  sceneManager: SceneManager
  constructor(options) {
    super({
      store
    })

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
    this.setSceneManager()
    // this.setSuzanne()
    this.setGround()
    this.setUser()
    this.setSceneManager()
    this.render()
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
      ground: this.ground,
      canvas: this.canvas
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
      debug: this.debugFolder
    })
    store.events.subscribe('setSpotifyAudioData', this.brush.setSpotifyMovement)
  }

  setSceneManager() {
    this.sceneManager = new SceneManager()
  }

  setSpotify() {
    this.spotify = new Spotify()
  }

  render() {
    if (store.state.scene === 3 && this.brush === undefined) {
      this.setBrush()
    } else if (store.state.scene !== 3 && this.brush !== undefined && this.brush.stopped === false) {
      this.brush.stop()
    }

    if (store.state.scene === 4 && AudioManager.started === false) {
      AudioManager.start()
    } else if (store.state.scene !== 4 && AudioManager.started === true) {
      AudioManager.stop()
    }
    if (store.state.scene === 4 && store.state.audioInputMode === AUDIO_INPUT_MODES.SPOTIFY && this.spotify === undefined) {
      this.setSpotify()
    }
  }
}
