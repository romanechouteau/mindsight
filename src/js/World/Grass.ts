import { Object3D, Mesh, InstancedMesh, Matrix4, DynamicDrawUsage, Vector3, ShaderMaterial, Color, DoubleSide, InstancedBufferAttribute, UniformsLib, UniformsUtils } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

// @ts-ignore
import grassBeachSrc from '@models/grass_beach.gltf'
// @ts-ignore
import grassMeadowSrc from '@models/grass_meadow.gltf'
// @ts-ignore
import vertexShader from '@shaders/grassVert.glsl'
// @ts-ignore
import specialGrassVert from '@shaders/specialGrassVert.glsl'
// @ts-ignore
import specialGrassFrag from '@shaders/specialGrassFrag.glsl'
// @ts-ignore
import fragmentShader from '@shaders/grassFrag.glsl'

import { GRASS_COLOR, ENVIRONMENTS, LIST_ENVIRONMENTS } from '../constants'

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
  container: Object3D
  grassMeshes: InstancedMesh[]
  grassMaterial: ShaderMaterial
  environmentKey: ENVIRONMENTS
  specialGrassMaterials: ShaderMaterial[]
  constructor(options: { time: any, ground: Mesh, scale: Vector3, environmentKey: ENVIRONMENTS }) {
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
    this.specialGrassMaterials = []

    this.init()
  }

  async init() {
    await this.createGrass()
    this.setMovement()
  }

  async createGrass() {
    const grassSrc = this.environmentKey === ENVIRONMENTS.MEADOW ? grassMeadowSrc : grassBeachSrc
    const grassScene = (await loader.loadAsync(grassSrc)).scene
    const grassModels = grassScene.children as Mesh[]
    const grassScale = this.environmentKey === ENVIRONMENTS.MEADOW ? 2 : 5

    this.grassMaterial = new ShaderMaterial({
      fog: true,
      vertexShader,
      fragmentShader,
      uniforms: UniformsUtils.merge([
        UniformsLib['fog'],
        {
          uTime: { value: 0 },
          uPI: { value: Math.PI },
          uScale: { value: this.scale },
          uColor1: { value: new Color(GRASS_COLOR[this.environmentKey][0]) },
          uColor2: { value: new Color(GRASS_COLOR[this.environmentKey][1]) },
          uColorSpecial1: { value: new Color(GRASS_COLOR[this.environmentKey][2]) },
          uColorSpecial2: { value: new Color(GRASS_COLOR[this.environmentKey][3]) },
          uGrassScale: { value: grassScale },
          uMorphInfluences: { value: [0, 0, 0] }
        }
      ]),
      side: DoubleSide
    })
    const baseSpecialGrassMaterial = new ShaderMaterial({
      fog: true,
      vertexShader: specialGrassVert,
      fragmentShader: specialGrassFrag,
      uniforms: UniformsUtils.merge([
        UniformsLib['fog'],
        {
          uTime: { value: 0 },
          uPI: { value: Math.PI },
          uScale: { value: this.scale },
          uGrassScale: { value: grassScale },
          uMorphInfluences: { value: [0, 0, 0] }
        }
      ]),
      transparent: true,
      side: DoubleSide
    })

    this.grassMeshes = grassModels.map((model, i) => {
      if (i !== 0) {
        const specialMaterial = baseSpecialGrassMaterial.clone()
        specialMaterial.uniforms.uMap = { value: model.material.map }
        this.specialGrassMaterials.push(specialMaterial)
      }
      const material = i === 0 ? this.grassMaterial : this.specialGrassMaterials[i - 1]

      return new InstancedMesh(model.geometry.clone(), material, this.params.count)
    })

    const defaultTransform = new Matrix4()
      .multiply(new Matrix4().makeScale(grassScale, grassScale, grassScale))

    this.grassMeshes.forEach(mesh => {
        mesh.geometry.applyMatrix4(defaultTransform)
        mesh.instanceMatrix.setUsage(DynamicDrawUsage)
    })

    this.setGrass()

    this.container.add(...this.grassMeshes)
  }

  setGrass () {
    this.positions = Array.from(this.ground.geometry.attributes.position.array)
    const targetPositions = this.ground.geometry.morphAttributes.position
    const targetNormals = this.ground.geometry.morphAttributes.normal
    const morphTargetsCount = this.ground.morphTargetInfluences.length + 1
    const colors = []
    for (let j = 0; j < morphTargetsCount; j++) {
      const index = LIST_ENVIRONMENTS.indexOf(this.environmentKey) * morphTargetsCount + j
      const attributeKey = index === 0 ? 'color' : `color_${index}`
      colors.push(this.ground.geometry.attributes[attributeKey])
    }

    this.indexes = []
    const special = []
    const normals = []
    const visible = []
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
      this.grassMeshes.forEach(mesh => {
        mesh.setMatrixAt(i, this.dummy.matrix)
      })

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

      visible.push(this.getColor(colors[0], randomIndex), this.getColor(colors[1], randomIndex), this.getColor(colors[2], randomIndex), this.getColor(colors[3], randomIndex))

      special.push(randomSpecial)
      this.indexes.push(randomIndex)
    }

    this.grassMeshes.forEach(mesh => {
      mesh.instanceMatrix.needsUpdate = true
      mesh.geometry.setAttribute('aSpecial',
        new InstancedBufferAttribute(new Float32Array(special), 1)
      )
      mesh.geometry.setAttribute('aMorphTargets1',
        new InstancedBufferAttribute(new Float32Array(morphTargets1), 3)
      )
      mesh.geometry.setAttribute('aMorphTargets2',
        new InstancedBufferAttribute(new Float32Array(morphTargets2), 3)
      )
      mesh.geometry.setAttribute('aMorphTargets3',
        new InstancedBufferAttribute(new Float32Array(morphTargets3), 3)
      )
      mesh.geometry.setAttribute('aNormals',
        new InstancedBufferAttribute(new Float32Array(normals), 3)
      )
      mesh.geometry.setAttribute('aNormalsTarget1',
        new InstancedBufferAttribute(new Float32Array(normalsTarget1), 3)
      )
      mesh.geometry.setAttribute('aNormalsTarget2',
        new InstancedBufferAttribute(new Float32Array(normalsTarget2), 3)
      )
      mesh.geometry.setAttribute('aNormalsTarget3',
        new InstancedBufferAttribute(new Float32Array(normalsTarget3), 3)
      )
      mesh.geometry.setAttribute('aVisible',
        new InstancedBufferAttribute(new Float32Array(visible), 4)
      )
    });
    this.grassMaterial.uniforms.uMorphInfluences.value = this.ground.morphTargetInfluences
    this.specialGrassMaterials.forEach(material => material.uniforms.uMorphInfluences.value = this.ground.morphTargetInfluences)
  }

  getColor(colors, index) {
    return colors.array[index * colors.itemSize]
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

      this.specialGrassMaterials.forEach(material => {
        material.uniforms.uTime.value += 0.015
        material.uniforms.uMorphInfluences.value = this.ground.morphTargetInfluences
      });
    })
  }
}
