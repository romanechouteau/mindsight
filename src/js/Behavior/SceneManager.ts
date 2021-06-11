// @ts-ignore
import store from '@store/index'
import PointerCursor from '../Tools/PointerCursor'

import { LAST_SCENE, SCENES } from '../constants'

export default class SceneManager {
    element: HTMLElement
    pointerCursor: PointerCursor
    constructor(options: { pointerCursor: PointerCursor }) {
        const { pointerCursor } = options
        this.pointerCursor = pointerCursor

        document.addEventListener('mousedown', this.mouseDown.bind(this))
        document.addEventListener('mouseup', this.mouseUp.bind(this))
    }

    mouseDown () {
        // TODO add cursor toggle
        if (store.state.scene !== SCENES.PARAMETERS && store.state.scene !== SCENES.BRUSH && store.state.scene <= LAST_SCENE) {
            this.pointerCursor.startHold(this.handleNextScene)
        }
    }

    mouseUp () {
        if (store.state.scene !== SCENES.PARAMETERS && store.state.scene <= LAST_SCENE) {
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