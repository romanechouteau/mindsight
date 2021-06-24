import { debounce } from 'lodash'

// @ts-ignore
import store from '@store/index'
// @ts-ignore
import Component from '@lib/Component'
import VoiceManager from './VoiceManager'
import Spotify from './Sound/Spotify'
// @ts-ignore
import microphone from '../../images/microphone.svg'
import { AUDIO_INPUT_MODES } from '../constants'
import { htmlUtils } from '../Tools/utils'
// @ts-ignore
import voiceTemplate from '../../templates/voice.template'
// @ts-ignore
import spotifyTemplate from '../../templates/spotify.template'
import SoundManager from './SoundManager'

class AudioManager extends Component {
    canvas: HTMLCanvasElement
    spotify: Spotify
    started: Boolean
    element: HTMLElement
    rendering: number
    canvasCtx: CanvasRenderingContext2D
    resizeListener: EventListener
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

        SoundManager.playVoice(12).then(() => SoundManager.playVoice(13))

        // default mode is spotify
        store.dispatch('chooseAudio', AUDIO_INPUT_MODES.SPOTIFY)
        this.spotify = new Spotify()
        this.render()
    }

    stop() {
        this.started = false

        window.removeEventListener('resize', this.resizeListener)

        VoiceManager.stop()
        window.cancelAnimationFrame(this.rendering)

        this.render = () => {}
        this.element.innerHTML = ''
    }

    render() {
        if (this.started === false) {
            this.element.innerHTML = ''
            return
        }

        // voice mode
        if (store.state.audioInputMode === AUDIO_INPUT_MODES.VOICE) {
            htmlUtils.renderToDOM(this.element, voiceTemplate, { microphone })

            this.canvas = this.element.querySelector('#sine')
            this.canvas.width = window.innerWidth
            this.canvas.height = window.innerHeight / 10
            this.canvasCtx = this.canvas.getContext("2d")

            if (VoiceManager.started !== false) {
                return
            }

            VoiceManager.start()
            this.drawSine()
            return
        }

        // spotify mode
        htmlUtils.renderToDOM(this.element, spotifyTemplate, {})
        document.querySelector('.spotify__input').addEventListener('keyup', el => {
            this.spotify.handleSearch((el.target as HTMLInputElement).value)
        })

        if (this.spotify === undefined) {
            this.spotify = new Spotify()
        }

        if (VoiceManager.started === true) {
            VoiceManager.stop()
            window.cancelAnimationFrame(this.rendering)
        }
    }

    drawSine() {
        const width = this.canvas.width
        const height = this.canvas.height

        this.rendering = requestAnimationFrame(this.drawSine.bind(this))
        this.canvasCtx.clearRect(0, 0, width, height)
        this.canvasCtx.lineWidth = 1
        this.canvasCtx.strokeStyle = 'rgb(255, 255, 255)'

        this.canvasCtx.beginPath()

        // if input mode is voice get voice data, else get data to draw flat sine
        const min = 128
        const data = store.state.audioInputMode === AUDIO_INPUT_MODES.VOICE ? VoiceManager.getAudioData() : [min]
        const size = store.state.audioInputMode === AUDIO_INPUT_MODES.VOICE ? VoiceManager.bufferSize : 1

        const center = 96
        const halfSize = size / 2
        const sliceWidth = ((width - center) / 2) / halfSize

        // draw left sine
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

        // draw right sine
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

        // end sine
        this.canvasCtx.lineTo(width, height / 2)
        this.canvasCtx.stroke()
    }
}

const instance = new AudioManager()
export default instance