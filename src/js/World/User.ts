import MoveManager from "../Behavior/MoveManager";

export default class User {
    moveManager: MoveManager
    constructor({ camera, mouse, ground }) {
        this.moveManager = new MoveManager({ camera, mouse, ground })
    }
}