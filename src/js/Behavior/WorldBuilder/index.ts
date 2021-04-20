import ShapeCreator from './ShapeCreator'
import template from '../../../templates/worldBuilder.template';
import { Object3D } from 'three';
import Component from '../../../js/Lib/Component';
import store from '../../../js/Store'
import { WORLDBUILDER_STEPS } from '../../../js/constants';
interface WorldBuilderParams {
    scene: Object3D
}
export default class WorldBuilder extends Component {

    shapeCreator: ShapeCreator
    scene: Object3D
    range: HTMLInputElement
    constructor({ scene }: WorldBuilderParams) {
        super({ store })
        this.scene = scene
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
        }
    }
}