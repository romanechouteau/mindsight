import { debounce } from 'lodash'
// @ts-ignore
import store from '@store/index'
// @ts-ignore
import Component from '@lib/Component'

import VoiceManager from './VoiceManager'

class AudioManager extends Component {
    canvas: HTMLCanvasElement
    started: Boolean
    element: HTMLElement
    rendering: number
    canvasCtx: CanvasRenderingContext2D
    resizeListener: EventListener
    keyboardListener: EventListener
    constructor() {
        super({
            store,
            element: document.querySelector('#audioManager')
        })

        this.started = false

        this.resizeListener = debounce(() => this.render(), 150)
        window.addEventListener('resize', this.resizeListener)
    }

    start() {
        this.started = true

        this.listenKeyboard()
        this.render()

        store.dispatch('chooseAudio', 'voice')
        VoiceManager.start()

        this.drawSine()
    }

    stop() {
        this.started = false

        window.removeEventListener('resize', this.resizeListener)
        document.removeEventListener('keyup', this.keyboardListener)

        window.cancelAnimationFrame(this.rendering)

        this.render = () => {}
        this.element.innerHTML = ''
    }

    listenKeyboard() {
        this.keyboardListener = (event) => {
            event.preventDefault()
            // @ts-ignore
            const key = event.key || event.keyCode
            if (key === ' ' || key === 'Space' || key === 32) {
                const value = store.state.audioChoice === 'voice' ? 'spotify' : 'voice'
                store.dispatch('chooseAudio', value)

                if (value === 'voice') {
                    VoiceManager.start()
                } else if (value === 'spotify') {
                    VoiceManager.stop()
                }
            }
        }
        document.addEventListener('keyup', this.keyboardListener)
    }

    render() {
        if (this.started === false) {
            this.element.innerHTML = ''
            return
        }

        this.element.innerHTML = `
            <div>${store.state.audioChoice}</div>
            <canvas id="sine"></canvas>
        `

        this.canvas = this.element.querySelector('#sine')
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight / 10
        this.canvasCtx = this.canvas.getContext("2d")
    }

    drawSine() {
        const width = this.canvas.width
        const height = this.canvas.height

        this.rendering = requestAnimationFrame(this.drawSine.bind(this))
        this.canvasCtx.clearRect(0, 0, width, height)
        this.canvasCtx.lineWidth = 1
        this.canvasCtx.strokeStyle = 'rgb(255, 255, 255)'

        this.canvasCtx.beginPath()

        const min = 128
        const data = store.state.audioChoice === 'voice' ? VoiceManager.getAudioData() : [min]
        const size = store.state.audioChoice === 'voice' ? VoiceManager.bufferSize : 1

        const sliceWidth = width / size;

        for (var i = 0; i < size; i++) {
            const value = data[i] / min
            const x = sliceWidth * i
            const y = value * height / 2

            if (i === 0) {
                this.canvasCtx.moveTo(x, y)
            } else {
                this.canvasCtx.lineTo(x, y)
            }
        }

        this.canvasCtx.lineTo(width, height / 2)
        this.canvasCtx.stroke()
    }
}

const instance = new AudioManager()
export default instance