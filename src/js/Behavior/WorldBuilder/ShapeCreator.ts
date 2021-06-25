import { Group, Mesh, Object3D, Vector2, RawShaderMaterial, MeshBasicMaterial, WebGLRenderTarget } from "three"
// @ts-ignore
import shape3Src from '@models/testShape1.glb'
// @ts-ignore
import shape4Src from '@models/testShape2.glb'
// @ts-ignore
import shape1Src from '@models/Rond.gltf'
// @ts-ignore
import shape2Src from '@models/Triangle.gltf'
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
    glassMaterial: RawShaderMaterial
    time: Time
    constructor({ scene, spreadDimensions, time }: ShapeCreatorParams) {
        this.scene = scene
        this.time = time
        this.spreadDimensions = spreadDimensions || new Vector2(15, 15)
        this.handleChange = this.handleChange.bind(this)

        console.log(App);
        
        debugger

        this.glassMaterial = new RawShaderMaterial({
            uniforms: {
                time: {
                    value: 0
                },
                resolution: {
                    value: new Vector2(document.body.clientWidth, window.innerHeight)
                },
                tScene: {
                    // @ts-ignore
                    value: App.renderTarget.texture
                },
                tRoughness: {
                    value: textureLoader.load(glassRoughness)
                },
                tNoise: {
                    value: textureLoader.load(glassNoise)
                }
            },
            vertexShader: glsl(glassVertex),
            fragmentShader: glsl(glassFragment),
            transparent: true
        })
        this.init = this.init.bind(this)
        this.init()
    }

    async init () {
        this.container = new Group()
        this.container.name = 'World Shapes'
        this.shapes =
            (await Promise.all([
                modelLoader.loadAsync(shape1Src),
                modelLoader.loadAsync(shape2Src),
                modelLoader.loadAsync(shape3Src),
                modelLoader.loadAsync(shape4Src),
            ]))
            .map(gltf => gltf.scene)

        this.mainShape = this.shapes[0]
        const shapeMesh = (this.mainShape.children as Mesh[]).find(child => child.isMesh)
        const { geometry, material } = shapeMesh

        shapeMesh.material = this.glassMaterial
        // shapeMesh.material.uniforms.tRoughness.value = 
        this.time.on('tick', () => shapeMesh.material.uniforms['time'].value += 0.05)
        
        // create clones
        for (let i = 0; i < SHAPE_NUMBER; i++) {
            const mesh = new Mesh(geometry, material)
            mesh.position.x = (Math.random() - 0.5) * 30
            // mesh.position.y = (Math.random() - 0.5) * 5
            mesh.position.z = (Math.random() - 0.5) * 30
            this.container.add(mesh)
        }
        this.container.add(this.mainShape)
        this.scene.add(this.container)
        this.prepareMorph()
        this.prepareClonesMorph()
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
        const shapeMesh = (this.container.getObjectByName('Cube002') as Mesh)
        shapeMesh.morphTargetInfluences[0] = value / (4 * WORLDBUILDER_PRECISION)
    }
}