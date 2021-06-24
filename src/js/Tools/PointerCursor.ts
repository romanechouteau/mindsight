import gsap from 'gsap/all'

// @ts-ignore
import store from '@store/index'
// @ts-ignore
import Time from '@tools/Time'
import Component from '../Lib/Component'
import { HOLD_DURATION, HOLD_DELAY, CURSOR_MODES } from '../constants'

type Direction = 'x' | 'y'

export default class PointerCursor extends Component {
    time: Time
    cursor: SVGElement
    render: Function
    circle: SVGCircleElement
    snapped: {
        x?: number,
        y?: number
    }
    holdTime: number
    strokeDashArray: number
    constructor(options: { time: Time }) {
        super({
            store,
            element: document.querySelector('#pointerCursor')
        })

        const { time } = options

        this.time = time
        this.render = this.renderCursor
        this.holdTime = 0

        this.snapped = { x: null, y: null }
        this.render()
        this.init()
    }

    init() {
        const {width, height} = this.element.getBoundingClientRect()

        this.circle = this.element.querySelector('circle')
        this.strokeDashArray = Math.PI * (parseInt(this.circle.getAttribute('r')) * 2)
        this.circle.setAttribute('stroke-dasharray', `${this.strokeDashArray}`)

        window.addEventListener('mousemove', e => {
            gsap.to(this.element, {
                x: this.snapped.x ?? e.clientX - width/2,
                y: this.snapped.y ?? e.clientY - height/2,
                ease: 'circ.out',
                duration: 0.5
            })
        })
    }

    snap(direction: Direction, at: number) {
        this.snapped[direction] = at
        gsap.to(this.element, {
            [direction]: at,
            ease: 'circ.out',
            duration: 0.5
        })

    }

    unsnap(direction: Direction,) {
        this.snapped[direction] = null
        gsap.to(this.element, {
            [direction]: 0,
            ease: 'circ.out',
            duration: 0.5
        })
    }

    startHold (callback) {
        this.time.on('tick.hold', () => {
            if (this.holdTime >= HOLD_DURATION + HOLD_DELAY) {
                this.holdTime = 0
                gsap.to(this.circle, {
                    duration: 0.3,
                    strokeDashoffset: '0'
                })
                this.time.off('tick.hold')
                return callback()
            }

            this.holdTime += 1

            if (this.holdTime >= HOLD_DELAY) {
                const percent = (this.holdTime - HOLD_DELAY) / HOLD_DURATION
                this.circle.style.strokeDashoffset = `${(percent) * this.strokeDashArray}`
            }
        })
    }

    stopHold () {
        this.holdTime = 0
        gsap.to(this.circle, {
            duration: 0.3,
            strokeDashoffset: '0'
        })
        this.time.off('tick.hold')
    }

    renderCursor() {
        if (store.state.cursorMode !== CURSOR_MODES.DEFAULT && store.state.cursorMode !== CURSOR_MODES.BRUSH) {
            this.element.classList.add('hidden')
        } else {
            this.element.classList.remove('hidden')
        }
    }
}