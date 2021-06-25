// @ts-ignore
import store from '@store/index'
import PointerCursor from '../Tools/PointerCursor'
import { CURSOR_MODES, LAST_SCENE, SCENES } from '../constants'

export default class SceneManager {
    pointerCursor: PointerCursor
    constructor(options: { pointerCursor: PointerCursor }) {
        const { pointerCursor } = options
        this.pointerCursor = pointerCursor

        document.addEventListener('mousedown', this.mouseDown.bind(this))
        document.addEventListener('mouseup', this.mouseUp.bind(this))
    }

    mouseDown (event) {
        // cursor click and hold is blocked if cursor mode is not default and scene is parameters scene or last scene
        if (!document.querySelector('.dg.ac') || (document.querySelector('.dg.ac') && !document.querySelector('.dg.ac').contains(event.target))) {
            if (store.state.cursorMode === CURSOR_MODES.DEFAULT && store.state.scene !== SCENES.PARAMETERS && store.state.scene < LAST_SCENE) {
                this.pointerCursor.startHold(this.handleNextScene)
            }
        }
    }

    mouseUp () {
        if (store.state.cursorMode === CURSOR_MODES.DEFAULT && store.state.scene !== SCENES.PARAMETERS && store.state.scene < LAST_SCENE) {
            this.pointerCursor.stopHold()
        }
    }

    removeListeners () {
        document.removeEventListener('mousedown', this.mouseDown)
        document.removeEventListener('mouseup', this.mouseUp)
    }

    handleNextScene () {
        if (store.state.scene < LAST_SCENE) {
            store.dispatch('updateScene', store.state.scene + 1)
        }
    }
}