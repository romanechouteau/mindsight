import { DoubleSide, Euler, Intersection, Mesh, Object3D, Raycaster, ShaderMaterial, BufferGeometry, Points, BufferAttribute, Color, Vector2 } from "three";
import gsap from "gsap/all";
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js'

import Camera from '../Camera'
// TODO: add app in global namespace
import Ground from "../World/Ground"
import { Mouse } from '../Tools/Mouse'

import { BLOOM_LAYER, CURSOR_SIZE } from '../constants'
// @ts-ignore
import moveCursorVertex from '../../shaders/moveCursorVert.glsl'
// @ts-ignore
import moveCursorFragment from '../../shaders/moveCursorFrag.glsl'

// @ts-ignore
import vertexShader from '@shaders/cursorVert.glsl'
// @ts-ignore
import fragmentShader from '@shaders/cursorFrag.glsl'

// @ts-ignore
import store from '@store/index'

// TODO: set cursor in separate class
export default class MoveManager {
    raycaster: Raycaster
    mouse: Mouse
    canvas: HTMLElement
    camera: Camera
    ground: Mesh
    scene: Object3D
    cursor: Points
    groundInstance: Ground
    cursorMaterial: ShaderMaterial
    cursorBase: Mesh
    interfaceEmpty: HTMLElement
    lastIntersection: Intersection
    euler: Euler
    prevEuler: Euler
    isLooking: boolean
    isMoving: boolean
    cursorPositions: number[]
    cursorGeometry: BufferGeometry
    pixelRatio: number
    rotationHelper: Object3D
    cursorParticlesMaterial: ShaderMaterial
    constructor({ camera, mouse, ground, canvas, scene, pixelRatio }) {
        this.mouse = mouse
        this.camera = camera
        this.canvas = canvas
        this.scene = scene
        this.ground = ground.container.children[0].children[0].children[0]
        this.pixelRatio = pixelRatio

        this.raycaster = new Raycaster()
        this.interfaceEmpty = document.querySelector('.brushInterface')
        this.rotationHelper = new Object3D()
        this.cursorMaterial = new ShaderMaterial({
            vertexShader: moveCursorVertex,
            fragmentShader: moveCursorFragment,
            transparent: true,
            uniforms: {
                uTime: { value: 0. },
                uOpacity: { value: 1. }
            },
            side: DoubleSide
        })

        ;(async () => {
            this.cursorPositions = Array.from(Array(300), () => (Math.random() - 0.5) * 0.8)
            this.cursorGeometry = new BufferGeometry()
            this.cursorGeometry.setAttribute(
                'position',
                new BufferAttribute(new Float32Array(this.cursorPositions), 3)
            )
            this.cursorParticlesMaterial = new ShaderMaterial({
                depthWrite: false,
                depthTest: true,
                vertexColors: true,
                vertexShader,
                fragmentShader,
                transparent: true,
                uniforms: {
                    uParticleSize: { value: 50 * this.pixelRatio },
                    uTime: { value: 0. },
                    uColor: { value: new Color(0xFFFFFF) },
                    uOpacity: { value: 1. },
                    uDirection: { value: new Vector2(0, 0) }
                }
            })
            this.cursor = new Points(this.cursorGeometry, this.cursorParticlesMaterial)
            this.cursor.frustumCulled = true
            this.cursor.layers.enable(BLOOM_LAYER)

            const geometry = new DecalGeometry(this.ground, this.cursor.position, new Euler(0, 0, 0, 'YXZ'), CURSOR_SIZE)
            this.cursorBase = new Mesh(geometry, this.cursorMaterial)
            this.cursorBase.position.y = 0.05
            this.cursorBase.layers.enable(BLOOM_LAYER)

            this.scene.add(this.cursor)
            this.scene.add(this.cursorBase)

            // TODO: wait for App mount
            setTimeout(this.setMoveCursor.bind(this), 50)

        })()

        this.euler = new Euler(0, 0, 0, 'YXZ')
        this.euler.setFromQuaternion( this.camera.container.quaternion )
        this.isLooking = false
        this.isMoving = false

        this.setMoveCursor = this.setMoveCursor.bind(this)
        this.handleMove = this.handleMove.bind(this)
        this.handleLookAround = this.handleLookAround.bind(this)

        this.handleMove()
        this.handleLookAround()
    }

    setMoveCursor() {
        // @ts-ignore
        App.state.time.on('tick', () => {
            if (store.state.brush.canDraw === false) {
                const value = this.cursorMaterial.uniforms.uOpacity.value + 0.06
                this.cursorMaterial.uniforms.uOpacity.value = Math.min(value, 1)
                this.cursorParticlesMaterial.uniforms.uOpacity.value = Math.min(value, 1)

                const cursor = new Vector2(this.mouse.cursor[0], this.mouse.cursor[1])
                this.raycaster.setFromCamera(cursor, this.camera.camera)

                const lastPoint = this.lastIntersection
                this.lastIntersection = this.raycaster.intersectObject(this.ground, true)[0]

                if (this.lastIntersection) {
                    this.cursor.position.copy(this.lastIntersection.point)
                    this.rotationHelper.position.copy(this.lastIntersection.point)
                    this.cursor.position.y += 0.05

                    const orientation = this.lastIntersection.face.normal.clone()
                    orientation.transformDirection( this.ground.matrixWorld )
                    orientation.multiplyScalar( 10 )
                    orientation.add(this.lastIntersection.point)

                    this.rotationHelper.lookAt(orientation)
                    this.cursorBase.geometry = new DecalGeometry(this.ground, this.cursor.position, this.rotationHelper.rotation, CURSOR_SIZE)
                }

                // update shader
                this.cursorMaterial.uniforms.uTime.value += 0.01
                this.cursorParticlesMaterial.uniforms.uTime.value += 0.02
                if (lastPoint && this.lastIntersection) {
                    const oldDirection = this.cursorParticlesMaterial.uniforms.uDirection.value
                    const difference = new Vector2(this.lastIntersection.point.x - lastPoint.point.x, this.lastIntersection.point.z - lastPoint.point.z)
                    this.cursorParticlesMaterial.uniforms.uDirection.value = oldDirection.lerp(difference, 0.05)
                } else {
                    this.cursorParticlesMaterial.uniforms.uDirection.value = new Vector2(0, 0)
                }

                // rotate camera
                if (!this.camera.orbitControls.enabled) this.camera.camera?.quaternion.setFromEuler( this.euler )
                this.camera.raycasterPlane.quaternion.setFromEuler( this.euler )
            } else {
                const value = this.cursorMaterial.uniforms.uOpacity.value - 0.06
                this.cursorMaterial.uniforms.uOpacity.value = Math.max(value, 0)
                this.cursorParticlesMaterial.uniforms.uOpacity.value = Math.max(value, 0)
            }
        })
    }

    handleMove() {
        if (this.isMoving) return;
        this.mouse.on('click', () => {
            if (this.camera.orbitControls.enabled) return;
            if (this.lastIntersection === undefined) return;
            if (store.state.brush.canDraw === true || (this.mouse.targeted !== this.canvas && this.mouse.targeted !== this.interfaceEmpty)) return
            if (this.isLooking)
                this.toggleLooking(false)
            else {

                this.isMoving = true
                gsap.to(this.camera.container.position, {
                    delay: 0.25,
                    duration: this.lastIntersection.distance/5,
                    x: this.cursor.position.x,
                    y: this.cursor.position.y,
                    z: this.cursor.position.z - 5,
                    onComplete: () => this.isMoving = false
                })
            }
        })
    }

    handleLookAround() {
        this.mouse.on('down', () => {
            if (store.state.brush.canDraw === true) return
            this.prevEuler = this.euler
        })
        this.mouse.on('drag', ev => {
            if (this.camera.orbitControls.enabled || store.state.brush.canDraw === true || (this.mouse.targeted !== this.canvas && this.mouse.targeted !== this.interfaceEmpty)) return
            if (!this.isLooking) this.toggleLooking(true)
            this.euler.y = this.prevEuler.y - (this.mouse.lastCursor[0] - this.mouse.cursor[0])
            this.euler.x = this.prevEuler.x + (this.mouse.lastCursor[1] - this.mouse.cursor[1])
        })
    }

    toggleLooking(isLooking: boolean) {
        this.isLooking = isLooking
        this.cursor.visible = !isLooking
    }
}