import { Group, Mesh, Object3D, Vector2, RawShaderMaterial, ShaderMaterial, MeshBasicMaterial, WebGLRenderTarget, CubeRefractionMapping, CubeCamera, MeshPhongMaterial, RepeatWrapping, RGBFormat, LinearMipmapLinearFilter, WebGLCubeRenderTarget } from "three"
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
    glassMaterial2: MeshBasicMaterial
    glassMaterial3: MeshPhongMaterial
    time: Time
    cubeCamera: CubeCamera
    constructor({ scene, spreadDimensions, time }: ShapeCreatorParams) {
        this.scene = scene
        this.time = time
        this.spreadDimensions = spreadDimensions || new Vector2(15, 15)
        this.handleChange = this.handleChange.bind(this)

        const roughness= textureLoader.load(glassRoughness), noise=textureLoader.load(glassNoise)

        roughness.wrapS = roughness.wrapT = RepeatWrapping
        noise.wrapS = noise.wrapT = RepeatWrapping

        this.glassMaterial = new ShaderMaterial({
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
                    value: roughness
                },
                tNoise: {
                    value: noise
                }
            },
            vertexShader: glassVertex,
            fragmentShader: glsl(glassFragment),
            transparent: true,
            morphTargets: true
        })

        // const cubeRenderTarget = new WebGLCubeRenderTarget( 128, { format: RGBFormat, generateMipmaps: true, minFilter: LinearMipmapLinearFilter } );
        // App.cubeCamera = new CubeCamera( 0.1, 5000, cubeRenderTarget )
        // App.scene.add( this.cubeCamera )
        
        // App.cubeCamera.renderTarget.mapping = CubeRefractionMapping


        // this.glassMaterial2 = new MeshBasicMaterial( { 
        //     color: 0xccccff,
        //     // @ts-ignore
        //     envMap: cubeRenderTarget.texture,
        //     refractionRatio: 0.985, 
        //     reflectivity: 0.9 
        //     } )

        // this.glassMaterial3 = new MeshPhongMaterial( { 
        //     color: 0xffffff, 
        //     envMap: cubeRenderTarget.texture, 
        //     refractionRatio: 0.98 
        // } )

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
        this.time.on('tick', () => shapeMesh.material.uniforms['time'].value += 0.0005)
        
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
        
        // @ts-ignore
        this.container.children.forEach(child => App.translucentObjects.push(child))
        // this.time.on('tick', () => {
        //     this.container.children.forEach(child => {
        //         child.visible = false
        //         this.cubeCamera.position.copy( child.position );
        //         // @ts-ignore
        //         this.cubeCamera.update( App.renderer, App.scene );
        //         child.visible = true
        //     })
        // })

        // this.prepareMorph()
        // this.prepareClonesMorph()
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
        console.log(shapeMesh.morphTargetInfluences);
        shapeMesh.morphTargetInfluences[0] = value / (4 * WORLDBUILDER_PRECISION)
    }
}