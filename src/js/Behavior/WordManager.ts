import { debounce } from 'lodash'
// @ts-ignore
import store from '@store/index'

import { htmlUtils } from '../Tools/utils'
// @ts-ignore
import template from '../../templates/word.template'

class WordManager {
    started: Boolean
    element: HTMLElement
    resizeListener: EventListener
    constructor() {
        this.element = document.querySelector('#wordManager')

        this.started = true

        this.render()
        this.resizeListener = debounce(() => this.render(), 150)
        window.addEventListener('resize', this.resizeListener)
    }

    stop() {
        this.started = false

        const value = (this.element.querySelector('.word__input') as HTMLInputElement).value
        store.dispatch('registerEmotionWord', value)

        window.removeEventListener('resize', this.resizeListener)

        this.render = () => {}
        this.element.innerHTML = ''
    }

    render() {
        htmlUtils.renderToDOM(this.element, template, {})
    }
}

export default WordManager