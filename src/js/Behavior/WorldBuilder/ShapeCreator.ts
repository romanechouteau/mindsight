import { Group, Mesh, Object3D, Vector2, RawShaderMaterial, MeshLambertMaterial, ShaderMaterial, MeshBasicMaterial, BackSide, MixOperation ,WebGLRenderTarget, CubeRefractionMapping, CubeCamera, MeshPhongMaterial, RepeatWrapping, RGBFormat, LinearMipmapLinearFilter, WebGLCubeRenderTarget } from "three"
// @ts-ignore
import shape3Src from '@models/testShape1.glb'
// @ts-ignore
import shape4Src from '@models/testShape2.glb'
// @ts-ignore
import shape1Src from '@models/Rond.gltf'
// @ts-ignore
import shape2Src from '@models/Formes_Morph.glb'
import { modelLoader, textureLoader } from '../../Tools/utils'
import { SHAPE_NUMBER, WORLDBUILDER_PRECISION } from "../../constants"

import glsl from 'glslify'
// @ts-ignore
import glassVertex from '../../../shaders/glassVert.glsl'
// @ts-ignore
import glassFragment from '../../../shaders/glassFrag.glsl'

// @ts-ignore
import glassRoughness from '../../../images/textures/glass/roughness.jpg'
// @ts-ignore
import glassNoise from '../../../images/textures/glass/noise.jpg'
import Time from "../../Tools/Time"

interface ShapeCreatorParams {
    scene: Object3D
    spreadDimensions: Vector2,
    time: Time
}

export default class ShapeCreator {
    mainShape: Object3D
    container: Group
    scene: Object3D
    shapes: Object3D[]
    spreadDimensions: Vector2
    glassMaterial: MeshBasicMaterial
    time: Time
    cubeCamera: CubeCamera
    shapeMesh: Mesh
    constructor({ scene, spreadDimensions, time }: ShapeCreatorParams) {
        this.scene = scene
        this.time = time
        this.spreadDimensions = spreadDimensions || new Vector2(15, 15)
        this.handleChange = this.handleChange.bind(this)

        this.glassMaterial = new MeshBasicMaterial({ 
            // @ts-ignore
            map: App.renderTarget.texture,
            color: 0xa6ceff,
            transparent: true,
            opacity: 0.75,
            morphTargets: true
         })

        this.init = this.init.bind(this)
        this.init()
    }

    async init () {
        this.container = new Group()
        this.container.name = 'World Shapes'
        this.shapes =
            (await Promise.all([
                modelLoader.loadAsync(shape2Src),
            ]))
            .map(gltf => gltf.scene)

        this.mainShape = this.shapes[0]
        const shapeMesh = (this.mainShape.children as Mesh[]).find(child => child.isMesh)
        shapeMesh.scale.set(0.005, 0.005, 0.005)
        const { geometry, material } = shapeMesh

        shapeMesh.material = this.glassMaterial
        this.shapeMesh = shapeMesh
        
        // create clones
        for (let i = 0; i < SHAPE_NUMBER; i++) {
            const mesh = this.shapeMesh.clone()
            mesh.position.x = (Math.random() - 0.5) * 30
            mesh.position.z = (Math.random() - 0.5) * 30
            this.container.add(mesh)
        }

        this.container.add(this.shapeMesh)
        this.scene.add(this.container)
        
        // @ts-ignore
        this.container.children.forEach(child => App.translucentObjects.push(child))
    }

    prepareMorph(mesh?: Mesh) {
        const shapeMesh = mesh ?? (this.container.getObjectByName('Cube002') as Mesh)
        delete shapeMesh.geometry.morphAttributes.normal
    }

    prepareClonesMorph() {
        this.container.traverse(child => {
            if ((child as Mesh).isMesh) this.prepareMorph(child as Mesh)
        })
    }

    handleChange(value: number) {
        this.container.traverse(child => {
            if ((child as Mesh).isMesh) child.morphTargetInfluences[1] = value / (4 * WORLDBUILDER_PRECISION)
        })
    }
}