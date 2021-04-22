import { Object3D, Scene } from 'three';

import store from '../../../js/Store'
import Component from '../../../js/Lib/Component';
import template from '../../../templates/worldBuilder.template';
import SkyCreator from './SkyCreator'
import ShapeCreator from './ShapeCreator'
import { WORLDBUILDER_STEPS } from '../../../js/constants';
// @ts-ignore
import Time from '@tools/Time'

interface WorldBuilderParams {
    time: Time,
    scene: Object3D,
    globalScene: Scene
}

export default class WorldBuilder extends Component {
    time: Time
    scene: Object3D
    range: HTMLInputElement
    skyCreator: SkyCreator
    globalScene: Scene
    shapeCreator: ShapeCreator
    constructor({ scene, globalScene, time }: WorldBuilderParams) {
        super({ store })
        this.time = time
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
        if (store.state.worldBuilder.step === WORLDBUILDER_STEPS.SHAPE) {
            this.shapeCreator = new ShapeCreator({scene: this.scene})
            this.range.onchange = this.shapeCreator.handleChange
        } else if (store.state.worldBuilder.step === WORLDBUILDER_STEPS.SKY) {
            this.skyCreator = new SkyCreator({
                scene: this.scene,
                range: this.range,
                globalScene: this.globalScene,
                time: this.time })
            this.range.onchange = this.skyCreator.handleChange
        }
    }
}