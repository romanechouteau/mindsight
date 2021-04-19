import template from '../../../templates/worldBuilder.template';

export default class WorldBuilder {
    constructor() {
        
    }

    init () {
        this.createHtmlControls()
    }

    createHtmlControls() {
        document.querySelector('world-builder').innerHTML = template
    }
}