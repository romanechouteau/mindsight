import { Object3D } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
// @ts-ignore
import groundSrc from '@models/angy_environment.glb'

const loader = new GLTFLoader()

export default class Ground {
  time: any
  assets: any
  container: Object3D
  ground: any
  constructor(options) {
    // Options
    this.time = options.time
    this.assets = options.assets

    // Set up
    this.container = new Object3D()
    this.container.name = 'Ground'

    this.createGround()
  }

  async createGround() {
    this.ground = (await loader.loadAsync(groundSrc)).scene
    this.container.add(this.ground)
  }
}
