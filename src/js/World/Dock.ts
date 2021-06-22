import { Object3D, Mesh, Vector3, ShaderMaterial, UniformsLib, UniformsUtils } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

// @ts-ignore
import dockSrc from '@models/dock.gltf'
// @ts-ignore
import vertexShader from '@shaders/dockVert.glsl'
// @ts-ignore
import fragmentShader from '@shaders/dockFrag.glsl'

import { BEACH_DOCKS } from '../constants'

import { textureLoader } from '../Tools/utils'

const loader = new GLTFLoader()

export default class Grass {
    time: any
    dock: Mesh
    docks: Mesh[]
    scale: Vector3
    ground: Mesh
    positions: number[]
    container: Object3D
    targetNormals: number[]
    dockMaterials: ShaderMaterial[]
    targetPositions: number[]
    baseDockMaterial: ShaderMaterial
    constructor(options: { time: any, ground: Mesh, scale: Vector3 }) {
        const { time, ground, scale } = options
        this.time = time
        this.scale = scale
        this.ground = ground

        this.container = new Object3D()
        this.container.name = 'Docks'

        this.docks = []
        this.dockMaterials = []
        this.positions = Array.from(this.ground.geometry.attributes.position.array)
        this.targetPositions = this.ground.geometry.morphAttributes.position
        this.targetNormals = this.ground.geometry.morphAttributes.normal
        this.baseDockMaterial = new ShaderMaterial({
            fog: true,
            vertexShader,
            fragmentShader,
            uniforms: UniformsUtils.merge([
                UniformsLib['fog'],
                {
                    uScale: { value: this.scale },
                    uMorphInfluences: { value: [0, 0, 0] },
                    uNormals: { value: [0, 0, 0] },
                    uMorphTargets1: { value: [0, 0, 0] },
                    uMorphTargets2: { value: [0, 0, 0] },
                    uMorphTargets3: { value: [0, 0, 0] },
                    uNormalsTarget1: { value: [0, 0, 0] },
                    uNormalsTarget2: { value: [0, 0, 0] },
                    uNormalsTarget3: { value: [0, 0, 0] },
                    uTexture: { value: textureLoader.load(BEACH_DOCKS[0].texture) }
                }
            ])
        })

        this.init()
    }

    async init() {
        await this.setDocks()
        this.setMovement()
    }

    async setDocks () {
        for (let i = 0; i < BEACH_DOCKS.length; i ++) {
            await this.createDock(i)
        }
        this.container.add(...this.docks)
    }

    async createDock(i) {
        const dockScene = (await loader.loadAsync(BEACH_DOCKS[i].model)).scene
        const dockModel = dockScene.children[0]

        const index = this.positions.findIndex((position, id) => {
            if (id % 3 !== 0) {
                return false
            }
            const minX = BEACH_DOCKS[i].position.x - 400
            const maxX = BEACH_DOCKS[i].position.x + 400
            const minZ = BEACH_DOCKS[i].position.z - 400
            const maxZ = BEACH_DOCKS[i].position.z + 400
            return position >= minX && position <= maxX && this.positions[id + 2] >= minZ && this.positions[id + 2] <= maxZ
        }) / 3

        const position = new Vector3(...this.getAttributeData(this.positions, index))
        const morphTargetsPositions = this.getAttributeTargetData(this.targetPositions, index)
        const morphTargetsNormals = this.getAttributeTargetData(this.targetNormals, index)
        const material = this.baseDockMaterial.clone()
        const texture = textureLoader.load(BEACH_DOCKS[i].texture)
        texture.flipY = false

        this.dock = new Mesh(dockModel.geometry, material)
        this.dock.scale.set(BEACH_DOCKS[i].scale, BEACH_DOCKS[i].scale, BEACH_DOCKS[i].scale)
        this.dock.position.copy(position)

        material.uniforms.uNormals.value = this.getAttributeData(this.ground.geometry.attributes.normal.array, index)
        material.uniforms.uMorphTargets1.value = morphTargetsPositions[0]
        material.uniforms.uMorphTargets2.value = morphTargetsPositions[1]
        material.uniforms.uMorphTargets3.value = morphTargetsPositions[2]
        material.uniforms.uNormalsTarget1.value = morphTargetsNormals[0]
        material.uniforms.uNormalsTarget2.value = morphTargetsNormals[1]
        material.uniforms.uNormalsTarget3.value = morphTargetsNormals[2]
        material.uniforms.uMorphInfluences.value = this.ground.morphTargetInfluences
        material.uniforms.uMorphInfluences.value = this.ground.morphTargetInfluences
        material.uniforms.uTexture.value = texture

        this.docks.push(this.dock)
        this.dockMaterials.push(material)
    }

    getAttributeData(attribute, index) {
        return [attribute[index * 3], attribute[index * 3 + 1], attribute[index * 3 + 2]]
    }

    getAttributeTargetData(targetData, index) {
        return targetData.map(data => this.getAttributeData(data.array, index))
    }

    setMovement () {
        this.time.on('tick', () => {
            this.dockMaterials.forEach(material => {
                material.uniforms.uMorphInfluences.value = this.ground.morphTargetInfluences
            })
        })
    }
}
