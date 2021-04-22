import gsap from 'gsap/all'

type Direction = 'x' | 'y'

class PointerCursor {
    cursor: SVGElement
    snapped: {
        x?: number,
        y?: number
    }
    constructor() {
        this.cursor = document.querySelector('#pointerCursor')
        this.snapped = { x: null, y: null }
        this.init()
    }

    init() {
        const {width, height} = this.cursor.getBoundingClientRect()
        window.addEventListener('mousemove', e => {
            gsap.to(this.cursor, {
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
        gsap.to(this.cursor, {
            [direction]: at,
            ease: 'circ.out',
            duration: 0.5
        })
        
    }

    unsnap(direction: Direction,) {
        this.snapped[direction] = null
        gsap.to(this.cursor, {
            [direction]: 0,
            ease: 'circ.out',
            duration: 0.5
        })
    }
}

const instance = new PointerCursor()
export default instance