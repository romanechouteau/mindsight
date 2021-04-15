import { Object3D, Mesh, MeshBasicMaterial, DoubleSide, Group, BoxBufferGeometry, MeshNormalMaterial, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
// @ts-ignore
import reliefSrc from '@models/mapTest.glb'
import groundSrc from '@models/sol__.glb'

const loader = new GLTFLoader()

export default class Ground {
  time: any
  assets: any
  container: Object3D
  ground: Object3D
  relief: Object3D
  // fakeGround: Object3D
  groundDeco: Group
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
    this.relief = (await loader.loadAsync(reliefSrc)).scene
    this.ground = (await loader.loadAsync(groundSrc)).scene
    this.ground.visible = false
    this.relief.scale.set(0.01, 0.01, 0.01)
    this.relief.rotation.y = Math.PI
    this.relief.position.z = 10
    // this.fakeGround = this.ground.clone(true)
    // this.fakeGround.children.forEach(mesh => (mesh as Mesh).material = new MeshBasicMaterial({ opacity: 0, side: DoubleSide }))
    // this.container.add(this.fakeGround)
    this.container.add(this.relief)
    this.container.add(this.ground)

    // this.relief.getObjectByName('Sol').visible = false
    // geometryModifier.subdividePlane((this.relief.getObjectByName('Sol') as Mesh), 1024)
  }

  // not needed anymore
  // generateDeco(basePoint: Vector3) {
  //   const decoGeometry = new BoxBufferGeometry(1, 1, 1)
  //   const decoMaterial = new MeshNormalMaterial()
  //   const deco = new Mesh(decoGeometry, decoMaterial)

  //   deco.translateX(basePoint.x + Math.random() * 2)
  //   deco.translateZ(basePoint.z + Math.random() * 2)
  // }
}
