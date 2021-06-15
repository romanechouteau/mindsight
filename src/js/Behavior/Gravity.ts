import { Object3D, Raycaster, Vector3 } from "three";
import Time from "../Tools/Time";

interface GravityParams {
    // movableObject may be the container of the origin object
    objects: {originObject: Object3D, movableObject: Object3D}[]
    ground: Object3D
    time: Time
}

interface GravityObject {
    raycaster: Raycaster
    object: {
        originObject: Object3D,
        movableObject: Object3D
    }
}

export default class Gravity {
    gravityObjects: {object: { originObject: Object3D, movableObject: Object3D }, raycaster: Raycaster}[]
    ground: Object3D
    time: Time
    constructor({ objects, ground, time }: GravityParams) {
        this.gravityObjects = objects.map(obj => ({ object: obj, raycaster: new Raycaster(new Vector3().copy(obj.movableObject.position).add(obj.originObject.position), new Vector3(0, -1, 0)) }))
        this.ground = ground.children[0].children[0] // ground mesh
        this.time = time
        this.initCollisions()
    }

    updatePositions(gObject: GravityObject) {
        gObject.raycaster.set( new Vector3(
            gObject.object.movableObject.position.x,
            gObject.object.movableObject.position.y + gObject.object.originObject.position.y,
            gObject.object.movableObject.position.z + gObject.object.originObject.position.z
        ), new Vector3(0, -1, 0) )
    }

    applyCollisions() {
        for (const gObject of this.gravityObjects) {
            if (gObject.raycaster.intersectObject(this.ground, true).length && gObject.raycaster.intersectObject(this.ground, true)[0].distance > 0) {
                const {distance} = gObject.raycaster.intersectObject(this.ground, true)[0]

                if (distance > 0.75) { // fall
                    gObject.object.movableObject.position.y -= 0.25
                    this.updatePositions(gObject)
                } // else, idle
                else if (distance < 0.2) {
                    gObject.object.movableObject.position.y += 0.05
                    this.updatePositions(gObject)
                }
            } else { // else, go up
                gObject.object.movableObject.position.y += 0.5
                this.updatePositions(gObject)
            }
        }
    }

    instantCollision(object, originObject) {
        const raycaster = new Raycaster(new Vector3().copy(object.position).add(originObject.position), new Vector3(0, -1, 0))
        const intersects = raycaster.intersectObject(this.ground, true)
        if (intersects[0]) {
            const { point } = intersects[0]
            object.position.y = point.y
        }

    }

    initCollisions() {
        this.time.on('tick', () => {
            this.applyCollisions()
        })
    }
}