import { Mesh, PlaneBufferGeometry, Scene, WebGLRenderer, PerspectiveCamera, IUniform, ShaderMaterial } from "three"

import { textureLoader } from '../../../Tools/utils'
// @ts-ignore
import { WORLDBUILDER_PRECISION, ENVIRONMENTS_COLOR_MAPS } from "@/js/constants"

import store from '../../../Store'
// @ts-ignore
import Time from '@tools/Time'
// @ts-ignore
import blendingVertex from '../../../../shaders/blendingVert.glsl'
// @ts-ignore
import blendingFragment from '../../../../shaders/blendingFrag.glsl'

interface MapHeighterParams {
    ground: Mesh
    time: Time
    envIndex: string
}

export default class MapHeighter {
    ground: Mesh
    time: Time
    blendingCanvas: HTMLCanvasElement
    blendMaterial: ShaderMaterial
    envIndex: string
    constructor({ ground, time, envIndex }: MapHeighterParams) {
        this.ground = ground
        this.time = time
        this.envIndex = envIndex
        this.handleChange = this.handleChange.bind(this)
        this.applyChange = this.applyChange.bind(this)
        this.init()
    }

    async init() {
        const src = ENVIRONMENTS_COLOR_MAPS[this.envIndex]
        const blendingScene = new Scene()
        const blendingRenderer = new WebGLRenderer()
        this.blendingCanvas = blendingRenderer.domElement
        const blendingCamera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
        blendingCamera.position.z = 8
        blendingRenderer.setSize(500, 500)
        const geometry = new PlaneBufferGeometry(2, 2, 1, 1)
        const textures = await Promise.all(src.map( _src => (textureLoader.loadAsync(_src))))
        this.blendMaterial = new ShaderMaterial({
            vertexShader: blendingVertex,
            fragmentShader: blendingFragment,
            uniforms: {
                values: { type: "fv", value: [1, 0, 0, 0] } as IUniform,
                map1: { type: "t", value: textures[0] } as IUniform,
                map2: { type: "t", value: textures[1] } as IUniform,
                map3: { type: "t", value: textures[2] } as IUniform,
                map4: { type: "t", value: textures[3] } as IUniform,
            },
            morphTargets: true
        })
        blendingScene.add( new Mesh( geometry, this.blendMaterial ) )

        // this.time.on('tick', () => {
        //     blendingRenderer.render(blendingScene, blendingCamera)
        // })
    }

    applyChange() {
        if (!(((this.ground.children[0] as Mesh).material) instanceof ShaderMaterial)) {
            console.log(this.blendMaterial);

            ;((this.ground.children[0] as Mesh).material) = this.blendMaterial
        }
    }

    handleChange(value: number) {
        const values = [0, 0, 0, 0]

        // get morph target influences
        const [ firstMapIndex, secondMapIndex ] = [ Math.floor(value/WORLDBUILDER_PRECISION) % values.length, (Math.floor(value/WORLDBUILDER_PRECISION) + 1) % values.length ]
        const firstMapInfluence = 1 - ((value%WORLDBUILDER_PRECISION)/WORLDBUILDER_PRECISION)
        const secondMapInfluence = ((value%WORLDBUILDER_PRECISION)/WORLDBUILDER_PRECISION)

        values[firstMapIndex] = firstMapInfluence
        values[secondMapIndex] = secondMapInfluence

        this.blendMaterial.uniforms.values.value = values

        const valuesCopy = [...values]
        valuesCopy.shift() // first value is for flat ground and can be ignored
        ;(this.ground.children[0] as Mesh).morphTargetInfluences = valuesCopy

        store.dispatch('updateMapHeight', valuesCopy)

        this.applyChange()

    }
}