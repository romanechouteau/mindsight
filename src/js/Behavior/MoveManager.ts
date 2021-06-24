import { DoubleSide, Euler, Intersection, Mesh, Object3D, Raycaster, ShaderMaterial, BufferGeometry, Points, BufferAttribute, Color, Vector2, Scene } from "three";
import gsap from "gsap/all";

import Camera from '../Camera'
import Gravity from "./Gravity"
import { Mouse } from '../Tools/Mouse'

import { BLOOM_LAYER, DEFAULT_FOG_FAR, ENVIRONMENTS_BORDERS_MARGIN, CURSOR_MODES, SCENES } from '../constants'
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
import Component from "../Lib/Component";
import Time from "../Tools/Time";

export default class MoveManager extends Component {
    raycaster: Raycaster
    mouse: Mouse
    dummy: Object3D
    canvas: HTMLElement
    camera: Camera
    ground: Mesh
    scene: Object3D
    cursor: Points
    globalScene: Scene
    cursorMaterial: ShaderMaterial
    cursorBase: Mesh
    lastIntersection: Intersection
    euler: Euler
    prevEuler: Euler
    isLooking: boolean
    isMoving: boolean
    cursorPositions: number[]
    cursorGeometry: BufferGeometry
    pixelRatio: number
    rotationHelper: Object3D
    groundContainer: Mesh
    cursorParticlesMaterial: ShaderMaterial
    gravity: Gravity
    time: Time
    constructor({ camera, mouse, ground, canvas, scene, pixelRatio, globalScene, gravity, time }) {
        super({ store })
        this.mouse = mouse
        this.camera = camera
        this.canvas = canvas
        this.scene = scene
        this.ground = ground.container.children[0].children[0].children[0]
        this.pixelRatio = pixelRatio
        this.globalScene = globalScene
        this.groundContainer = ground.container.children[0]
        this.gravity = gravity
        this.time = time
        this.dummy = new Object3D()

        this.raycaster = new Raycaster()
        this.rotationHelper = new Object3D()
        this.cursorMaterial = new ShaderMaterial({
            vertexShader: moveCursorVertex,
            fragmentShader: moveCursorFragment,
            transparent: true,
            morphTargets: true,
            uniforms: {
                uTime: { value: 0. },
                uOpacity: { value: 1. },
                uMouse: { value: [0., 0.] }
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
                    uParticleSize: { value: 30 * this.pixelRatio },
                    uTime: { value: 0. },
                    uColor: { value: new Color(0xFFFFFF) },
                    uOpacity: { value: 1. },
                    uDirection: { value: new Vector2(0, 0) }
                }
            })
            this.cursor = new Points(this.cursorGeometry, this.cursorParticlesMaterial)
            this.cursor.frustumCulled = false
            this.cursor.layers.enable(BLOOM_LAYER)

            this.cursorBase = new Mesh(this.ground.geometry, this.cursorMaterial)
            this.cursorBase.position.set(0, this.groundContainer.position.y, 0)
            this.cursorBase.scale.set(this.groundContainer.scale.x, this.groundContainer.scale.y, this.groundContainer.scale.z)
            this.cursorBase.rotation.set(this.groundContainer.rotation.x, this.groundContainer.rotation.y, this.groundContainer.rotation.z)
            this.cursorBase.morphTargetInfluences = store.state.worldMorphTargetInfluences

            this.cursorBase.position.y += 0.02
            this.cursorBase.layers.enable(BLOOM_LAYER)

            this.scene.add(this.cursor)
            this.scene.add(this.cursorBase)

            // wait for App mount
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
        this.time.on('tick', () => {
            if (store.state.cursorMode === CURSOR_MODES.MOVE) {
                this.cursorMaterial.uniforms.uTime.value += 0.01
                this.cursorParticlesMaterial.uniforms.uTime.value += 0.02

                const cursor = new Vector2(this.mouse.cursor[0], this.mouse.cursor[1])
                this.raycaster.setFromCamera(cursor, this.camera.camera)
                const lastPoint = this.lastIntersection
                this.lastIntersection = this.raycaster.intersectObject(this.ground, true)[0]

                if (this.lastIntersection) {
                    this.cursor.position.copy(this.lastIntersection.point)
                    this.cursor.position.y += 0.05

                    this.cursorMaterial.uniforms.uMouse.value = this.lastIntersection.uv

                    this.showCursor()
                } else {
                    this.hideCursor()
                }

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
                this.hideCursor()
            }
        })
    }

    showCursor () {
        const value = this.cursorMaterial.uniforms.uOpacity.value + 0.06
        this.cursorMaterial.uniforms.uOpacity.value = Math.min(value, 1)
        this.cursorParticlesMaterial.uniforms.uOpacity.value = Math.min(value, 1)
    }

    hideCursor () {
        const value = this.cursorMaterial.uniforms.uOpacity.value - 0.06
        this.cursorMaterial.uniforms.uOpacity.value = Math.max(value, 0)
        this.cursorParticlesMaterial.uniforms.uOpacity.value = Math.max(value, 0)
    }

    handleMove() {
        this.mouse.on('click', () => {
            if (this.isMoving) return;
            if (this.camera.orbitControls.enabled) return;
            if (this.lastIntersection === undefined) return;
            if (store.state.cursorMode !== CURSOR_MODES.MOVE || this.mouse.targeted !== this.canvas) return
            if (this.isLooking)
                this.toggleLooking(false)
            else {
                this.isMoving = true
                const scale = this.groundContainer.scale
                const borders = this.ground.geometry.boundingBox

                const distances = this.getDistances(borders, scale, this.cursor.position)
                const outAxis = distances.find(distance => distance.min <= ENVIRONMENTS_BORDERS_MARGIN || distance.max <= ENVIRONMENTS_BORDERS_MARGIN)
                const otherAxis = distances.find(distance => distance !== outAxis)
                const translate = {
                    x: this.cursor.position.x - this.camera.container.position.x,
                    z: this.cursor.position.z - this.camera.camera.position.z - this.camera.container.position.z
                }

                const duration = Math.min(this.lastIntersection.distance/5, 2)
                const delay = 0.25
                const ease = outAxis && otherAxis ? 'Power2.easeIn' : 'Power2.easeInOut'

                gsap.to(this.camera.container.position, {
                    delay,
                    duration,
                    x: this.cursor.position.x,
                    y: this.cursor.position.y + this.camera.camera.position.y,
                    z: this.cursor.position.z - this.camera.camera.position.z,
                    onComplete: () => {
                        if (!outAxis) {
                            this.isMoving = false
                        }
                    },
                    ease
                })

                if (outAxis && otherAxis) {
                    gsap.to(this.globalScene.fog, {
                        far: 0.01,
                        duration: duration,
                        delay,
                    })
                    this.handleOutOfBorders(outAxis, otherAxis, scale, borders, translate, duration)
                }

            }
        })
    }

    handleOutOfBorders(outAxis, otherAxis, scale, borders, translate, duration) {
        const fade = document.querySelector('#fade') as HTMLElement
        fade.style.display = 'block'

        const offset = { z: - this.camera.camera.position.z, x: 0 }
        const margin = { min: ENVIRONMENTS_BORDERS_MARGIN, max: - ENVIRONMENTS_BORDERS_MARGIN }
        const factor = { min: 1, max: -1 }

        const appear = () => {
            const direction = Math.min(outAxis.min, outAxis.max) === outAxis.min ? 'max' : 'min'
            const otherDirection = Math.min(otherAxis.min, otherAxis.max) === otherAxis.min ? 'max' : 'min'

            const position = borders[direction][outAxis.axis] * scale[outAxis.axis] + offset[outAxis.axis] + margin[direction]
            const otherPosition = borders[otherDirection][otherAxis.axis] * scale[otherAxis.axis] + offset[otherAxis.axis] + Math.min(otherAxis.min, otherAxis.max) * factor[otherDirection]

            this.camera.container.position[outAxis.axis] = position - translate[outAxis.axis]
            this.camera.container.position[otherAxis.axis] = otherPosition - translate[otherAxis.axis]
            this.dummy.position.y = 100
            this.dummy.position[outAxis.axis] = position
            this.dummy.position[otherAxis.axis] = otherPosition
            this.gravity.instantCollision(this.dummy, this.camera.camera)
            this.camera.container.position.y = this.dummy.position.y

            gsap.to(this.camera.container.position, {
                delay: 0.25,
                duration,
                [outAxis.axis]: position,
                [otherAxis.axis]: otherPosition,
                ease: 'Power2.easeOut',
                onComplete: () => {
                    this.isMoving = false
                }
            })
            gsap.to(fade, {
                delay: 0.25,
                duration: 1,
                opacity: 0,
                onComplete: () => fade.style.display = 'none'
            })
            gsap.to(this.globalScene.fog, {
                far: DEFAULT_FOG_FAR,
                duration: 3,
                delay: 0.25,
                ease: 'Power1.easeInOut'
            })
        }

        gsap.to(fade, {
            delay: Math.min(this.lastIntersection.distance / 5, 2) - 0.75,
            duration: 1,
            opacity: 1,
            onComplete: appear
        })
    }

    getDistances(borders, scale, position) {
        const distancesX = this.getAxisDistance('x', borders, scale, position)
        const distancesZ = this.getAxisDistance('z', borders, scale, position)

        return [distancesX, distancesZ]
    }

    getAxisDistance(axis, borders, scale, position) {
        const minDistance = Math.abs(borders.min[axis] * scale[axis] - position[axis])
        const maxDistance = Math.abs(borders.max[axis] * scale[axis] - position[axis])
        return { min: minDistance, max: maxDistance, axis }
    }

    handleLookAround() {
        this.mouse.on('down', () => {
            if (store.state.cursorMode !== CURSOR_MODES.MOVE) return
            this.prevEuler = this.euler
        })
        this.mouse.on('drag', ev => {
            if (this.camera.orbitControls.enabled || store.state.cursorMode !== CURSOR_MODES.MOVE || this.mouse.targeted !== this.canvas) return
            if (!this.isLooking) this.toggleLooking(true)
            this.euler.y = this.prevEuler.y - (this.mouse.lastCursor[0] - this.mouse.cursor[0])
            this.euler.x = this.prevEuler.x + (this.mouse.lastCursor[1] - this.mouse.cursor[1])
        })
    }

    toggleLooking(isLooking: boolean) {
        this.isLooking = isLooking
        this.cursor.visible = !isLooking
    }

    render = () => {
        if (store.state.scene === SCENES.PARAMETERS) this.cursorBase.morphTargetInfluences = store.state.worldMorphTargetInfluences
    }
}