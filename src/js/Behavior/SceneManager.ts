// @ts-ignore
import store from '@store/index'
// @ts-ignore
import Component from '@lib/Component'

import { LAST_SCENE } from '../constants'

export default class SceneManager extends Component {
    element: HTMLElement
    constructor() {
        super({
            store,
            element: document.querySelector('#sceneManager')
        })
        this.render()
    }

    render() {
        if (store.state.scene >= LAST_SCENE) {
            this.element.innerHTML = ''
            return
        }

        this.element.innerHTML = `
            <button class="nextScene">Next scene</button>
        `

        this.element.querySelector('.nextScene').addEventListener('click', () => {
            if (store.state.scene < LAST_SCENE) {
                store.dispatch('updateScene', store.state.scene + 1)
            }
        })
    }
}