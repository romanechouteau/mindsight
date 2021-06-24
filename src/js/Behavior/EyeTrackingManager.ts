import gsap from "gsap/all"
import * as dat from 'dat.gui'
import { debounce } from 'lodash'

// @ts-ignore
import store from '@store/index'
import Camera from '../Camera'
// @ts-ignore
import webgazer from '@tools/WebGazer'
// @ts-ignore
import template from '../../templates/eyetracking.template'
// @ts-ignore
import Component from '@lib/Component'
// @ts-ignore
import pointTemplate from '../../templates/eyetrackingPoint.template'
// @ts-ignore
import { htmlUtils } from '@tools/utils'
import {
    EYETRACKING_RADIUS, EYETRACKING_DURATION, EYETRACKING_SUCCESS, OUTER_EYE_MOVEMENT,
    INNER_EYE_MOVEMENT, PUPIL_MOVEMENT, PUPIL_SHINE_MOVEMENT, EYE_TRACKING_DEBOUNCE, SCENES
} from '../constants'
import SoundManager from "./SoundManager"

export default class EyeTrackingManager extends Component {
    sizes: any
    debug: dat.GUI
    camera: Camera
    points: NodeListOf<Element>
    inZone: boolean[]
    params: {
        radius: number,
        duration: number,
        success: number,
        outerEyeMovement: number,
        innerEyeMovement: number,
        pupilMovement: number,
        pupilShineMovement: number,
    }
    pupilR: number
    stopped: Boolean
    centerX: number
    centerY: number
    element: HTMLElement
    calibrated: boolean
    debugFolder: any
    eyeMovement: any
    pointsClicks: number[]
    currentPoint: number
    currentTranslate: number

    constructor(options: { sizes: any, debug: dat.GUI, camera: Camera }) {
        super({
            store,
            element: document.querySelector('#eyetrackingManager')
        })

        SoundManager.play(3, 4000)

        const { sizes, debug, camera } = options

        this.sizes = sizes
        this.debug = debug
        this.camera = camera

        this.inZone = []
        this.stopped = false
        this.calibrated = false
        this.currentPoint = 0
        this.pointsClicks = [0, 0, 0, 0, 0, 0, 0]
        this.currentTranslate = 25
        this.params = {
            radius: EYETRACKING_RADIUS,
            duration: EYETRACKING_DURATION,
            success: EYETRACKING_SUCCESS,
            outerEyeMovement: OUTER_EYE_MOVEMENT,
            innerEyeMovement: INNER_EYE_MOVEMENT,
            pupilMovement: PUPIL_MOVEMENT,
            pupilShineMovement: PUPIL_SHINE_MOVEMENT,
        }

        if (this.debug) {
            this.setDebug()
        }

        // wait before showing eye
        setTimeout(() => {
            this.element.style.opacity = '1'
        }, 5000)

        this.setWebGazer()
        this.render()
        this.eyeMovement = debounce(this.moveEye, EYE_TRACKING_DEBOUNCE, { leading: true })
    }

    setWebGazer() {
        webgazer.setGazeListener(this.getPredictions.bind(this)).begin()
        webgazer.showVideo(false)
        webgazer.showFaceOverlay(false)
        webgazer.showFaceFeedbackBox(false)
        webgazer.showPredictionPoints(false)
    }

    getPredictions(data) {
        if (data === null) {
            return
        }

        const x = (data.x / this.sizes.viewport.width - 0.5) * 2
        const y = - (data.y / this.sizes.viewport.height - 0.5) * 2

        if (this.stopped === false) {
            this.eyeMovement(x, -y)
        }

        if (this.calibrated) {
            this.checkInZone(x, y)
        }
    }

    moveEye(moveX, moveY) {
        const currentVH = this.currentTranslate * 0.01 * this.sizes.height
        const duration = 0.5

        // move each eye part in gaze direction
        const outerEyeBox = (this.element.querySelector('.outerEye') as HTMLElement).getBoundingClientRect()
        gsap.to(this.element.querySelector('.outerEye'), {
            duration,
            translateX: `${moveX * this.params.outerEyeMovement}%`,
            translateY: `${currentVH + moveY * this.params.outerEyeMovement * outerEyeBox.height * 0.01}px`,
        })

        const innerEyeBox = (this.element.querySelector('.innerEye') as HTMLElement).getBoundingClientRect()
        gsap.to(this.element.querySelector('.innerEye'), {
            duration,
            translateX: `${moveX * this.params.innerEyeMovement}%`,
            translateY: `${currentVH + moveY * this.params.innerEyeMovement * innerEyeBox.height * 0.01}px`,
        })

        const pupilBox = (this.element.querySelector('.pupil') as HTMLElement).getBoundingClientRect()
        gsap.to(this.element.querySelectorAll('.pupil, .maskWrapper .pupilWhite'), {
            duration,
            translateX: `${moveX * this.params.pupilMovement * pupilBox.width * 0.01}px`,
            translateY: `${currentVH + moveY * this.params.pupilMovement * pupilBox.height * 0.01}px`,
        })
        gsap.to(this.element.querySelectorAll('#maskPupil .maskWrapper'), {
            duration,
            translateX: `${-(moveX * this.params.pupilMovement * pupilBox.width * 0.01)}px`,
            translateY: `${-(currentVH + moveY * this.params.pupilMovement * pupilBox.height * 0.01)}px`,
        })

        const pupilCenterBox = (this.element.querySelector('.pupilCenter') as HTMLElement).getBoundingClientRect()
        gsap.to(this.element.querySelectorAll('#maskShine .maskWrapper'), {
            duration,
            translateX: `${-(moveX * this.params.pupilShineMovement * pupilCenterBox.width * 0.01)}px`,
            translateY: `${-(currentVH + moveY * this.params.pupilShineMovement * pupilCenterBox.height * 0.01)}px`,
        })
        gsap.to(this.element.querySelector('.pupilCenterMask'), {
            duration,
            translateX: `${moveX * this.params.pupilShineMovement * pupilCenterBox.width * 0.01}px`,
            translateY: `${currentVH + moveY * this.params.pupilShineMovement * pupilCenterBox.height * 0.01}px`
        })

        gsap.to(this.element.querySelector('.pupilCenter'), {
            duration,
            translateX: `${moveX * this.params.pupilShineMovement * pupilCenterBox.width * 0.01}px`,
            translateY: `${currentVH + moveY * this.params.pupilShineMovement * pupilCenterBox.height * 0.01}px`
        })
    }

    checkInZone(x, y) {
        // check if gaze is in focus zone
        const isInZone = Math.pow(x, 2) + (Math.pow(y, 2)) < Math.pow(this.params.radius, 2)

        if (this.inZone.length < this.params.duration) {
            const percentage = this.inZone.reduce((acc, val) => acc + (val ? 1 : 0), 0) / this.params.duration
            this.focusProgress(percentage)
            return this.inZone.push(isInZone)
        }

        this.inZone.shift()
        this.inZone.push(isInZone)

        // get focus percentage
        const percentage = this.inZone.reduce((acc, val) => acc + (val ? 1 : 0), 0) / this.params.duration
        if (this.stopped === false) {
            this.focusProgress(percentage)
        }

        // stop eyetracking if user is focused
        if (percentage > this.params.success) {
            this.stopped = true
            this.stop()
        }
    }

    focusProgress(percentage) {
        const blur = percentage / this.params.success * 4
        gsap.to(this.element, {
            duration: 0.1,
            filter: `blur(${blur}px)`
        })
    }

    listenMouseDown() {
        this.element.querySelectorAll('.point .pointCircle').forEach((elem: HTMLElement) => {
            const index = parseInt(elem.getAttribute('data-order'))

            elem.addEventListener('click', () => {
                this.pointsClicks[index] += 1

                // handle click if user hasn't clicked 3 times yet
                if (this.pointsClicks[index] < 3) {
                    const r = 10 + 2 * this.pointsClicks[index]
                    return elem.setAttribute('r', r.toString())
                }

                // handle click if user has clicked 3 times
                elem.classList.add('invisible')
                this.currentPoint += 1

                this.handleNextPoint()
            })
        })
    }

    handleNextPoint() {
        // end calibration if all points have been clicked
        if (this.currentPoint === this.pointsClicks.length) {
            return this.calibrated = true
        }

        // display next point
        const nextPoint = this.element.querySelector(`.point .pointCircle[data-order="${this.currentPoint}"]`)
        nextPoint.classList.remove('invisible')
        if (this.currentPoint === Math.floor(this.pointsClicks.length / 2) || this.currentPoint === this.pointsClicks.length - 1) {
            this.currentTranslate = this.currentPoint === this.pointsClicks.length - 1 ? 0 : -25
            return gsap.to(this.element.querySelectorAll('svg > g'), {
                duration: 0.8,
                translateY: `${this.currentTranslate}vh`,
                ease: 'power3.inOut'
            })
        }
    }

    render() {
        const width = this.sizes.viewport.width
        const height = this.sizes.viewport.height
        const centerX = width * 0.5
        const centerY = height * 0.5
        const outerAdd = height > width * 0.7 ? height * 0.5 : height * 0.2
        const outerRX = width * 0.5 + outerAdd
        const outerRY = height * 0.7
        const pupilR = height * 0.3
        const pupilCenterX = Math.cos(-Math.PI / 6) * (pupilR * 1.3) + centerX
        const pupilCenterY = Math.sin(-Math.PI / 6) * (pupilR * 1.3) + centerY

        const getPointY = (x, direction) => this.getPointYEllipse(x, [centerX, centerY], outerRX, outerRY, direction)

        const pointsHTML = this.pointsClicks.reduce((acc, val, i) => {
            const r = 10 + 2 * val
            const invisible = this.currentPoint === i ? '' : 'invisible'

            if (i < this.pointsClicks.length - 1) {
                const halfPoints = Math.floor(this.pointsClicks.length / 2)
                const index = i % halfPoints
                const line = Math.floor(i / halfPoints)

                // get point position on ellipse
                const direction = -1 + (2 * line)
                const x = (width - 200) * index / (halfPoints - 1) + 100
                const y = getPointY(x, direction)

                return acc + htmlUtils.createHTMLFromTemplate(pointTemplate, { x, y, r, order: i, invisible })
            }

            return acc + htmlUtils.createHTMLFromTemplate(pointTemplate, { x: centerX, y: centerY, r, order: i, invisible })
        }, '')
        const eyetrackingTemplate = htmlUtils.insertHTMLInTemplate(template, pointsHTML, 'points')

        htmlUtils.renderToDOM(this.element, eyetrackingTemplate, {
            width,
            height,
            pupilR,
            centerX,
            centerY,
            outerRX,
            outerRY,
            innerEyeR: height * 0.6,
            pupilCenterR: height * 0.15,
            pupilCenterX,
            pupilCenterY
        })

        this.listenMouseDown()
    }

    getPointYEllipse (x, center, rX, rY, direction) {
        return Math.sqrt((1 - Math.pow(x - center[0], 2) / Math.pow(rX, 2)) * Math.pow(rY, 2)) * direction + center[1]
    }

    stop() {
        // stop webgazer
        webgazer.pause()
        this.eyeMovement.cancel()
        const webgazerContainer = document.getElementById('webgazerVideoContainer')
        if (webgazerContainer) {
            webgazerContainer.remove()
        }

        this.render = () => {}
        this.stopped = true
        store.dispatch('updateScene', SCENES.ENVIRONMENT)

        // scene transition
        gsap.timeline()
            .add('start')
            .to(this.element, {
                delay: 0.3,
                duration: 1.3,
                scaleX: 10,
                scaleY: 10,
                opacity: 0,
                ease: 'power3.inOut',
                onComplete: () => {
                    htmlUtils.renderToDOM(this.element, '', {})
                    this.element.remove()
                }
            }, 'start')
            .to(document.querySelector('#intro .fade'), {
                delay: 0.5,
                duration: 1.3,
                backgroundColor: 'rgba(255, 255, 255, 1)',
                onComplete: () => {
                    this.camera.moveIntro()
                }
            }, 'start')
            .to(document.querySelector('#intro'), {
                delay: 0.5,
                duration: 1,
                opacity: 0,
                onComplete: function() {
                    store.dispatch('finishIntro')
                }
            })
    }

    setDebug() {
        this.debugFolder = this.debug.addFolder('Eyetracking')
        this.debugFolder.open()
        this.debugFolder
            .add(this.params, 'radius')
            .step(0.01)
            .min(0)
            .max(1)
            .name('Success radius')
        this.debugFolder
            .add(this.params, 'duration')
            .step(10)
            .min(0)
            .max(500)
            .name('Focus duration')
        this.debugFolder
            .add(this.params, 'success')
            .step(0.05)
            .min(0)
            .max(1)
            .name('Success percentage')
        this.debugFolder
            .add(this.params, 'outerEyeMovement')
            .step(0.1)
            .min(0)
            .max(5)
            .name('Outer eye movement')
        this.debugFolder
            .add(this.params, 'innerEyeMovement')
            .step(1)
            .min(0)
            .max(50)
            .name('Inner eye movement')
        this.debugFolder
            .add(this.params, 'pupilMovement')
            .step(5)
            .min(0)
            .max(100)
            .name('Pupil movement')
        this.debugFolder
            .add(this.params, 'pupilShineMovement')
            .step(10)
            .min(0)
            .max(100)
            .name('Pupil shine movement')
    }
}