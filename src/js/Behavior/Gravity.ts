import { Object3D, Raycaster, Vector3 } from "three";
import Time from "../Tools/Time";

interface GravityParams {
    objects: Object3D[]
    ground: Object3D
    time: Time
}

export default class Gravity {
    gravityObjects: {object: Object3D, raycaster: Raycaster}[]
    ground: Object3D
    time: Time
    constructor({ objects, ground, time }: GravityParams) {
        this.gravityObjects = objects.map(obj => ({ object: obj, raycaster: new Raycaster(obj.position, new Vector3(0, -1, 0)) }))
        this.ground = ground
        this.time = time
        this.initCollisions()
    }

    initCollisions() {
        this.time.on('tick', () => {
            for (const gObject of this.gravityObjects) {
                if (gObject.raycaster.intersectObject(this.ground, true).length && gObject.raycaster.intersectObject(this.ground, true)[0].distance > 0) {
                    const {distance} = gObject.raycaster.intersectObject(this.ground, true)[0]
                    if (distance > 0.3) { // fall
                        gObject.object.position.y -= 0.25
                        gObject.raycaster.set( gObject.object.position, new Vector3(0, -1, 0) )
                    } // else, idle
                    else if (distance < 0.2) {
                        gObject.object.position.y += 0.05
                        gObject.raycaster.set( gObject.object.position, new Vector3(0, -1, 0) )
                    }
                } else {
                    gObject.object.position.y += 0.5
                    gObject.raycaster.set( gObject.object.position, new Vector3(0, -1, 0) )
                }
            }
        })
    }
}