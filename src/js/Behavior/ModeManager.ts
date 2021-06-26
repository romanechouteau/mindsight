// @ts-ignore
import store from '@store/index'
// @ts-ignore
import Component from '@lib/Component'
import { htmlUtils } from '../Tools/utils'
import { AUDIO_INPUT_MODES, CURSOR_MODES, SCENES } from '../constants'
// @ts-ignore
import template from '../../templates/HUD.template'
import SoundManager from './SoundManager'

export default class ModeManager extends Component {
    element: HTMLElement
    isMoveScene: Boolean
    isBrushScene: Boolean
    isAudioScene: Boolean
    handleKeyUpBinded: EventListener
    constructor() {
        super({
            store,
            element: document.querySelector('#HUD')
        })

        this.handleKeyUpBinded = this.handleKeyUp.bind(this)

        this.firstRender()
        this.render()
    }

    firstRender () {
        htmlUtils.renderToDOM(this.element, template, {
            cursorMode1: `${CURSOR_MODES.DEFAULT}`,
            cursorMode2: CURSOR_MODES.MOVE,
            cursorMode3: CURSOR_MODES.BRUSH,
            audioInputMode9: `${AUDIO_INPUT_MODES.SPOTIFY}`,
            audioInputMode0: `${AUDIO_INPUT_MODES.VOICE}`,
        })

        // bind keys
        document.addEventListener('keyup', this.handleKeyUpBinded)

        // listen to ckick
        this.element.querySelectorAll('.cursorMode .mode').forEach((elem) => {
            elem.addEventListener('click', () => this.handleClickCursor(elem))
        })
        this.element.querySelectorAll('.audioInputMode .mode').forEach((elem) => {
            elem.addEventListener('click', () => this.handleClickAudio(elem))
        })
    }

    render () {
        this.isMoveScene = store.state.scene === SCENES.PARAMETERS || store.state.scene === SCENES.BRUSH || store.state.scene === SCENES.AUDIO
        this.isBrushScene = store.state.scene === SCENES.BRUSH
        this.isAudioScene = store.state.scene === SCENES.AUDIO

        this.handleModeSelected('.cursorMode', store.state.cursorMode)

        // hide and show buttons
        this.handleModeVisibility(`.mode.${CURSOR_MODES.MOVE}`, this.isMoveScene)
        this.handleModeVisibility(`.mode.${CURSOR_MODES.BRUSH}`, this.isBrushScene)
        this.handleModeVisibility('.audioInputMode', this.isAudioScene)

        // show current selection
        if (this.isAudioScene) {
            this.handleModeSelected('.audioInputMode', store.state.audioInputMode)
        }
    }

    handleModeVisibility (querySelector, isVisible) {
        if (isVisible) {
            return this.element.querySelector(querySelector).classList.add('visible')
        }
        return this.element.querySelector(querySelector).classList.remove('visible')
    }

    handleModeSelected (parentSelector, currentMode) {
        this.element.querySelector(`${parentSelector} .mode.${currentMode} .modeButton`).classList.add('selected')
        this.element.querySelectorAll(`${parentSelector} .mode:not(.${currentMode}) .modeButton`).forEach((elem) => {
            elem.classList.remove('selected')
        })
    }

    handleKeyUp (event) {
        event.preventDefault()
        if ((event.target as HTMLElement).tagName === 'INPUT') return
        if (store.state.scene === SCENES.PARAMETERS && SoundManager.state.worldBuilderExplanationComplete !== true) return

        const key = event.code || event.keyCode

        if (key === 'Digit1' || key === 49) {
            return store.dispatch('chooseCursor', CURSOR_MODES.DEFAULT)
        }
        if ((key === 'Digit2' || key === 50) && this.isMoveScene) {
            return store.dispatch('chooseCursor', CURSOR_MODES.MOVE)
        }
        if ((key === 'Digit3' || key === 51) && this.isBrushScene) {
            return store.dispatch('chooseCursor', CURSOR_MODES.BRUSH)
        }
        if ((key === 'Digit9' || key === 57) && this.isAudioScene) {
            store.dispatch('setSpotifyAudioData', {...store.state.spotifyAudioData});
            return store.dispatch('chooseAudio', AUDIO_INPUT_MODES.SPOTIFY)
        }
        if ((key === 'Digit0' || key === 48) && this.isAudioScene) {
            return store.dispatch('chooseAudio', AUDIO_INPUT_MODES.VOICE)
        }
    }

    handleClickCursor (elem) {
        if (store.state.scene === SCENES.PARAMETERS && SoundManager.state.worldBuilderExplanationComplete !== true) return

        const mode = elem.getAttribute('data-mode') || CURSOR_MODES.DEFAULT
        store.dispatch('chooseCursor', mode)
    }

    handleClickAudio (elem) {
        const mode = elem.getAttribute('data-mode') || AUDIO_INPUT_MODES.NONE
        if (mode === AUDIO_INPUT_MODES.SPOTIFY) store.dispatch('setSpotifyAudioData', {...store.state.spotifyAudioData})
        store.dispatch('chooseAudio', mode)
    }

    stop () {
        document.removeEventListener('keyup', this.handleKeyUpBinded)

        this.render = () => {}
        this.element.innerHTML = ''
    }
}