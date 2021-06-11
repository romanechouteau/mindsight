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
import { waveBaseConfig } from '../../../js/Tools/canvasUtils';
import MapHeighter from './MapHeighter';
import Environments from '../../World/Environments';

interface WorldBuilderParams {
    time: Time,
    scene: Object3D,
    globalScene: Scene
    debug?: dat.GUI
    ground: Environments,
    pointerCursor: PointerCursor
}

export default class WorldBuilder extends Component {
    time: Time
    scene: Object3D
    range: HTMLInputElement
    debug?: dat.GUI
    stopped: Boolean
    onChange: Function
    controller: HTMLCanvasElement
    skyCreator: SkyCreator
    rangeValue: { value: number }
    globalScene: Scene
    shapeCreator: ShapeCreator
    cursorAnimation?: any
    mapHeighter: MapHeighter
    ground: Object3D
    pointerCursor: PointerCursor
    constructor({ scene, globalScene, time, debug, ground, pointerCursor }: WorldBuilderParams) {
        super({ store })
        this.time = time
        this.scene = scene
        this.ground = ground.container.children[0].children[0]
        this.debug = debug
        this.stopped = false
        this.onChange = () => null
        this.rangeValue = { value: 0 } // init
        this.globalScene = globalScene
        this.pointerCursor = pointerCursor
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
        this.controller = document.querySelector('#worldBuilder canvas') as HTMLCanvasElement
        this.controller.addEventListener('mouseenter', this.mouseEnter.bind(this))
        this.controller.addEventListener('mouseleave', this.mouseLeave.bind(this))
        this.controller.addEventListener('mousemove', this.mouseMove.bind(this))
        this.controller.addEventListener('mousedown', this.mouseDown.bind(this))
        this.controller.addEventListener('mouseup', this.mouseUp.bind(this))
    }

    addWaves() {
        const canvas: HTMLCanvasElement = document.querySelector('#worldBuilder canvas')
        const ctx = canvas.getContext('2d')
        const {width, height} = canvas

        const config = { steps: 200, opacity: 1, waveLength: 50, speed: 250, offset: 0, height: 50, width: 0.2 }
        ctx.imageSmoothingEnabled = true;
        const configs = [ {...waveBaseConfig, opacity: 1}, {...waveBaseConfig, opacity: 0.5, offset: 2, speed: 350, waveLength: 75, height: 40}, {...waveBaseConfig, opacity: 0.5, offset: 3, speed: 450, waveLength: 40 } ]
        this.time.on('tick.worldBuilder', () => {
            ctx.clearRect(0, 0, width, height)
            this.drawWave(ctx, width, height, configs[0])
            this.drawWave(ctx, width, height, configs[1])
            this.drawWave(ctx, width, height, configs[2])
        })
        // add params for waves
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
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        ctx.shadowBlur = 3
        ctx.shadowColor = 'white'
        ctx.strokeStyle = `rgba(255, 255, 255, ${config.opacity})`
        const inflexionPoint = (this.rangeValue.value) / WORLDBUILDER_MAX_VALUE
        // const sineLimits = [ Math.max(inflexionPoint - 0.5, 0), Math.min(inflexionPoint + 0.5, 1) ]
        const sineLimits = [ 0, 1 ]
        for (let x = 0; x < config.steps; x++) {
            const inflexionPointDistance = Math.abs(inflexionPoint - (x/config.steps));
            // debugger;
            let y = 0
            // const smoother = x > (sineLimits[1] - config.width/2 ) ? sineLimits[1] - x - sineLimits[0] : x - sineLimits[0]
            if (inRange(x/config.steps, sineLimits[0], sineLimits[1]))
                y = Math.sin((x - sineLimits[0]) * 1/(sineLimits[1] - sineLimits[0]) * ((Math.PI)/2) / config.waveLength + this.time.elapsed/config.speed + config.offset) * Math.sin(this.time.elapsed/config.speed) * Math.max((1 - inflexionPointDistance * config.widthReductor), 0)
            ctx.lineTo( x/config.steps * width, y * config.height )
        }
        ctx.stroke()
        ctx.closePath()
        ctx.restore()
    }

    render = () => {
        if (store.state.worldBuilder.step === WORLDBUILDER_STEPS.SHAPE && this.shapeCreator === undefined) {
            this.shapeCreator = new ShapeCreator({scene: this.scene})
            this.onChange = this.shapeCreator.handleChange
        } else if (store.state.worldBuilder.step === WORLDBUILDER_STEPS.SKY && this.skyCreator === undefined) {
            this.skyCreator = new SkyCreator({
                scene: this.scene,
                globalScene: this.globalScene,
                time: this.time
            })
            this.onChange = this.skyCreator.handleChange
        } else if (store.state.worldBuilder.step === WORLDBUILDER_STEPS.GROUND && this.mapHeighter === undefined) {
            this.mapHeighter = new MapHeighter({ ground: this.ground, time: this.time })
            this.onChange = this.mapHeighter.handleChange
        }
    }

    stop () {
        document.querySelector('#worldBuilder').innerHTML = ''

        this.render = () => {}
        this.stopped = true

        this.controller.removeEventListener('mouseenter', this.mouseEnter)
        this.controller.removeEventListener('mouseleave', this.mouseLeave)
        this.controller.removeEventListener('mousemove', this.mouseMove)
        this.controller.removeEventListener('mousedown', this.mouseDown)
        this.controller.removeEventListener('mouseup', this.mouseUp)
        this.pointerCursor.unsnap('y')

        this.time.off('tick.worldBuilder')
    }

    mouseEnter () {
        this.pointerCursor.snap('y', this.controller.getBoundingClientRect().top + this.controller.height / 8)
    }

    mouseLeave () {
        this.pointerCursor.unsnap('y')
    }

    mouseMove (e: MouseEvent) {
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
    }

    mouseDown () {
        this.pointerCursor.startHold(this.handleNextStep)
    }

    mouseUp () {
        this.pointerCursor.stopHold()
    }

    handleNextStep () {
        if (store.state.worldBuilder.step === WORLDBUILDER_STEPS.SKY) {
            return store.dispatch('updateScene', store.state.scene + 1)
        }
        // TODO fix shape and put shape step back
        // const nextStep = store.state.worldBuilder.step === WORLDBUILDER_STEPS.GROUND
        //     ? WORLDBUILDER_STEPS.SHAPE
        //     : WORLDBUILDER_STEPS.SKY
        const nextStep = WORLDBUILDER_STEPS.SKY
        store.dispatch('updateWorldBuilderStep', nextStep)
    }
}