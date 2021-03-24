import gsap from "gsap/all";
import { BoxBufferGeometry, DoubleSide, Euler, Intersection, Mesh, MeshStandardMaterial, MeshNormalMaterial, Object3D, Raycaster, Vector2 } from "three";
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js'
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import Camera from '../Camera'
// TODO: add app in global namespace
import { Mouse } from '../Tools/Mouse'
import Ground from "../World/Ground";
import neuronBuilder from './NeuronBuilder'

export default class MoveManager {
    raycaster: Raycaster
    mouse: Mouse
    camera: Camera
    ground: Object3D
    cursor: Mesh
    lastIntersection: Intersection
    euler: Euler
    prevEuler: Euler
    isLooking: boolean
    constructor({ camera, mouse }) {
        this.raycaster = new Raycaster()
        this.mouse = mouse
        this.camera = camera
        this.cursor = new Mesh( new BoxBufferGeometry(1, 1, 1), new MeshNormalMaterial() )
        this.cursor.name = 'MoveCursor'
        this.euler = new Euler(0, 0, 0, 'YXZ')
        this.euler.setFromQuaternion( this.camera.container.quaternion )
        this.isLooking = false

        this.setMoveCursor = this.setMoveCursor.bind(this)
        this.handleMove = this.handleMove.bind(this)
        this.handleLookAround = this.handleLookAround.bind(this)
        this.setFakeGround = this.setFakeGround.bind(this)
        
        // TODO: wait for App mount
        setTimeout(this.setMoveCursor, 50)
        this.handleMove()
        this.handleLookAround()

        // TODO: make this geometry merging work
        setTimeout(this.setFakeGround, 500)
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
            // this.cursor.geometry = new DecalGeometry( this.ground, position, orientation, size )

            // rotate camera
            this.camera.camera?.quaternion.setFromEuler( this.euler )
        })
    }

    handleMove() {
        this.mouse.on('click', () => {
            if (this.isLooking)
                this.toggleLooking(false)
            else {
                gsap.to(this.camera.container.position, {
                    delay: 0.25,
                    duration: this.lastIntersection.distance/5,
                    x: this.cursor.position.x,
                    y: this.cursor.position.y,
                    z: this.cursor.position.z - 5,
                })
                neuronBuilder.spawnNeuron(this.cursor.position)
            }
        })
    }
    handleLookAround() {
        this.mouse.on('down', () => {
            this.prevEuler = this.euler
        })
        this.mouse.on('drag', ev => {            
            if (this.camera.orbitControls.enabled) return 
            if (!this.isLooking) this.toggleLooking(true)
            this.euler.y = this.prevEuler.y - (this.mouse.lastCursor[0] - this.mouse.cursor[0])
            this.euler.x = this.prevEuler.x + (this.mouse.lastCursor[1] - this.mouse.cursor[1])
        })
    }
    toggleLooking(isLooking: boolean) {
        this.isLooking = isLooking
        this.cursor.visible = !isLooking
    }
    
    setFakeGround() {

        const ground = this.ground.children[0]

        const groundGeometries = (ground.children as Mesh[]).map(mesh => mesh.geometry.clone())
        
        groundGeometries.forEach((geometry, i) => {
            geometry.translate(
                ground.children[i].position.x,
                ground.children[i].position.y,
                ground.children[i].position.z
            )
            geometry.rotateX(ground.children[i].rotation.x)
            geometry.rotateY(ground.children[i].rotation.y)
            geometry.rotateZ(ground.children[i].rotation.z)
                
            geometry.scale(
                ground.children[i].scale.x,
                ground.children[i].scale.y,
                ground.children[i].scale.z
            )
        })

        console.log('original');
        
        console.log('_____');
        console.log(ground.children.map(mesh => mesh.geometry));
        console.log('_____');
        console.log('copied');
        console.log(groundGeometries);
        
        
        const groundGeometry = BufferGeometryUtils.mergeBufferGeometries(groundGeometries)

        // const fakesGroundMeshes = groundGeometries.map(geometry => new Mesh(geometry, new MeshBasicMaterial({ color: 0x00ff00 })))
        // fakesGroundMeshes.forEach(mesh => App.scene.add(mesh))

        // TODO: test if it works with visible set to false on the mesh
        const fakeGround = new Mesh(groundGeometry, new MeshStandardMaterial({ color: 0xff0000, side: DoubleSide }))
        // fakeGround.position.copy(this.ground.children[0].position)
        // fakeGround.scale.copy(this.ground.children[0].scale)
        // fakeGround.rotation.copy(this.ground.children[0].rotation)

        // fakeGround.matrix.copy(this.ground.children[0].matrix)
        App.scene.add(fakeGround)
    }
}