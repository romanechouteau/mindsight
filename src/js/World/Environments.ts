import { MeshStandardMaterial, Object3D, Color, Mesh, PlaneBufferGeometry, DoubleSide, MeshBasicMaterial, Vector3, MeshNormalMaterial, FrontSide } from 'three'

import gsap from 'gsap/all'
import { debounce } from 'lodash'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import { Mouse } from '../Tools/Mouse'
import Time from '../Tools/Time'
// @ts-ignore
import envSrc1 from '@models/plane_vierge.glb'
// @ts-ignore
import store from '@store/index'
import Grass from './Grass'
import Water from './Water/Water'

import { ENV_DISTANCE, ENVIRONMENTS, ENVIRONMENT_INDICES, GROUND_SCALE } from '../constants'
import Camera from '../Camera'

import environmentsSrc from '../../models/ground.gltf'
// @ts-ignore
import collineSrc from '@textures/plage_colline_displacement.png'
import { modelLoader } from '../Tools/utils'

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
  constructor(options: { time: Time, assets?: any, mouse: Mouse, camera: Camera, debug: dat.GUI }) {
    const { time, assets, mouse, camera, debug } = options

    this.time = time
    this.mouse = mouse
    this.assets = assets
    this.camera = camera
    this.stopped = false
    this.isMoving = false
    this.debug = debug

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

    const environmentKeys = [ENVIRONMENTS.BEACH, ENVIRONMENTS.MEADOW, ENVIRONMENTS.TEST]

    for (let i = 0; i < environmentKeys.length; i++) {
      const ground = (await loader.loadAsync(environmentsSrc)).scene

      this.environments[i] = new Object3D()

      this.environments[i].scale.set(ground.children[0].scale.x * GROUND_SCALE, ground.children[0].scale.y * GROUND_SCALE, ground.children[0].scale.z * GROUND_SCALE)
      ground.children[0].scale.set(1., 1., 1.)
      ;(ground.children[0] as Mesh).material.side = DoubleSide

      this.environments[i].position.y = -2
      this.environments[i].position.z = - i * ENV_DISTANCE

      const grass = this.setGrass(ground, environmentKeys[i], this.environments[i].scale)

      let water
      if (i === ENVIRONMENT_INDICES.beach) {
        water = this.setWater(ground.children[0] as Mesh)
      }

      this.environments[i].add(ground, grass, water)
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

  setWater(groundMesh: Mesh) {
    groundMesh.geometry.computeBoundingBox()
    const size = new Vector3()
    groundMesh.geometry.boundingBox.getSize(size)
    size.multiplyScalar(1 - GROUND_SCALE*3) // seems to fit best like this
    // debugger
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

            const [currentLimit, oppositeLimit] = direction > 0 ? [lastEnvironment, 0] : [0, lastEnvironment]
            this.environments[oppositeLimit].position.z = - ENV_DISTANCE * oppositeLimit

            if (store.state.environment === currentLimit) {
              const position = direction * ENV_DISTANCE * (lastEnvironment - currentLimit + 1)
              this.environments[currentLimit].position.z = position
              this.container.position.z = - position
            } else {
              this.environments[currentLimit].position.z = - ENV_DISTANCE * currentLimit
            }

            gsap.to(this.container.position, {
                duration: 0.9,
                ease: 'power3.inOut',
                z: - this.environments[environment].position.z,
                onComplete: () => {
                    this.isMoving = false
                    store.dispatch('updateEnvironment', environment)
                }
            })
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
