import { CanvasTexture, Group, Mesh, MeshNormalMaterial, MeshStandardMaterial, PlaneBufferGeometry, Texture, Scene, WebGLRenderer, PerspectiveCamera, RawShaderMaterial, IUniform } from "three"
import collineSrc from '@textures/plage_colline_displacement.png'
import montagneSrc from '@textures/plage_montages_displacement.png'
import plaineSrc from '@textures/plage_plaine_displacement.png'
import valleeSrc from '@textures/plage_vallee_displacement.png'
import { textureLoader } from '../../../Tools/utils'
import { WORLDBUILDER_PRECISION } from "@/js/constants"
import Environments from "../../../World/Environments"
import { throttle } from 'lodash'
import store from '../../../Store'
// @ts-ignore
import Time from '@tools/Time'

import blendingVertex from '../../../../shaders/blendingVert.glsl'
import blendingFragment from '../../../../shaders/blendingFrag.glsl'

interface MapHeighterParams {
    ground: Mesh
    time: Time
}

export default class MapHeighter {
    ground: Mesh
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
    }

    applyChange() {
        if (!((this.ground.material as MeshStandardMaterial).displacementMap instanceof CanvasTexture)) (this.ground.material as MeshStandardMaterial).displacementMap = new CanvasTexture(this.blendingCanvas)
        else (this.ground.material as MeshStandardMaterial).displacementMap.needsUpdate = true
    }

    handleChange(value: number) {
        const values = [0, 0, 0, 0]
        
        const [ firstMapIndex, secondMapIndex ] = [ Math.floor(value/WORLDBUILDER_PRECISION) % values.length, (Math.floor(value/WORLDBUILDER_PRECISION) + 1) % values.length ]
        const firstMapInfluence = 1 - ((value%WORLDBUILDER_PRECISION)/WORLDBUILDER_PRECISION)
        const secondMapInfluence = ((value%WORLDBUILDER_PRECISION)/WORLDBUILDER_PRECISION)

        values[firstMapIndex] = firstMapInfluence
        values[secondMapIndex] = secondMapInfluence

        values.shift() // first value is for flat ground and can be ignored

        ;(this.ground.children[0] as Mesh).morphTargetInfluences = values

    }
}