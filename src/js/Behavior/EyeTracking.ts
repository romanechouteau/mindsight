import { BufferGeometry, Mesh, MeshNormalMaterial, Object3D, Raycaster, SphereGeometry, Vector2, BufferAttribute, Points, PointsMaterial, DoubleSide } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { reduce, map, size, flatMap } from 'lodash'

// @ts-ignore
import Mouse from '@tools/Mouse'
// @ts-ignore
import faceSrc from '@models/face.glb'
// @ts-ignore
import webgazer from '@tools/WebGazer'

const loader = new GLTFLoader()

export default class EyeTracking {
    face: Points
    mouse: Mouse
    camera: any
    points: Mesh[]
    inZone: boolean[]
    container: Object3D
    raycaster: Raycaster
    calibrated: boolean
    windowWidth: number
    windowHeight: number
    pointsClicks: {}
    faceGeometry: BufferGeometry
    facePositions: number[]

    constructor(options: { windowWidth: number, windowHeight: number, mouse: Mouse, camera: any }) {
        const { windowWidth, windowHeight, mouse, camera } = options

        this.container = new Object3D()
        this.container.name = 'EyeTracking'

        this.mouse = mouse
        this.camera = camera
        this.windowWidth = windowWidth
        this.windowHeight = windowHeight

        this.inZone = []
        this.raycaster = new Raycaster()
        this.calibrated = false
        this.pointsClicks = {}
        this.facePositions = []

        this.setWebGazer()
        this.setFace()
        this.setCalibrationPoints()
        this.listenMouseDown()
    }

    setCalibrationPoints() {
        const positions = [
            [-1, -1],
            [-1, 0],
            [-1, 1],
            [0, -1],
            [0, 1],
            [1, -1],
            [1, 0],
            [1, 1],
        ]
        const geometry = new SphereGeometry(0.05, 32, 32)
        const material = new MeshNormalMaterial()
        // provisoire, valeur arbitraire pour le moment à adapter à la taille l'écran
        const cameraFrame = [3, 1.5]

        this.points = map(positions, position => {
            const point = new Mesh(geometry, material)
            point.position.x = position[0] * cameraFrame[0]
            point.position.y = position[1] * cameraFrame[1]
            return point
        })

        this.container.add(...this.points)
    }

    setWebGazer() {
        webgazer.setGazeListener(this.getPredictions.bind(this)).begin()
        webgazer.showVideo(false)
        webgazer.showFaceOverlay(false)
        webgazer.showFaceFeedbackBox(false)
        webgazer.showPredictionPoints(false)
    }

    async setFace() {
        // VISAGE PERSONNALISE
        this.faceGeometry = new BufferGeometry()

        // VISAGE MODEL
        // const faceModel = (await loader.loadAsync(faceSrc)).scene
        // // @ts-ignore
        // this.faceGeometry = faceModel.children[2].geometry
        // this.faceGeometry.rotateX(Math.PI / 2)

        const material = new PointsMaterial({
            size: 0.04,
            sizeAttenuation: true,
            color: 0xff0000,
            side: DoubleSide
        })
        this.face = new Points(this.faceGeometry, material)

        // VISAGE PERSONNALISE
        this.face.scale.set(-0.01, -0.01, -0.01)

        // VISAGE MODEL
        // this.face.scale.set(10, 10, 10)

        this.container.add(this.face)
    }

    getPredictions(data) {
        if (data === null) {
            return
        }

        // VISAGE PERSONNALISE SUIT REGARD
        if (this.facePositions.length === 0) {
            // VISAGE PERSONNALISE SUIT MOUVEMENTS
            this.facePositions = flatMap(webgazer.getTracker().positionsArray, position =>
                [
                    position[0] - 310,
                    position[1] - 250,
                    position[2]
                ]
            )
            const positionsArray = new Float32Array(this.facePositions)

            this.faceGeometry.setAttribute(
                'position',
                new BufferAttribute(positionsArray, 3)
            )
        // VISAGE PERSONNALISE SUIT REGARD
        }

        // valeur 4 arbitraire pour le moment
        const x = (data.x / this.windowWidth - 0.5) * 4
        const y = - (data.y / this.windowHeight - 0.5) * 4

        // VISAGE SUIT REGARD
        this.face.lookAt(x, y, 5)

        if (this.calibrated) {
            this.checkInZone(x, y)
        }
    }

    checkInZone(x, y) {
        // valeur radius arbitraire pour le moment
        // valeur duration à varier selon la durée du regard au centre attendue
        const radius = 1
        const duration = 50
        const isInZone = Math.pow(x, 2) + (Math.pow(y, 2)) < Math.pow(radius, 2)

        if (this.inZone.length < duration) {
            return this.inZone.push(isInZone)
        }

        this.inZone.shift()
        this.inZone.push(isInZone)

        if (reduce(this.inZone, (acc, val) => acc === false ? acc : val, true)) {
            this.container.remove(this.face)
            webgazer.pause()
            document.getElementById('webgazerVideoContainer').remove()
        }
    }

    listenMouseDown() {
        this.mouse.on('click', () => {
            const cursor = new Vector2(this.mouse.cursor[0], this.mouse.cursor[1])
            this.raycaster.setFromCamera(cursor, this.camera.camera)

            const intersection = this.raycaster.intersectObjects(this.points)
            if (intersection[0]) {
                intersection[0].object.scale.x += 0.2
                intersection[0].object.scale.y += 0.2
                intersection[0].object.scale.z += 0.2

                const uuid = intersection[0].object.uuid
                this.pointsClicks[uuid] = this.pointsClicks[uuid] ? this.pointsClicks[uuid] + 1 : 1

                if (size(this.pointsClicks) === size(this.points) &&
                    reduce(this.pointsClicks, (acc, val) => acc === false ? acc : val >= 3, true)) {
                    this.calibrated = true
                    this.container.remove(...this.points)
                }
            }
        })
      }
}