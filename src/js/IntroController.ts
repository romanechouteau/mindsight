import template from '../templates/intro.template' 
import hpSrc from '../images/casque.svg'

export default class IntroController {
    constructor() {
        this.createHtml()
    }

    createHtml() {
        let html
        html = template.replace('%hpSrc%', hpSrc)
        html = html.replace('%width-full%', window.innerWidth * window.devicePixelRatio)
        html = html.replace('%height-full%', window.innerHeight * window.devicePixelRatio)
        html = html.replace('%width-left%', window.innerWidth/2 * window.devicePixelRatio)
        html = html.replace('%height-left%', window.innerHeight * window.devicePixelRatio)
        html = html.replace('%width-right%', window.innerWidth/2 * window.devicePixelRatio)
        html = html.replace('%height-right%', window.innerHeight * window.devicePixelRatio)
        document.querySelector('#intro').innerHTML = html
    }

    dispose() {
        document.body.removeChild(document.querySelector('#intro'))
    }

    drawFullLine() {
        
    }

}