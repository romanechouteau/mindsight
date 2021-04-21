import ShapeCreator from './ShapeCreator'
import template from '../../../templates/worldBuilder.template';
import { Object3D } from 'three';
import Component from '../../../js/Lib/Component';
import store from '../../../js/Store'
import { WORLDBUILDER_STEPS } from '../../../js/constants';
import Time from '../../Tools/Time';
import { inRange } from 'lodash'
interface WorldBuilderParams {
    scene: Object3D
    time: Time
}
export default class WorldBuilder extends Component {

    shapeCreator: ShapeCreator
    scene: Object3D
    range: HTMLInputElement
    time: Time
    constructor({ scene, time }: WorldBuilderParams) {
        super({ store })
        this.scene = scene
        this.time = time
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
        this.addWaves()
    }

    addWaves() {
        const canvas: HTMLCanvasElement = document.querySelector('#worldBuilder canvas')
        const ctx = canvas.getContext('2d')
        const {width, height} = canvas
        const config = { steps: 200, inflexionPoint: parseInt(this.range.value) / parseInt(this.range.max) }
        ctx.imageSmoothingEnabled = true;
        this.time.on('tick', () => {
            ctx.clearRect(0, 0, width, height)
            ctx.save()
            ctx.translate(0.5, height/2)
            ctx.translate(0.5, 0.5);
            ctx.beginPath()
            ctx.strokeStyle = 'white'
            const sineLimits = [ Math.max(config.inflexionPoint - 0.1, 0), Math.min(config.inflexionPoint + 0.1, 1) ]
            const minOffset = Math.min( config.inflexionPoint, Math.abs( 1 - config.inflexionPoint ) )
            for (let x = 0; x < config.steps; x++) {
                let y = 0
                // debugger
                if (inRange(x/config.steps, sineLimits[0], sineLimits[1])) {y = Math.sin((x - sineLimits[0]) * 1/(sineLimits[1] - sineLimits[0]) * ((Math.PI)/2) / 30)
                // debugger
            }
                
                // const inflected: boolean = Math.abs(x/config.steps - config.inflexionPoint) < 0.1
                // const y = inflected ? 1 - (Math.abs(x/config.steps - config.inflexionPoint)) : 0
                // const y = 1 - (Math.abs(x/config.steps - config.inflexionPoint)) - minOffset
                
                // ctx.lineTo( x/config.steps * width, Math.sin((-Math.sin(y) * 300)/-10) * 150 )
                ctx.lineTo( x/config.steps * width, y * 100)
                // console.log('y: '+y+ ' x: '+x+' math : '+Math.abs(x/config.steps - config.inflexionPoint));
                // console.log('sin '+ (-Math.sin(y))+ ' mult: '+(-Math.sin(y) * 300));
                
            }
            ctx.stroke()
            ctx.closePath()
            ctx.restore()
            // debugger
        })
    }

    render = () => {
        if (store.state.worldBuilder.step === WORLDBUILDER_STEPS.SHAPE) {
            this.shapeCreator = new ShapeCreator({scene: this.scene})
            this.range.onchange = this.shapeCreator.handleChange
        }
    }
}