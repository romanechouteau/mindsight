import { Object3D, Scene } from 'three';
import { inRange } from 'lodash'
import gsap from "gsap/all"

import store from '../../../js/Store'
import Component from '../../../js/Lib/Component';
import template from '../../../templates/worldBuilder.template';
import SkyCreator from './SkyCreator'
import ShapeCreator from './ShapeCreator'
import PointerCursor from '../../Tools/PointerCursor'
import { WORLDBUILDER_STEPS, WORLDBUILDER_MAX_VALUE } from '../../../js/constants';
// @ts-ignore
import Time from '@tools/Time'

interface WorldBuilderParams {
    time: Time,
    scene: Object3D,
    globalScene: Scene
    debug?: dat.GUI
}

export default class WorldBuilder extends Component {
    time: Time
    scene: Object3D
    range: HTMLInputElement
    debug?: dat.GUI
    onChange: Function
    skyCreator: SkyCreator
    rangeValue: { value: number }
    globalScene: Scene
    shapeCreator: ShapeCreator
    cursorAnimation?: any
    constructor({ scene, globalScene, time, debug }: WorldBuilderParams) {
        super({ store })
        this.time = time
        this.scene = scene
        this.debug = debug
        this.onChange = () => null
        this.rangeValue = { value: 0 } // init
        this.globalScene = globalScene
        this.init()
    }

    init () {
        this.createHtmlControls()
        this.render()
    }

    createHtmlControls() {
        let html
        html = template.replace('%width%', window.innerWidth * window.devicePixelRatio)
        html = html.replace('%height%', window.innerHeight/5 * window.devicePixelRatio)
        document.querySelector('#worldBuilder').innerHTML = html
        this.addWaves()
        const controller = document.querySelector('#worldBuilder canvas') as HTMLCanvasElement
        controller.addEventListener('mouseenter', (e: MouseEvent) => {
            PointerCursor.snap('y', controller.getBoundingClientRect().top + controller.height / 8)
        })
        controller.addEventListener('mouseleave', (e: MouseEvent) => {
            PointerCursor.unsnap('y')
        })
        controller.addEventListener('mousemove', (e: MouseEvent) => {
            const value = Math.round(e.clientX / window.innerWidth * WORLDBUILDER_MAX_VALUE)
            this.cursorAnimation?.kill()
            this.cursorAnimation = gsap.to(this.rangeValue, {
                value,
                ease: 'circ.out',
                duration: 2,
                onUpdate: this.onChange,
                onUpdateParams: [this.rangeValue.value],
                onComplete: this.onChange,
                onCompleteParams: [this.rangeValue.value],
            })
        })
    }

    addWaves() {
        const canvas: HTMLCanvasElement = document.querySelector('#worldBuilder canvas')
        const ctx = canvas.getContext('2d')
        const {width, height} = canvas
        const config = { steps: 200, opacity: 1, waveLength: 50, speed: 250, offset: 0, height: 50 }
        ctx.imageSmoothingEnabled = true;
        const configs = [ {...config, opacity: 1}, {...config, opacity: 0.5, offset: 2, speed: 350, waveLength: 75, height: 40}, {...config, opacity: 0.5, offset: 3, speed: 450, waveLength: 40, wavlength: 75 } ]
        this.time.on('tick', () => {
            ctx.clearRect(0, 0, width, height)
            this.drawWave(ctx, width, height, configs[0])
            this.drawWave(ctx, width, height, configs[1])
            this.drawWave(ctx, width, height, configs[2])
        })
        if (this.debug) {
            const mainFolder = this.debug.addFolder('worldbuilder waves')
            configs.forEach((conf, id) => {
                const subfolder = mainFolder.addFolder(`${id}`)
                Object.keys(conf).forEach(key => subfolder.add(conf, key))
            })
        }
    }

    drawWave(ctx, width, height, config) {
        ctx.save()
        ctx.translate(0.5, height/2)
        ctx.translate(0.5, 0.5);
        ctx.beginPath()
        ctx.strokeStyle = `rgba(255, 255, 255, ${config.opacity})`
        const inflexionPoint = (this.rangeValue.value) / WORLDBUILDER_MAX_VALUE
        // const sineLimits = [ Math.max(inflexionPoint - 0.5, 0), Math.min(inflexionPoint + 0.5, 1) ]
        const sineLimits = [ 0, 1 ]
        for (let x = 0; x < config.steps; x++) {
            const inflexionPointDistance = Math.abs(inflexionPoint - (x/config.steps));
            // debugger;
            let y = 0
            if (inRange(x/config.steps, sineLimits[0], sineLimits[1]))
                y = Math.sin((x - sineLimits[0]) * 1/(sineLimits[1] - sineLimits[0]) * ((Math.PI)/2) / config.waveLength + this.time.elapsed/config.speed + config.offset) * Math.sin(this.time.elapsed/config.speed) * Math.max((1 - inflexionPointDistance * 3), 0)
            ctx.lineTo( x/config.steps * width, y * config.height )
        }
        ctx.stroke()
        ctx.closePath()
        ctx.restore()
    }

    render = () => {
        if (store.state.worldBuilder.step === WORLDBUILDER_STEPS.SHAPE) {
            this.shapeCreator = new ShapeCreator({scene: this.scene})
            this.onChange = this.shapeCreator.handleChange
        } else if (store.state.worldBuilder.step === WORLDBUILDER_STEPS.SKY) {
            this.skyCreator = new SkyCreator({
                scene: this.scene,
                globalScene: this.globalScene,
                time: this.time
            })
            this.onChange = this.skyCreator.handleChange
        }
    }
}