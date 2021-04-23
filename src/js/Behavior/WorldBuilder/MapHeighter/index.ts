import { Texture } from "three"
import collineSrc from '@textures/plage_colline_displacement.png'
import montagneSrc from '@textures/plage_montages_displacement.png'
import plaineSrc from '@textures/plage_plaine_displacement.png'
import valleeSrc from '@textures/plage_vallee_displacement.png'
import { textureLoader } from '../../../Tools/utils'
import { WORLDBUILDER_PRECISION } from "@/js/constants"
import Environments from "../../../World/Environments"
import { throttle } from 'lodash'

interface MapHeighterParams {
    ground: Environments
}

export default class MapHeighter {
    ground: Environments
    displacementMaps: HTMLImageElement[]
    blendingCanvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    worker: Worker
    throttledBlend: Function
    blendParams: { firstMapIndex, firstMapInfluence, secondMapIndex, secondMapInfluence }
    constructor({ ground }: MapHeighterParams) {
        this.ground = ground
        this.handleChange = this.handleChange.bind(this)
        this.init()
        this.throttledBlend = throttle(
            this.blend,
            500
        )
    }

    async init() {
        this.displacementMaps = [new Image(),new Image(),new Image(),new Image(),]
        const src = [ collineSrc,montagneSrc,plaineSrc,valleeSrc,]
        // important to wait for images to be loaded to get their actual size
        await Promise.all(this.displacementMaps.map((img, index) => new Promise<void>((resolve, reject) => {
            img.addEventListener('load', () => { resolve() })
            img.addEventListener('error', (e) => { console.log(e) })
            img.src = src[index]
        })))
        const bitmaps = await Promise.all(this.displacementMaps.map(img => createImageBitmap(img)))

        this.blendingCanvas = document.createElement("canvas")
        this.blendingCanvas.setAttribute('width',this.displacementMaps[0].width.toString())
        this.blendingCanvas.setAttribute('height',this.displacementMaps[0].height.toString())

        this.worker = new Worker(new URL('./worker.js', import.meta.url));
        
        const offscreen = this.blendingCanvas.transferControlToOffscreen()
        this.worker.postMessage({ canvas: offscreen }, [offscreen])
        bitmaps.forEach(bmp => this.worker.postMessage({ bitmap: bmp }, [bmp]))

        //debug
        this.blendingCanvas.style.position = `absolute`
        // this.blendingCanvas.style.zIndex = `50p`
        this.blendingCanvas.style.top = `25px`
        this.blendingCanvas.style.transform = `scale(0.2)`
        this.blendingCanvas.style.transformOrigin = `top left`
        this.blendingCanvas.style.left = `200px`
        this.blendingCanvas.style.pointerEvents = `none`
        this.blendingCanvas.classList.add('debug-blender')
        document.body.appendChild(this.blendingCanvas)
    }

    saveBlendParams(firstMapIndex: number, secondMapIndex: number, firstMapInfluence: number, secondMapInfluence: number) {
        this.blendParams = { firstMapIndex, secondMapIndex, firstMapInfluence, secondMapInfluence }
    }

    blend() {        
        this.worker.postMessage({action: 'blend', options: this.blendParams})
    }

    handleChange(value: number) {
        const [ firstMapIndex, secondMapIndex ] = [ Math.floor(value/WORLDBUILDER_PRECISION) % this.displacementMaps.length, (Math.floor(value/WORLDBUILDER_PRECISION) + 1) % this.displacementMaps.length ]
        const firstMapInfluence = 1 - ((value%WORLDBUILDER_PRECISION)/WORLDBUILDER_PRECISION)
        const secondMapInfluence = ((value%WORLDBUILDER_PRECISION)/WORLDBUILDER_PRECISION)
        this.saveBlendParams(firstMapIndex, secondMapIndex, firstMapInfluence, secondMapInfluence)
        this.throttledBlend()

    }
}