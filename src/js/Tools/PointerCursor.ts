import gsap from 'gsap/all'

// @ts-ignore
import store from '@store/index'
import Component from '../Lib/Component'
import { SCENES } from '../constants'

type Direction = 'x' | 'y'

class PointerCursor extends Component {
    cursor: SVGElement
    render: Function
    snapped: {
        x?: number,
        y?: number
    }
    constructor() {
        super({
            store,
            element: document.querySelector('#pointerCursor')
        })

        this.render = this.renderCursor

        this.snapped = { x: null, y: null }
        this.render()
        this.init()
    }

    init() {
        const {width, height} = this.element.getBoundingClientRect()
        window.addEventListener('mousemove', e => {
            gsap.to(this.element, {
                x: this.snapped.x ?? e.clientX - width/2,
                y: this.snapped.y ?? e.clientY - height/2,
                ease: 'circ.out',
                duration: 0.5
            })
            // if (this.snapped.x === null) this.cursor.style.left = `${e.clientX - width/2}px`
            // if (this.snapped.y === null) this.cursor.style.top = `${e.clientY - height/2}px`
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

    renderCursor() {
        if (store.state.scene === SCENES.BRUSH && store.state.brush.canDraw === false) {
            this.element.classList.add('hidden')
        } else {
            this.element.classList.remove('hidden')
        }
    }
}

const instance = new PointerCursor()
export default instance