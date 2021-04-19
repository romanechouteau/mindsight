import { debounce } from 'lodash'
// @ts-ignore
import store from '@store/index'
// @ts-ignore
import Component from '@lib/Component'

import VoiceManager from './VoiceManager'
import Spotify from './Sound/Spotify'

// @ts-ignore
import microphone from '../../images/microphone.svg'
// @ts-ignore
import search from '../../images/search.svg'

import { AUDIO_INPUT_MODES } from '../constants'
import { htmlUtils } from '../Tools/utils'
// @ts-ignore
import template from '../../templates/spotify.template'

class AudioManager extends Component {
    canvas: HTMLCanvasElement
    spotify: Spotify
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

        store.dispatch('chooseAudio', AUDIO_INPUT_MODES.SPOTIFY)
        this.spotify = new Spotify()
        this.render()
    }

    stop() {
        this.started = false

        window.removeEventListener('resize', this.resizeListener)
        document.removeEventListener('keyup', this.keyboardListener)

        VoiceManager.stop()
        window.cancelAnimationFrame(this.rendering)

        this.render = () => {}
        this.element.innerHTML = ''
    }

    listenKeyboard() {
        this.keyboardListener = (event) => {
            event.preventDefault()
            if ((event.target as HTMLElement).tagName === 'INPUT') return
            // @ts-ignore
            const key = event.key || event.keyCode
            if (key === ' ' || key === 'Space' || key === 32) {
                const value = store.state.audioInputMode === AUDIO_INPUT_MODES.VOICE  ? AUDIO_INPUT_MODES.SPOTIFY : AUDIO_INPUT_MODES.VOICE
                store.dispatch('chooseAudio', value)

                if (value === AUDIO_INPUT_MODES.VOICE) {
                    VoiceManager.start()
                    this.drawSine()
                } else if (value === AUDIO_INPUT_MODES.SPOTIFY) {
                    VoiceManager.stop()
                    window.cancelAnimationFrame(this.rendering)

                    if (this.spotify === undefined) {
                        this.spotify = new Spotify()
                    }
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

        if (store.state.audioInputMode === AUDIO_INPUT_MODES.VOICE) {
            this.element.innerHTML = `
                <div class="audioWrapper">
                    <canvas id="sine">
                    </canvas>
                    <div class="center sine">
                        <img src="${microphone}">
                    </div>
                </div>
            `

            this.canvas = this.element.querySelector('#sine')
            this.canvas.width = window.innerWidth
            this.canvas.height = window.innerHeight / 10
            this.canvasCtx = this.canvas.getContext("2d")
            return
        }

        htmlUtils.renderToDOM(this.element, template, { search })
        document.querySelector('.spotify__input').addEventListener('keyup', el => {
            this.spotify.handleSearch((el.target as HTMLInputElement).value)
        })
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
        const data = store.state.audioInputMode === AUDIO_INPUT_MODES.VOICE ? VoiceManager.getAudioData() : [min]
        const size = store.state.audioInputMode === AUDIO_INPUT_MODES.VOICE ? VoiceManager.bufferSize : 1

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