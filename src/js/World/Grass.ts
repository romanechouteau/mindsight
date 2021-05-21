import { Object3D, Mesh, InstancedMesh, Matrix4, DynamicDrawUsage, Vector3, Texture } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'

// @ts-ignore
import grassSrc from '@models/grass.gltf'

const loader = new GLTFLoader()

export default class Grass {
  time: any
  dummy: Object3D
  assets: any
  ground: Mesh
  params: {
    count: number
  }
  normal: Vector3
  surface: Mesh
  sampler: MeshSurfaceSampler
  position: Vector3
  rotationX: number
  grassMesh: InstancedMesh
  container: Object3D
  displacementMap: Texture
  constructor(options: { time: any, assets: any, ground: Mesh, rotationX: number, displacementMap: Texture }) {
    // Options
    const { time, assets, ground, rotationX, displacementMap } = options
    this.time = time
    this.assets = assets
    this.ground = ground
    this.rotationX = rotationX
    this.displacementMap = displacementMap

    // Set up
    this.container = new Object3D()
    this.container.name = 'Grass'

    this.params = {
        count: 1000
    }
    this.dummy = new Object3D()
    this.normal = new Vector3()
    this.position = new Vector3()

    this.init()
  }

  async init() {
    await this.createGrass()
  }

  async createGrass() {
    const grassScene = (await loader.loadAsync(grassSrc)).scene
    const grassModel = grassScene.children[0] as Mesh
    const grassGeometry = grassModel.geometry.clone()
    this.grassMesh = new InstancedMesh(grassGeometry, grassModel.material, this.params.count)

    const defaultTransform = new Matrix4()
        .makeRotationX(this.rotationX)
        .multiply( new Matrix4().makeScale(0.01, 0.01, 0.01))

    grassGeometry.applyMatrix4(defaultTransform)
    this.grassMesh.instanceMatrix.setUsage(DynamicDrawUsage)

    this.resample()

    this.container.add(this.grassMesh)
  }

  resample () {
    const groundGeometry = this.ground.geometry.toNonIndexed()
    const groundMaterial = this.ground.material
    this.surface = new Mesh(groundGeometry, groundMaterial)
    this.sampler = new MeshSurfaceSampler(this.surface)
        .setWeightAttribute(null)
        .build()

    for (let i = 0; i < this.params.count; i ++) {
        this.sampler.sample(this.position, this.normal)
        this.normal.add(this.position)

        this.dummy.position.copy(this.position)
        this.dummy.lookAt(this.normal)
        this.dummy.updateMatrix()

        this.grassMesh.setMatrixAt(i, this.dummy.matrix)
    }

    this.grassMesh.instanceMatrix.needsUpdate = true
  }
}
