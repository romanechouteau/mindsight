import { Object3D, Scene } from 'three';

import store from '../../../js/Store'
import Component from '../../../js/Lib/Component';
import template from '../../../templates/worldBuilder.template';
import SkyCreator from './SkyCreator'
import { WORLDBUILDER_STEPS } from '../../../js/constants';

interface WorldBuilderParams {
    scene: Object3D,
    globalScene: Scene
}

export default class WorldBuilder extends Component {
    scene: Object3D
    range: HTMLInputElement
    skyCreator: SkyCreator
    globalScene: Scene
    constructor({ scene, globalScene }: WorldBuilderParams) {
        super({ store })
        this.scene = scene
        this.globalScene = globalScene
        this.init()
    }

    init () {
        this.createHtmlControls()
        this.render()
    }

    createHtmlControls() {
        document.querySelector('#worldBuilder').innerHTML = template
        this.range = document.querySelector('#worldBuilder input[type="range"]')
    }

    render = () => {
        if (store.state.worldBuilder.step === WORLDBUILDER_STEPS.SKY) {
            this.skyCreator = new SkyCreator({ scene: this.scene, range: this.range, globalScene: this.globalScene })
            this.range.onchange = this.skyCreator.handleChange
        }
    }
}