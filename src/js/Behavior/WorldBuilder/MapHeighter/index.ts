import { CanvasTexture, Group, Mesh, MeshNormalMaterial, MeshStandardMaterial, PlaneBufferGeometry, Texture, Scene, WebGLRenderer, PerspectiveCamera, RawShaderMaterial, IUniform } from "three"
// @ts-ignore
import collineSrc from '@textures/plage_colline_displacement.png'
// @ts-ignore
import montagneSrc from '@textures/plage_montages_displacement.png'
// @ts-ignore
import plaineSrc from '@textures/plage_plaine_displacement.png'
// @ts-ignore
import valleeSrc from '@textures/plage_vallee_displacement.png'
import { textureLoader } from '../../../Tools/utils'
// @ts-ignore
import { WORLDBUILDER_PRECISION } from "@/js/constants"
import Environments from "../../../World/Environments"
import { throttle } from 'lodash'
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
}

export default class MapHeighter {
    ground: Mesh
    // ground: Environments
    time: Time
    displacementMaps: HTMLImageElement[]
    blendingCanvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    worker: Worker
    throttledBlend: Function
    blendMaterial: RawShaderMaterial
    blendParams: { firstMapIndex, firstMapInfluence, secondMapIndex, secondMapInfluence }
    constructor({ ground, time }: MapHeighterParams) {
        this.ground = ground
        this.time = time
        this.handleChange = this.handleChange.bind(this)
        this.init()
    }

    async init() {
        const src = [ collineSrc,montagneSrc,plaineSrc,valleeSrc]
        const blendingScene = new Scene()
        const blendingRenderer = new WebGLRenderer()
        this.blendingCanvas = blendingRenderer.domElement
        const blendingCamera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
        blendingCamera.position.z = 8
        blendingRenderer.setSize(500, 500)
        document.querySelector('.heighterDebug').appendChild(blendingRenderer.domElement)
        const geometry = new PlaneBufferGeometry(2, 2, 1, 1)
        const textures = await Promise.all(src.map( _src => (textureLoader.loadAsync(_src))))
        this.blendMaterial = new RawShaderMaterial({
            vertexShader: blendingVertex,
            fragmentShader: blendingFragment,
            uniforms: {
                values: { type: "fv", value: [1, 0, 0, 0] } as IUniform,
                map1: { type: "t", value: textures[0] } as IUniform,
                map2: { type: "t", value: textures[1] } as IUniform,
                map3: { type: "t", value: textures[2] } as IUniform,
                map4: { type: "t", value: textures[3] } as IUniform,
            },
        })
        blendingScene.add( new Mesh( geometry, this.blendMaterial ) )

        this.time.on('tick', () => {
            blendingRenderer.render(blendingScene, blendingCamera)
        })
        // init on the first type of landscape
        this.handleChange(0)
    }

    applyChange() {
        if (!((this.ground.material as MeshStandardMaterial).displacementMap instanceof CanvasTexture)) (this.ground.material as MeshStandardMaterial).displacementMap = new CanvasTexture(this.blendingCanvas)
        else (this.ground.material as MeshStandardMaterial).displacementMap.needsUpdate = true
    }

    handleChange(value: number) {
        const [ firstMapIndex, secondMapIndex ] = [ Math.floor(value/WORLDBUILDER_PRECISION) % this.blendMaterial.uniforms.values.value.length, (Math.floor(value/WORLDBUILDER_PRECISION) + 1) % this.blendMaterial.uniforms.values.value.length ]
        const firstMapInfluence = 1 - ((value%WORLDBUILDER_PRECISION)/WORLDBUILDER_PRECISION)
        const secondMapInfluence = ((value%WORLDBUILDER_PRECISION)/WORLDBUILDER_PRECISION)
        const values = [0, 0, 0, 0]

        values[firstMapIndex] = firstMapInfluence
        values[secondMapIndex] = secondMapInfluence
        this.blendMaterial.uniforms.values.value = values

        this.applyChange()
    }
}