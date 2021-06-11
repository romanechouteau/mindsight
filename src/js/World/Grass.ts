import { Object3D, Mesh, InstancedMesh, Matrix4, DynamicDrawUsage, Vector3, ShaderMaterial, Color, DoubleSide, InstancedBufferAttribute } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

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
  scale: Vector3
  indexes: number[]
  positions: number[]
  grassMesh: InstancedMesh
  container: Object3D
  grassMaterial: ShaderMaterial
  environmentKey: string
  constructor(options: { time: any, ground: Mesh, scale: Vector3, environmentKey: string }) {
    const { time, ground, scale, environmentKey } = options
    this.time = time
    this.scale = scale
    this.ground = ground
    this.environmentKey = environmentKey || ENVIRONMENTS.BEACH

    this.container = new Object3D()
    this.container.name = 'Grass'

    this.dummy = new Object3D()
    this.params = {
        count: 3000
    }

    this.init()
  }

  async init() {
    await this.createGrass()
    this.setMovement()
  }

  async createGrass() {
    const grassScene = (await loader.loadAsync(grassSrc)).scene
    const grassModel = grassScene.children[0] as Mesh
    const grassGeometry = grassModel.geometry.clone()
    this.grassMaterial = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPI: { value: Math.PI },
        uScale: { value: this.scale },
        uColor1: { value: new Color(GRASS_COLOR[this.environmentKey][0]) },
        uColor2: { value: new Color(GRASS_COLOR[this.environmentKey][1]) },
        uColorSpecial1: { value: new Color(GRASS_COLOR[this.environmentKey][2]) },
        uColorSpecial2: { value: new Color(GRASS_COLOR[this.environmentKey][3]) },
        uMorphInfluences: { value: [0, 0, 0] }
      },
      side: DoubleSide
    })

    this.grassMesh = new InstancedMesh(grassGeometry, this.grassMaterial, this.params.count)

    const defaultTransform = new Matrix4()
      .multiply(new Matrix4().makeScale(5., 5., 5.))

    grassGeometry.applyMatrix4(defaultTransform)
    this.grassMesh.instanceMatrix.setUsage(DynamicDrawUsage)

    this.setGrass()

    this.container.add(this.grassMesh)
  }

  setGrass () {
    this.positions = Array.from(this.ground.geometry.attributes.position.array)
    const targetPositions = this.ground.geometry.morphAttributes.position
    const targetNormals = this.ground.geometry.morphAttributes.normal

    this.indexes = []
    const special = []
    const normals = []
    const morphTargets1 = []
    const morphTargets2 = []
    const morphTargets3 = []
    const normalsTarget1 = []
    const normalsTarget2 = []
    const normalsTarget3 = []

    for (let i = 0; i < this.params.count; i ++) {
      const randomScale = Math.random() * 0.7 + 0.5
      const randomIndex = this.getRandomIndex()
      const randomSpecial = Math.round(Math.random())

      const position = new Vector3(...this.getAttributeData(this.positions, randomIndex))
      this.dummy.position.copy(position)
      this.dummy.scale.set(randomScale, randomScale, randomScale)
      this.dummy.updateMatrix()
      this.grassMesh.setMatrixAt(i, this.dummy.matrix)

      const normal = this.getAttributeData(this.ground.geometry.attributes.normal.array, randomIndex)
      const morphTargetsPositions = this.getAttributeTargetData(targetPositions, randomIndex)
      const morphTargetsNormals = this.getAttributeTargetData(targetNormals, randomIndex)

      morphTargets1.push(...morphTargetsPositions[0])
      morphTargets2.push(...morphTargetsPositions[1])
      morphTargets3.push(...morphTargetsPositions[2])

      normals.push(...normal)
      normalsTarget1.push(...morphTargetsNormals[0])
      normalsTarget2.push(...morphTargetsNormals[1])
      normalsTarget3.push(...morphTargetsNormals[2])

      special.push(randomSpecial)
      this.indexes.push(randomIndex)
    }

    this.grassMesh.geometry.setAttribute('aSpecial',
      new InstancedBufferAttribute(new Float32Array(special), 1)
    )
    this.grassMesh.geometry.setAttribute('aMorphTargets1',
      new InstancedBufferAttribute(new Float32Array(morphTargets1), 3)
    )
    this.grassMesh.geometry.setAttribute('aMorphTargets2',
      new InstancedBufferAttribute(new Float32Array(morphTargets2), 3)
    )
    this.grassMesh.geometry.setAttribute('aMorphTargets3',
      new InstancedBufferAttribute(new Float32Array(morphTargets3), 3)
    )
    this.grassMesh.geometry.setAttribute('aNormals',
      new InstancedBufferAttribute(new Float32Array(normals), 3)
    )
    this.grassMesh.geometry.setAttribute('aNormalsTarget1',
      new InstancedBufferAttribute(new Float32Array(normalsTarget1), 3)
    )
    this.grassMesh.geometry.setAttribute('aNormalsTarget2',
      new InstancedBufferAttribute(new Float32Array(normalsTarget2), 3)
    )
    this.grassMesh.geometry.setAttribute('aNormalsTarget3',
      new InstancedBufferAttribute(new Float32Array(normalsTarget3), 3)
    )

    this.grassMesh.instanceMatrix.needsUpdate = true
    this.grassMaterial.uniforms.uMorphInfluences.value = this.ground.morphTargetInfluences
  }

  getAttributeData(attribute, index) {
    return [attribute[index * 3], attribute[index * 3 + 1], attribute[index * 3 + 2]]
  }

  getAttributeTargetData(targetData, index) {
    return targetData.map(data => this.getAttributeData(data.array, index))
  }

  getRandomIndex() {
    const max = this.positions.length / 3
    if (this.indexes.length >= max) {
      return Math.floor(Math.random() * max)
    }
    let index = Math.floor(Math.random() * max)
    while (this.indexes.includes(index)) {
      index = Math.floor(Math.random() * max)
    }
    return index
  }

  setMovement () {
    this.time.on('tick', () => {
      this.grassMaterial.uniforms.uTime.value += 0.015
      this.grassMaterial.uniforms.uMorphInfluences.value = this.ground.morphTargetInfluences
    })
  }
}
