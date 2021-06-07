import { Object3D, Mesh, InstancedMesh, Matrix4, DynamicDrawUsage, Vector3, ShaderMaterial, Color, DoubleSide, InstancedBufferAttribute, Points, PointsMaterial } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'

// @ts-ignore
import grassSrc from '@models/grass.gltf'
// @ts-ignore
import vertexShader from '@shaders/grassVert.glsl'
// @ts-ignore
import fragmentShader from '@shaders/grassFrag.glsl'

import { GRASS_COLOR, ENVIRONMENTS } from '../constants'

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
  grassMaterial: ShaderMaterial
  environmentKey: string
  constructor(options: { time: any, assets: any, ground: Mesh, environmentKey: string }) {
    // Options
    const { time, assets, ground, environmentKey } = options
    this.time = time
    this.assets = assets
    this.ground = ground
    this.environmentKey = environmentKey || ENVIRONMENTS.BEACH

    // Set up
    this.container = new Object3D()
    this.container.name = 'Grass'

    this.params = {
        count: 500
    }
    this.dummy = new Object3D()
    this.normal = new Vector3()
    this.position = new Vector3()

    this.init()
  }

  async init() {
    await this.createGrass()
    this.setMovement()
  }

  async createGrass() {
    const grassScene = (await loader.loadAsync(grassSrc)).scene
    const grassModel = grassScene.children[1] as Mesh
    const grassGeometry = grassModel.geometry.clone()
    this.grassMaterial = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new Color(GRASS_COLOR[this.environmentKey][0]) },
        uColor2: { value: new Color(GRASS_COLOR[this.environmentKey][1]) },
        uColorSpecial1: { value: new Color(GRASS_COLOR[this.environmentKey][2]) },
        uColorSpecial2: { value: new Color(GRASS_COLOR[this.environmentKey][3]) }
      },
      side: DoubleSide
    })
    this.grassMesh = new InstancedMesh(grassGeometry, this.grassMaterial, this.params.count)

    const defaultTransform = new Matrix4()
        .makeRotationX(Math.PI / 2)
        .multiply(new Matrix4().makeScale(10., 10., 10.))

    grassGeometry.applyMatrix4(defaultTransform)
    this.grassMesh.instanceMatrix.setUsage(DynamicDrawUsage)

    this.resample()

    this.container.add(this.grassMesh)
    this.container.position.z = 0.5
  }

  resample () {
    const groundGeometry = this.ground.geometry.toNonIndexed()
    const groundMaterial = this.ground.material
    this.surface = new Mesh(groundGeometry, groundMaterial)
    this.sampler = new MeshSurfaceSampler(this.surface)
        .setWeightAttribute(null)
        .build()

    const testMaterial = new PointsMaterial({ morphTargets: true })
    this.test = new Points(this.ground.geometry, testMaterial)
    this.test.morphTargetInfluences = this.ground.morphTargetInfluences
    this.test.morphTargetDictionary = this.ground.morphTargetDictionary
    this.container.add(this.test)

    const special = []

    for (let i = 0; i < this.params.count; i ++) {
        this.sampler.sample(this.position, this.normal)
        this.normal.add(this.position)

        this.dummy.position.copy(this.position)
        this.dummy.lookAt(this.normal)
        this.dummy.updateMatrix()

        this.grassMesh.setMatrixAt(i, this.dummy.matrix)
        special.push(Math.round(Math.random()))
    }

    this.grassMesh.geometry.setAttribute('aSpecial',
      new InstancedBufferAttribute(new Float32Array(special), 1)
    )

    this.grassMesh.instanceMatrix.needsUpdate = true
  }

  setMovement () {
    this.time.on('tick', () => {
      this.grassMaterial.uniforms.uTime.value += 0.01
      this.test.morphTargetInfluences = this.ground.morphTargetInfluences
    })
  }
}
