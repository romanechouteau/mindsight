import { MeshStandardMaterial, Object3D, Color, Mesh, PlaneBufferGeometry, DoubleSide } from 'three'
import gsap from 'gsap/all'
import { debounce } from 'lodash'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import { Mouse } from '../Tools/Mouse'
// @ts-ignore
import envSrc1 from '@models/plane_vierge.glb'
// @ts-ignore
import store from '@store/index'

import { ENV_DISTANCE } from '../constants'
import Camera from '../Camera'

import collineSrc from '@textures/plage_colline_displacement.png'
import { textureLoader } from '../Tools/utils'

const loader = new GLTFLoader()

export default class Environments {
  mouse: Mouse
  assets: any
  camera: Camera
  stopped: Boolean
  isMoving: Boolean
  container: Object3D
  environments: any[]
  handleScroll: Function
  constructor(options: { assets?: any, mouse: Mouse, camera: Camera }) {
    const { assets, mouse, camera } = options

    this.mouse = mouse
    this.assets = assets
    this.camera = camera
    this.stopped = false
    this.isMoving = false
    this.camera.container.position.y = 3

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
    for (let i = 0; i < 4; i++) {
      this.environments[i] = new Mesh(
        new PlaneBufferGeometry(40, 40, 200, 200),
        new MeshStandardMaterial({
          color: new Color(`hsl(${255 / 4 * i}, 100%, 50%)`),
          displacementMap: (await textureLoader.loadAsync(collineSrc)),
          displacementScale: 10,
          side: DoubleSide
        })
      )
      // this.environments[i].scale.set(0.01, 0.01, 0.01)
      this.environments[i].rotation.y = Math.PI
      this.environments[i].position.y = -5
      this.environments[i].rotation.x = Math.PI/2
      this.environments[i].position.z = - i * ENV_DISTANCE 
    }

    this.container.add(...this.environments)
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
