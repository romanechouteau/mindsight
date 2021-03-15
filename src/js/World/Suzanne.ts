import { Object3D } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
// @ts-ignore
import suzanneSrc from '@models/suzanne2.glb'

const loader = new GLTFLoader()

export default class Suzanne {
  time: any
  assets: any
  container: Object3D
  suzanne: any
  constructor(options) {
    // Options
    this.time = options.time
    this.assets = options.assets

    // Set up
    this.container = new Object3D()
    this.container.name = 'Suzanne'

    this.createSuzanne()
    this.setMovement()
  }
  async createSuzanne() {
    this.suzanne = (await loader.loadAsync(suzanneSrc)).scene
    this.container.add(this.suzanne)
  }
  setMovement() {
    this.time.on('tick', () => {
      this.suzanne.rotation.y += 0.005
    })
  }
}
