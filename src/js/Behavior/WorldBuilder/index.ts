import { Object3D, Scene } from 'three'
import { inRange } from 'lodash'
import gsap from "gsap/all"

import store from '../../../js/Store'
import Component from '../../../js/Lib/Component'
// @ts-ignore
import template from '../../../templates/worldBuilder.template'
import SkyManager from '../SkyManager'
import ShapeCreator from './ShapeCreator'
import PointerCursor from '../../Tools/PointerCursor'
import { WORLDBUILDER_STEPS, WORLDBUILDER_MAX_VALUE, DEFAULT_FOG_FAR, CURSOR_MODES } from '../../../js/constants'
// @ts-ignore
import Time from '@tools/Time'
import { waveBaseConfig } from '../../../js/Tools/canvasUtils';
import MapHeighter from './MapHeighter';
import Environments from '../../World/Environments';
import SoundManager from '../SoundManager'

interface WorldBuilderParams {
    time: Time,
    scene: Object3D,
    globalScene: Scene
    debug?: dat.GUI
    ground: Environments
    skyManager: SkyManager
    pointerCursor: PointerCursor
}

export default class WorldBuilder extends Component {
    show: Boolean
    time: Time
    scene: Object3D
    range: HTMLInputElement
    debug?: dat.GUI
    stopped: Boolean
    onChange: Function
    controller: HTMLCanvasElement
    skyManager: SkyManager
    rangeValue: { value: number }
    globalScene: Scene
    shapeCreator: ShapeCreator
    cursorAnimation?: any
    mapHeighter: MapHeighter
    ground: Object3D
    pointerCursor: PointerCursor
    envName: string
    handleMouseDown: EventListener
    handleMouseUp: EventListener
    constructor({ scene, globalScene, time, debug, ground, pointerCursor, skyManager }: WorldBuilderParams) {
        super({ store })
        this.envName = ground.container.children[0].userData.envName
        this.time = time
        this.show = false
        this.scene = scene
        this.ground = ground.container.children[0].children[0]
        this.debug = debug
        this.stopped = false
        this.onChange = () => null
        this.skyManager = skyManager
        this.rangeValue = { value: 0 } // init
        this.globalScene = globalScene
        this.pointerCursor = pointerCursor
        this.handleMouseDown = this.mouseDown.bind(this)
        this.handleMouseUp = this.mouseUp.bind(this)

        this.init()

    }

    init () {
        gsap.to(this.globalScene.fog, {
            far: DEFAULT_FOG_FAR,
            duration: 1,
            ease: 'Power1.easeInOut'
        })
        this.createHtmlControls()
        this.render()

        SoundManager.state.worldBuilderExplanationPromise = SoundManager.playVoice(6)
        SoundManager.state.worldBuilderExplanationPromise.then(() => {
            setTimeout(() => {
                SoundManager.state.worldBuilderExplanationComplete = true
                store.dispatch('chooseCursor', CURSOR_MODES.DEFAULT), 500
            })
        })
    }

    createHtmlControls() {
        let html
        html = template.replace('%width%', window.innerWidth * window.devicePixelRatio)
        html = html.replace('%height%', window.innerHeight/2 * window.devicePixelRatio)
        document.querySelector('#worldBuilder').innerHTML = html
        this.addWaves()
        this.controller = document.querySelector('#worldBuilder canvas') as HTMLCanvasElement
        this.controller.addEventListener('mouseenter', this.mouseEnter.bind(this))
        this.controller.addEventListener('mouseleave', this.mouseLeave.bind(this))
        this.controller.addEventListener('mousemove', this.mouseMove.bind(this))
        document.addEventListener('mousedown',  this.handleMouseDown)
        document.addEventListener('mouseup',  this.handleMouseUp)
    }

    addWaves() {
        const canvas: HTMLCanvasElement = document.querySelector('#worldBuilder canvas')
        const ctx = canvas.getContext('2d')
        const {width, height} = canvas

        ctx.imageSmoothingEnabled = true;
        const configs = [
            { ...waveBaseConfig, steps: 1600, waveLength: 100, speed: 770, height: 90, widthReductor: 4.5, inflexionPoint: 0.2 },
            { steps: 400, opacity: 0.35, waveLength: 40, speed: 1900, offset: 1, height: 270, widthReductor: 2.9 },
            { steps: 500, opacity: 0.5, waveLength: 70, speed: 1500, offset: -3, height: 140, widthReductor: 2.4, inflexionPoint: 0.5 } ]
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
                y = Math.sin((x - sineLimits[0]) * 1/(sineLimits[1] - sineLimits[0]) * ((Math.PI)/2) / config.waveLength + this.time.elapsed/config.speed + config.offset) * Math.sin(this.time.elapsed/config.speed) * Math.max((1 - inflexionPointDistance * Math.exp( inflexionPointDistance * config.widthReductor)), 0)
            ctx.lineTo( x/config.steps * width, y * config.height )
        }
        ctx.stroke()
        ctx.closePath()
        ctx.restore()
    }

    render = () => {
        // hide or show params
        const element = document.querySelector('#worldBuilder')
        if (element && store.state.cursorMode === CURSOR_MODES.DEFAULT && this.show === false && SoundManager.state.worldBuilderExplanationComplete === true) {
            element.classList.remove('hidden')
            this.show = true
        } else if (element && store.state.cursorMode !== CURSOR_MODES.DEFAULT && this.show === true) {
            element.classList.add('hidden')
            this.show = false
        }

        // Worldbuilder shape step
        if (store.state.worldBuilder.step === WORLDBUILDER_STEPS.SHAPE && this.shapeCreator === undefined) {
            this.shapeCreator = new ShapeCreator({scene: this.scene})
            this.onChange = this.shapeCreator.handleChange
        // Worldbuilder sky step
        } else if (store.state.worldBuilder.step === WORLDBUILDER_STEPS.SKY) {
            this.onChange = this.skyManager.handleChange
        // Worldbuilder ground step
        } else if (store.state.worldBuilder.step === WORLDBUILDER_STEPS.GROUND && this.mapHeighter === undefined) {
            // @ts-ignore
            this.mapHeighter = new MapHeighter({ ground: this.ground, time: this.time, envIndex: this.envName, skyManager: this.skyManager, debug: this.debug })
            this.onChange = this.mapHeighter.handleChange
        }
    }

    stop () {
        this.render = () => {}
        this.stopped = true

        document.querySelector('#worldBuilder').classList.add('hidden')
        setTimeout(() => {
            document.querySelector('#worldBuilder').remove()
        }, 800)

        this.controller.removeEventListener('mouseenter', this.mouseEnter)
        this.controller.removeEventListener('mouseleave', this.mouseLeave)
        this.controller.removeEventListener('mousemove', this.mouseMove)
        document.removeEventListener('mousedown',  this.handleMouseDown)
        document.removeEventListener('mouseup',  this.handleMouseUp)
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
        if (store.state.cursorMode === CURSOR_MODES.DEFAULT) {
            this.pointerCursor.startHold(this.handleNextStep)
        }
    }

    mouseUp () {
        if (store.state.cursorMode === CURSOR_MODES.DEFAULT) {
            this.pointerCursor.stopHold()
        }
    }

    handleNextStep () {
        // Change scene if step is last step
        if (store.state.worldBuilder.step === WORLDBUILDER_STEPS.SKY) {
            return store.dispatch('updateScene', store.state.scene + 1)
        }
        const nextStep = WORLDBUILDER_STEPS.SKY
        store.dispatch('updateWorldBuilderStep', nextStep)
    }
}