import ShapeCreator from './ShapeCreator'
import template from '../../../templates/worldBuilder.template';
import { Object3D } from 'three';
import Component from '../../../js/Lib/Component';
import store from '../../../js/Store'
import { WORLDBUILDER_RANGE_MAX, WORLDBUILDER_STEPS } from '../../../js/constants';
import Time from '../../Tools/Time';
import { inRange } from 'lodash'
import gsap from "gsap/all";

interface WorldBuilderParams {
    scene: Object3D
    time: Time
}
export default class WorldBuilder extends Component {

    shapeCreator: ShapeCreator
    scene: Object3D
    range: HTMLInputElement
    time: Time
    // useful to animate the cursor
    cursorAnimation?: any
    rangeValue: { value: number }
    onChange: Function
    constructor({ scene, time }: WorldBuilderParams) {
        super({ store })
        this.scene = scene
        this.time = time
        this.onChange = () => null
        this.rangeValue = { value: 0 } // init
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
        this.range = document.querySelector('#worldBuilder input[type="range"]')
        this.range.value = this.rangeValue.value.toString()
        this.addWaves()
        document.querySelector('#worldBuilder canvas').addEventListener('mousemove', (e: MouseEvent) => {
            const value = Math.round(e.clientX / window.innerWidth * WORLDBUILDER_RANGE_MAX)
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
        const config = { steps: 200 }
        ctx.imageSmoothingEnabled = true;
        this.time.on('tick', () => {
            ctx.clearRect(0, 0, width, height)
            this.drawWave(ctx, width, height, {...config, opacity: 1})
            this.drawWave(ctx, width, height, {...config, opacity: 0.5, offset: 2, speed: 350})
            this.drawWave(ctx, width, height, {...config, opacity: 0.5, offset: 3, speed: 450 })
        })
    }
    
    drawWave(ctx, width, height, config) {
        ctx.save()
        ctx.translate(0.5, height/2)
        ctx.translate(0.5, 0.5);
        ctx.beginPath()
        ctx.strokeStyle = `rgba(255, 255, 255, ${config.opacity})`
        const inflexionPoint = (this.rangeValue.value) / WORLDBUILDER_RANGE_MAX
        const sineLimits = [ Math.max(inflexionPoint - 0.1, 0), Math.min(inflexionPoint + 0.1, 1) ]
        for (let x = 0; x < config.steps; x++) {
            let y = 0
            if (inRange(x/config.steps, sineLimits[0], sineLimits[1])) {y = Math.sin((x - sineLimits[0]) * 1/(sineLimits[1] - sineLimits[0]) * ((Math.PI)/2) / 50 + this.time.elapsed/(config.speed ?? 250) + (config.offset ?? 0)) * Math.sin(this.time.elapsed/(config.speed ?? 250))
        } 
            ctx.lineTo( x/config.steps * width, y * 50)                
        }
        ctx.stroke()
        ctx.closePath()
        ctx.restore()
    }

    render = () => {
        if (store.state.worldBuilder.step === WORLDBUILDER_STEPS.SHAPE) {
            this.shapeCreator = new ShapeCreator({scene: this.scene})
            this.onChange = this.shapeCreator.handleChange
        }
    }
}