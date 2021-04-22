import ShapeCreator from './ShapeCreator'
import template from '../../../templates/worldBuilder.template';
import { Object3D } from 'three';
import Component from '../../../js/Lib/Component';
import store from '../../../js/Store'
import { WORLDBUILDER_RANGE_MAX, WORLDBUILDER_STEPS } from '../../../js/constants';
import Time from '../../Tools/Time';
import { inRange } from 'lodash'
import gsap from "gsap/all";
import PointerCursor from '../../Tools/PointerCursor'

interface WorldBuilderParams {
    scene: Object3D
    time: Time
    debug?: dat.GUI
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
    debug?: dat.GUI
    constructor({ scene, time, debug }: WorldBuilderParams) {
        super({ store })
        this.scene = scene
        this.time = time
        this.debug = debug
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
        this.addWaves()
        const controller = document.querySelector('#worldBuilder canvas') as HTMLCanvasElement
        controller.addEventListener('mouseenter', (e: MouseEvent) => {
            PointerCursor.snap('y', controller.getBoundingClientRect().top + controller.height / 8)
        })
        controller.addEventListener('mouseleave', (e: MouseEvent) => {
            PointerCursor.unsnap('y')
        })
        controller.addEventListener('mousemove', (e: MouseEvent) => {
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
        const inflexionPoint = (this.rangeValue.value) / WORLDBUILDER_RANGE_MAX
        const sineLimits = [ Math.max(inflexionPoint - 0.1, 0), Math.min(inflexionPoint + 0.1, 1) ]
        for (let x = 0; x < config.steps; x++) {
            let y = 0
            if (inRange(x/config.steps, sineLimits[0], sineLimits[1])) 
                y = Math.sin((x - sineLimits[0]) * 1/(sineLimits[1] - sineLimits[0]) * ((Math.PI)/2) / config.waveLength + this.time.elapsed/config.speed + config.offset) * Math.sin(this.time.elapsed/config.speed)
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
        }
    }
}