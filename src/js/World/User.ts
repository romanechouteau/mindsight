import MoveManager from "../Behavior/MoveManager";

export default class User {
    moveManager: MoveManager
    canvas: HTMLElement
    constructor({ camera, mouse, canvas }) {
        this.moveManager = new MoveManager({ camera, mouse, canvas })
    }
}