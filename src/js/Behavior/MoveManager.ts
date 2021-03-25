import gsap from "gsap/all";
import { BoxBufferGeometry, Euler, Intersection, Mesh, MeshNormalMaterial, Object3D, Raycaster, Vector2 } from "three";
import Camera from '../Camera'
// TODO: add app in global namespace
import { Mouse } from '../Tools/Mouse'
import Ground from "../World/Ground";

export default class MoveManager {
    raycaster: Raycaster
    mouse: Mouse
    camera: Camera
    ground: Object3D
    cursor: Object3D
    lastIntersection: Intersection
    euler: Euler
    prevEuler: Euler
    constructor({ camera, mouse }) {
        this.raycaster = new Raycaster()
        this.mouse = mouse
        this.camera = camera
        this.cursor = new Mesh( new BoxBufferGeometry(1, 1, 1), new MeshNormalMaterial() )
        this.euler = new Euler(0, 0, 0, 'YXZ')
        this.euler.setFromQuaternion( this.camera.container.quaternion )

        this.setMoveCursor = this.setMoveCursor.bind(this)
        this.handleMove = this.handleMove.bind(this)
        this.handleLookAround = this.handleLookAround.bind(this)
        
        // TODO: wait for App mount
        setTimeout(this.setMoveCursor, 50)
        this.handleMove()
        this.handleLookAround()
        // this.setMoveCursor()
    }

    setMoveCursor() {

        // TODO: refacto
        // @ts-ignore
        this.ground = App.scene.getObjectByName('Ground')
        // @ts-ignore
        App.scene.add(this.cursor)
        
        // @ts-ignore
        App.state.time.on('tick', () => {
            const cursor = new Vector2(this.mouse.cursor[0], this.mouse.cursor[1])
            this.raycaster.setFromCamera(cursor, this.camera.camera)

            this.lastIntersection = this.raycaster.intersectObject(this.ground, true)[0]
            if (this.lastIntersection) this.cursor.position.copy(this.lastIntersection.point)

            // rotate camera
            this.camera.camera?.quaternion.setFromEuler( this.euler )
        })
    }

    handleMove() {
        this.mouse.on('click', () => {
            gsap.to(this.camera.container.position, {
                delay: 0.25,
                duration: this.lastIntersection.distance/5,
                x: this.cursor.position.x,
                y: this.cursor.position.y,
                z: this.cursor.position.z - 5,
            })
        })
    }

    handleLookAround() {
        this.mouse.on('down', () => {
            this.prevEuler = this.euler
        })
        this.mouse.on('drag', ev => {
            // const clientX = ev?.clientX ?? 0, clientY = ev?.clientY ?? 0
            // this.euler.y = -((clientX - window.innerWidth/2)) * 0.0002
            // this.euler.x = -(clientY - window.innerHeight/2) * 0.0002
            // console.log(ev);            
            this.euler.y = this.prevEuler.y - (this.mouse.lastCursor[0] - this.mouse.cursor[0])
            this.euler.x = this.prevEuler.x + (this.mouse.lastCursor[1] - this.mouse.cursor[1])
        })
    }
}