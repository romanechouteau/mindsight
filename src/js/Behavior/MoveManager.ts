import gsap from "gsap/all";
import { BoxBufferGeometry, DoubleSide, Euler, Intersection, Mesh, MeshStandardMaterial, MeshNormalMaterial, Object3D, Raycaster, Vector2, PlaneBufferGeometry, ShaderMaterial, Vector3, Vector, AdditiveBlending, Texture } from "three";
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js'
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import Camera from '../Camera'
// TODO: add app in global namespace
import { Mouse } from '../Tools/Mouse'
import neuronBuilder from './NeuronBuilder'
import moveCursorVertex from '../../shaders/moveCursorVert.glsl'
import moveCursorFragment from '../../shaders/moveCursorFrag.glsl'
import groundVertex from '../../shaders/groundVert.glsl'
import groundFragment from '../../shaders/groundFrag.glsl'
import { MAX_DISTANCE, moodPositions, MOODS, ZONES_LIMITS } from '../constants'
import Ground from "../World/Ground";
import displacementMapSrc from '../../images/map2.png'
import { textureLoader } from "../Tools/utils";

// @ts-ignore
import store from '@store/index'

// TODO: set cursor in separate class
export default class MoveManager {
    raycaster: Raycaster
    mouse: Mouse
    canvas: HTMLElement
    camera: Camera
    ground: Object3D
    groundInstance: Ground
    groundMaterial: ShaderMaterial
    cursorMaterial: ShaderMaterial
    cursor: Mesh
    interfaceEmpty: HTMLElement
    lastIntersection: Intersection
    euler: Euler
    prevEuler: Euler
    isLooking: boolean
    isMoving: boolean
    cursorDisplacementMap: Texture
    constructor({ camera, mouse, ground, canvas }) {

        this.cursorMaterial = new ShaderMaterial({
            vertexShader: moveCursorVertex,
            fragmentShader: moveCursorFragment,
            uniforms: {
                uTime: { value: 0. },
            }
        })

        this.groundMaterial =
        // new MeshStandardMaterial()
        // this.groundMaterial.onBeforeCompile = (shader) => {
        //     shader.uniforms.uTime = { value: 0 }
        //     shader.vertexShader = 'uniform float uTime;\n' + shader.vertexShader;
        //     shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', groundVertex)

        //     this.groundMaterial.userData.shader = shader;
        // }
        new ShaderMaterial({
            // depthWrite: false,
            // blending: AdditiveBlending,
            // vertexColors: true,
            vertexShader: groundVertex,
            fragmentShader: groundFragment,
            side: DoubleSide,
            flatShading: false,
            uniforms: {
                uTime: { value: 0. },
                [`u${MOODS.JOY}Intensity`]: { value: 0. },
                [`u${MOODS.FEAR}Intensity`]: { value: 0. },
                [`u${MOODS.SADNESS}Intensity`]: { value: 0. },
                [`u${MOODS.ANGER}Intensity`]: { value: 0. },
            }
        })

        // ;(async () => {
        //     this.groundMaterial = new MeshStandardMaterial({
        //         // color: 0x0000ff,
        //         side: DoubleSide,
        //         displacementMap: await textureLoader.loadAsync(displacementMap),
        //         displacementScale: 0.05,
        //     })
        // })();


        this.raycaster = new Raycaster()
        this.mouse = mouse
        this.camera = camera
        this.canvas = canvas
        this.interfaceEmpty = document.querySelector('.brushInterface')
        this.groundInstance = ground


        ;(async () => {
            this.cursorDisplacementMap = (await textureLoader.loadAsync(displacementMapSrc))
            this.cursor = new Mesh( new PlaneBufferGeometry(2, 2, 30, 30), new MeshNormalMaterial({
                displacementMap: this.cursorDisplacementMap
            }) )
            this.cursor.rotation.x = -Math.PI/2
            this.cursor.frustumCulled = false
    
            // this.cursor.translateY(1)
            this.cursor.name = 'MoveCursor'

            // TODO: wait for App mount
            setTimeout(this.setMoveCursor, 50)
            this.setCursorDiplacement()

        })()

        this.euler = new Euler(0, 0, 0, 'YXZ')
        this.euler.setFromQuaternion( this.camera.container.quaternion )
        this.isLooking = false
        this.isMoving = false

        this.setMoveCursor = this.setMoveCursor.bind(this)
        this.setGroundDeformation = this.setGroundDeformation.bind(this)
        this.handleMove = this.handleMove.bind(this)
        this.handleLookAround = this.handleLookAround.bind(this)
        this.setCursorDiplacement = this.setCursorDiplacement.bind(this)
        // this.setFakeGround = this.setFakeGround.bind(this)

        this.handleMove()
        this.handleLookAround()

        // TODO: make this geometry merging work
        // setTimeout(this.setFakeGround, 500)
        // this.setMoveCursor()
    }

    async setCursorDiplacement() {
        console.log('oui');

        this.cursorDisplacementMap.offset = new Vector2(0.5, 0.5)
        
        // const displacementMap = (await textureLoader.loadAsync(displacementMapSrc))
        
        // this.cursor.material.displacementMap = displacementMap
    }

    setMoveCursor() {

        // TODO: refacto
        // @ts-ignore
        this.ground = App.scene.getObjectByName('Ground')
        // @ts-ignore
        App.scene.add(this.cursor)

        // @ts-ignore
        App.state.time.on('tick', () => {
            if (store.state.brush.canDraw === false) {
                this.cursorMaterial.opacity = 1

                const cursor = new Vector2(this.mouse.cursor[0], this.mouse.cursor[1])
                this.raycaster.setFromCamera(cursor, this.camera.camera)

                this.lastIntersection = this.raycaster.intersectObject(this.ground, true)[0]
                if (this.lastIntersection) this.cursor.position.copy(this.lastIntersection.point)
                this.cursor.position.y += 0.1

                // set displacement
                // this.cursor.material.displacementMap
                // this.cursor.geometry = new DecalGeometry( this.ground, position, orientation, size )

                // update shader
                this.cursorMaterial.uniforms.uTime.value += 0.01

                // rotate camera
                if (!this.camera.orbitControls.enabled) this.camera.camera?.quaternion.setFromEuler( this.euler )
                this.camera.raycasterPlane.quaternion.setFromEuler( this.euler )
            } else {
                this.cursorMaterial.opacity = 0
            }
        })
    }

    // TODO: export to Ground class
    setGroundDeformation() {
        App.scene.getObjectByName('Plane').material = this.groundMaterial
        ;(App.scene.getObjectByName('Plane').material as MeshStandardMaterial).needsUpdate = true
        App.state.time.on('tick', () => {
            // const shader = this.groundMaterial.userData.shader
            // if (shader) shader.uniforms.uTime.value += 0.1
            this.groundMaterial.uniforms.uTime.value += 0.1
            for (const mood in moodPositions) {
                const intensity = this.camera.container.position.distanceTo(moodPositions[mood]) / MAX_DISTANCE
                this.groundMaterial.uniforms[`u${mood}Intensity`].value = intensity
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
                const oldNeurons = store.state.scene === 2 ? neuronBuilder.spawnNeuron(this.cursor.position) : []
                this.isMoving = true
                gsap.to(this.camera.container.position, {
                    delay: 0.25,
                    duration: this.lastIntersection.distance/5,
                    x: this.cursor.position.x,
                    y: this.cursor.position.y,
                    z: this.cursor.position.z - 5,
                    onComplete: () => {
                        this.isMoving = false
                        neuronBuilder.removeNeurons(oldNeurons)
                    }
                })

                this.checkZoneStep(this.cursor.position)
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
    // a zone is a part of the map corresponding to an emotion, a step is a part is why you see more zone elements appearing
    checkZoneStep(destination: Vector3){
        const distanceFromCenter = destination.distanceTo(new Vector3(0, 0, 0))

        console.log("🚀 ~ file: MoveManager.ts ~ line 136 ~ MoveManager ~ checkZoneStep ~ distanceTo", distanceFromCenter)

        for (const [limitIndex, limit] of Object.entries(ZONES_LIMITS)) {
            if (distanceFromCenter > limit) {
                this.handleAppearZone(parseInt(limitIndex))
                break;
            }

        }
    }
    handleAppearZone(stepIndex: number) {
        // switch(stepIndex) {
        //     case 0: // furthest
        //         break;
        //     case 1:
        //         this.groundInstance.
        //         break;
        //     case 2:
        //         break;
        //     default:
        //         break;
        // }

        if (stepIndex === 0) App.state.nextStep()
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

        const groundGeometry = BufferGeometryUtils.mergeBufferGeometries(groundGeometries)

        // const fakesGroundMeshes = groundGeometries.map(geometry => new Mesh(geometry, new MeshBasicMaterial({ color: 0x00ff00 })))
        // fakesGroundMeshes.forEach(mesh => App.scene.add(mesh))

        // TODO: test if it works with visible set to false on the mesh
        const fakeGround = new Mesh(groundGeometry, new MeshStandardMaterial({ color: 0xff0000, side: DoubleSide }))
        // fakeGround.position.copy(this.ground.children[0].position)
        // fakeGround.scale.copy(this.ground.children[0].scale)
        // fakeGround.rotation.copy(this.ground.children[0].rotation)

        // fakeGround.matrix.copy(this.ground.children[0].matrix)
        // App.scene.add(fakeGround)
    }
}