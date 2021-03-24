import { Object3D, Mesh, MeshBasicMaterial, DoubleSide } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
// @ts-ignore
import groundSrc from '@models/angy_environment.glb'

const loader = new GLTFLoader()

export default class Ground {
  time: any
  assets: any
  container: Object3D
  ground: Object3D
  fakeGround: Object3D
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
    // this.fakeGround = this.ground.clone(true)
    // this.fakeGround.children.forEach(mesh => (mesh as Mesh).material = new MeshBasicMaterial({ opacity: 0, side: DoubleSide }))
    // this.container.add(this.fakeGround)
    this.container.add(this.ground)
  }
}
