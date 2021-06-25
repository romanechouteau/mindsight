import { AxesHelper, Fog, Object3D, Scene } from 'three'

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
import Environments from './Environments'
import SceneManager from "../Behavior/SceneManager"
import AudioManager from "../Behavior/AudioManager"
import PointerCursor from '../Tools/PointerCursor'
// @ts-ignore
import Component from '@lib/Component'
import PointLightSource from './PointLight'
import AmbientLightSource from './AmbientLight'
import WorldBuilder from "../Behavior/WorldBuilder"
import EyeTrackingManager from '../Behavior/EyeTrackingManager'
import { SCENES, START_FOG_FAR } from '../constants'
import Gravity from '../Behavior/Gravity'
import ModeManager from '../Behavior/ModeManager'
import WordManager from '../Behavior/WordManager'

export default class World extends Component {
  time: Time
  debug: dat.GUI
  mouse: Mouse
  sizes: any
  canvas: HTMLElement
  camera: Camera
  container: Object3D
  debugFolder: any
  loadDiv: any
  loadModels: any
  progress: any
  globalScene: Scene
  ambientlight: AmbientLightSource
  light: PointLightSource
  brush: Brush
  pixelRatio: number
  user: User
  sceneManager: SceneManager
  worldBuilder: WorldBuilder
  environments: Environments
  pointerCursor: PointerCursor
  eyeTrackingManager: EyeTrackingManager
  gravity: Gravity
  modeManager: ModeManager
  wordManager: WordManager
  constructor(options) {
    super({
      store
    })

    // Set options
    this.time = options.time
    this.debug = options.debug
    this.sizes = options.sizes
    this.mouse = options.mouse
    this.camera = options.camera
    this.canvas = options.canvas
    this.pixelRatio = options.pixelRatio
    this.globalScene = options.globalScene
    this.pointerCursor = options.pointerCursor
    // Set up
    this.container = new Object3D()
    this.container.name = 'World'

    if (this.debug) {
      this.container.add(new AxesHelper(5))
      this.debugFolder = this.debug.addFolder('World')
    }

    this.setLoader()
  }
  init() {
    this.setAmbientLight()
    this.setPointLight()
    this.setSceneManager()
    this.setFog()
    this.render()
  }
  setLoader() {
    this.loadDiv = document.querySelector('.loadScreen')
    this.loadModels = this.loadDiv.querySelector('.load')
    this.progress = this.loadDiv.querySelector('.progress')

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
  setFog() {
    this.globalScene.fog = new Fog(0xF4C5B5, 0.01, START_FOG_FAR)
  }

  setUser() {
    this.user = new User({
      camera: this.camera,
      mouse: this.mouse,
      ground: this.environments,
      canvas: this.canvas,
      scene: this.container,
      gravity: this.gravity,
      pixelRatio: this.pixelRatio,
      globalScene: this.globalScene,
      time: this.time
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

  setEnvironments() {
    this.environments = new Environments({
      mouse: this.mouse,
      camera: this.camera,
      time: this.time,
      debug: this.debug
    })
    this.container.add(this.environments.container)
  }

  setSceneManager() {
    this.sceneManager = new SceneManager({
      pointerCursor: this.pointerCursor
    })
  }

  setWorldBuilder() {
    this.worldBuilder = new WorldBuilder({
      scene: this.container,
      globalScene: this.globalScene,
      time: this.time,
      debug: this.debug,
      ground: this.environments,
      pointerCursor: this.pointerCursor
    })
  }

  setModeManager() {
    this.modeManager = new ModeManager()
  }

  setEyeTrackingManager() {
    this.eyeTrackingManager = new EyeTrackingManager({
      sizes: this.sizes,
      debug: this.debug,
      camera: this.camera
    })
  }

  setWordManager() {
    this.wordManager = new WordManager()
  }

  render() {
    if (store.state.scene === SCENES.EYETRACKING && this.eyeTrackingManager === undefined) {
      this.eyeTrackingManager = null // prevent from being undefined
      setTimeout(() => {
        this.setEyeTrackingManager()
      }, 2000)
    } else if (store.state.scene !== SCENES.EYETRACKING && this.eyeTrackingManager !== undefined && this.eyeTrackingManager.stopped === false) {
      this.eyeTrackingManager.stop()
    }

    if (store.state.scene >= SCENES.EYETRACKING && this.modeManager === undefined) {
      this.setModeManager()
    }

    if (store.state.scene === SCENES.ENVIRONMENT && this.environments === undefined) {
      if (this.eyeTrackingManager === undefined && document.querySelector('#eyetrackingManager')) {
        document.querySelector('#eyetrackingManager').remove()
      }

      this.setEnvironments()
    } else if (store.state.scene !== SCENES.ENVIRONMENT && this.environments !== undefined && this.environments.stopped === false) {
      this.environments.stop()
    }

    if (store.state.scene === SCENES.PARAMETERS && this.worldBuilder === undefined) {
      this.setWorldBuilder()
      if (this.user === undefined) {
        this.setUser()
      }
      this.gravity = new Gravity({ objects: [{originObject: this.camera.camera, movableObject: this.camera.container}], time: this.time, ground: this.environments.container.children[0] })
    } else if (store.state.scene !== SCENES.PARAMETERS && this.worldBuilder !== undefined && this.worldBuilder.stopped === false) {
      this.worldBuilder.stop()
    }

    if (store.state.scene === SCENES.BRUSH) {
      if (this.brush === undefined) {
        this.setBrush()
      }
     } else if (store.state.scene !== SCENES.BRUSH && this.brush !== undefined && this.brush.stopped === false) {
      this.brush.stop()
    }

    if (store.state.scene === SCENES.AUDIO && AudioManager.started === false) {
      AudioManager.start()
    } else if (store.state.scene !== SCENES.AUDIO && AudioManager.started === true) {
      AudioManager.stop()
    }

    if (store.state.scene === SCENES.WORD && this.wordManager === undefined) {
      this.setWordManager()
    } else if (store.state.scene !== SCENES.WORD && this.wordManager !== undefined && this.wordManager.started === true) {
      this.wordManager.stop()
    }
  }
}
