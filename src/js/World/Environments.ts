import { Object3D, Mesh, DoubleSide, MeshBasicMaterial, Vector3 } from 'three'

import gsap from 'gsap/all'
import { debounce } from 'lodash'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import { Mouse } from '../Tools/Mouse'
import Time from '../Tools/Time'
// @ts-ignore
import store from '@store/index'
import Grass from './Grass'
import Dock from './Dock'
import Water from './Water/Water'

import { ENV_DISTANCE, LIST_ENVIRONMENTS, ENVIRONMENT_INDICES, GROUND_SCALE } from '../constants'
import Camera from '../Camera'

// @ts-ignore
import environmentsSrc from '../../models/ground.gltf'
// @ts-ignore
import plaineBeachTexture from '../../images/textures/beach/PlaineSurface_Color.jpg'
// @ts-ignore
import plaineMeadowTexture from '../../images/textures/meadow/PlaineSurface_Color.jpg'
// @ts-ignore
import { textureLoader } from '../Tools/utils'
import SoundManager from '../Behavior/SoundManager'
import SkyManager from '../Behavior/SkyManager'

const loader = new GLTFLoader()

export default class Environments {
  time: Time
  mouse: Mouse
  assets: any
  camera: Camera
  stopped: Boolean
  isMoving: Boolean
  container: Object3D
  environments: Object3D[]
  handleScroll: Function
  debug: dat.GUI
  current: number
  skyManager: SkyManager
  constructor(options: { time: Time, assets?: any, mouse: Mouse, camera: Camera, debug: dat.GUI, skyManager: SkyManager }) {
    const { time, assets, mouse, camera, debug, skyManager } = options

    SoundManager.playVoice(5)

    this.time = time
    this.mouse = mouse
    this.assets = assets
    this.camera = camera
    this.stopped = false
    this.isMoving = false
    this.debug = debug
    this.current = 0
    this.skyManager = skyManager

    this.container = new Object3D()
    this.container.name = 'Environments'

    this.init()
  }

  async init() {
    await this.createEnvironments()
    this.setScroll()
  }

  async createEnvironments() {
    this.environments = []

    for (let i = 0; i < LIST_ENVIRONMENTS.length; i++) {
      const ground = (await loader.loadAsync(environmentsSrc)).scene

      this.environments[i] = new Object3D()

      this.environments[i].scale.set(ground.children[0].scale.x * GROUND_SCALE, ground.children[0].scale.y * GROUND_SCALE, ground.children[0].scale.z * GROUND_SCALE)
      ground.children[0].scale.set(1., 1., 1.)
      ;(ground.children[0] as Mesh).material.side = DoubleSide
      ;(ground.children[0] as Mesh).material.vertexColors = false
      ;(ground.children[0] as Mesh).morphTargetInfluences[2] = 0 // reset exported mti

      this.environments[i].position.y = -2
      this.environments[i].position.z = - i * ENV_DISTANCE

      const grass = this.setGrass(ground, LIST_ENVIRONMENTS[i], this.environments[i].scale)
      SoundManager.play('vagues_plage')

      let water
      let dock
      if (i === ENVIRONMENT_INDICES.beach) {
        water = this.setWater(ground.children[0] as Mesh)
        dock = this.setDock(ground, this.environments[i].scale)
        ground.children[0].material = new MeshBasicMaterial({
          map: textureLoader.load(plaineBeachTexture),
          morphTargets: true
        })
      } else {
        water = new Object3D()
        dock = new Object3D()
        ground.children[0].material = new MeshBasicMaterial({
          map: textureLoader.load(plaineMeadowTexture),
          morphTargets: true
        })
      }
      ground.children[0].material.map.flipY = false

      this.environments[i].userData.envName = LIST_ENVIRONMENTS[i]

      this.environments[this.environments.length - 1].visible = false
      this.environments[0].visible = true

      this.environments[i].add(ground, grass, water, dock)
    }

    this.container.add(...this.environments)
  }

  setGrass(ground, environmentKey, scale) {
    const grass = new Grass({
      time: this.time,
      scale,
      ground: ground.children[0],
      environmentKey
    })

    return grass.container
  }
  setDock(ground, scale) {
    const dock = new Dock({
      time: this.time,
      scale,
      ground: ground.children[0],
    })

    return dock.container
  }

  setWater(groundMesh: Mesh) {
    groundMesh.geometry.computeBoundingBox()
    const size = new Vector3()
    groundMesh.geometry.boundingBox.getSize(size)
    size.multiplyScalar(1 - GROUND_SCALE*3) // seems to fit best like this
    const water = new Water({ time: this.time, dimensions: { width: size.x, height: size.z }, debug: this.debug})

    return water.container
  }

  setScroll() {
    const lastEnvironment = this.environments.length - 1

    this.handleScroll = debounce(() => {
        if (this.isMoving === false) {
            this.isMoving = true

            const direction = this.mouse.wheelDir === 'down' ? 1 : -1
            const index = (store.state.environment + direction) % this.environments.length
            const environment = index < 0 ? lastEnvironment : index

            if (environment === ENVIRONMENT_INDICES.meadow) {
              SoundManager.pause('vagues_plage')
              SoundManager.play('Vent_Herbes')
            } else {
              SoundManager.play('vagues_plage')
              SoundManager.pause('Vent_Herbes')
            }

            const water = this.environments[environment].getObjectByName('WaterContainer')
            if (water) water.visible = false

            const [currentLimit, oppositeLimit] = direction > 0 ? [lastEnvironment, 0] : [0, lastEnvironment]
            this.environments[oppositeLimit].position.z = - ENV_DISTANCE * oppositeLimit

            if (store.state.environment === currentLimit) {
              const position = direction * ENV_DISTANCE * (lastEnvironment - currentLimit + 1)
              this.environments[currentLimit].position.z = position
              this.container.position.z = - position
            } else {
              this.environments[currentLimit].position.z = - ENV_DISTANCE * currentLimit
            }

            this.environments[environment].visible = true
            this.environments[Math.abs(environment - 1)].visible = true

            gsap.to(this.container.position, {
              duration: 1.5,
              ease: 'power3.inOut',
              z: - this.environments[environment].position.z,
              onComplete: () => {
                this.isMoving = false
                store.dispatch('updateEnvironment', environment)
                this.environments[Math.abs(environment - 1)].visible = false
                if (water) water.visible = true
                }
            })
            this.skyManager.handleEnvChange(environment)

        }
    }, 100, { leading: true, trailing: false, maxWait: 1500 })

    this.mouse.on('wheel', this.handleScroll)
  }

  stop() {
      this.mouse.off('wheel', this.handleScroll)
      this.container.remove(...this.environments.filter((_, index) => index !== store.state.environment))
      this.stopped = true
  }
}
