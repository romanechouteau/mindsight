import { debounce } from 'lodash'
// @ts-ignore
import store from '@store/index'
// @ts-ignore
import Component from '@lib/Component'

import VoiceManager from './VoiceManager'

// @ts-ignore
import microphone from '../../images/microphone.svg'
// @ts-ignore
import search from '../../images/search.svg'

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

        store.dispatch('chooseAudio', 'spotify')
        this.render()
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
                    this.drawSine()
                } else if (value === 'spotify') {
                    VoiceManager.stop()
                    window.cancelAnimationFrame(this.rendering)
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

        if (store.state.audioChoice === 'voice') {
            this.element.innerHTML = `
                <canvas id="sine">
                </canvas>
                <div class="center sine">
                    <img src="${microphone}">
                </div>
            `

            this.canvas = this.element.querySelector('#sine')
            this.canvas.width = window.innerWidth
            this.canvas.height = window.innerHeight / 10
            this.canvasCtx = this.canvas.getContext("2d")
            return
        }

        this.element.innerHTML = `
            <div class="spotify">
                <div class="left"></div>
                <div class="center">
                    <img src="${search}">
                    <div class="inputWrapper">
                        <div class="placeholder">Rechercher une musique</div>
                        <input type="text" placeholder="Rechercher une musique"></input>
                    </div>
                </div>
                <div class="right"></div>
            </div>
        `
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

        const center = 96
        const halfSize = size / 2
        const sliceWidth = ((width - center) / 2) / halfSize

        for (var i = 0; i < halfSize; i++) {
            const value = data[i] / min
            const x = sliceWidth * i
            const y = value * height / 2

            if (i === 0) {
                this.canvasCtx.moveTo(x, y)
            } else {
                this.canvasCtx.lineTo(x, y)
            }
        }

        for (var i = Math.ceil(halfSize); i < size; i++) {
            const value = data[i] / min
            const x = sliceWidth * i + center
            const y = value * height / 2

            if (i === Math.ceil(size / 2)) {
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