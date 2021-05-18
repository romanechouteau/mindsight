import gsap from "gsap/all"

// @ts-ignore
import store from '@store/index'
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
import { EYETRACKING_RADIUS, EYETRACKING_DURATION, EYETRACKING_SUCCESS, OUTER_EYE_MOVEMENT, INNER_EYE_MOVEMENT, PUPIL_MOVEMENT } from '../constants'

export default class EyeTrackingManager extends Component {
    sizes: any
    points: NodeListOf<Element>
    inZone: boolean[]
    pupilR: number
    centerX: number
    centerY: number
    element: HTMLElement
    calibrated: boolean
    pointsClicks: number[]
    currentPoint: number
    currentTranslate: number

    constructor(options: { sizes: any }) {
        super({
            store,
            element: document.querySelector('#eyetrackingManager')
        })

        const { sizes } = options

        this.sizes = sizes

        this.inZone = []
        this.calibrated = false
        this.currentPoint = 0
        this.pointsClicks = [0, 0, 0, 0, 0, 0, 0]
        this.currentTranslate = 25

        this.setWebGazer()
        this.render()
        this.listenMouseDown()
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

        this.moveEye(x, -y)

        if (this.calibrated) {
            this.checkInZone(x, y)
        }
    }

    moveEye(moveX, moveY) {
        const currentVH = this.currentTranslate * 0.01 * this.sizes.height

        const outerEyeBox = (this.element.querySelector('.outerEye') as HTMLElement).getBoundingClientRect()
        gsap.to(this.element.querySelector('.outerEye'), {
            duration: 0.2,
            translateX: `${moveX * OUTER_EYE_MOVEMENT}%`,
            translateY: `${currentVH + moveY * OUTER_EYE_MOVEMENT * outerEyeBox.height * 0.01}px`,
        })

        const innerEyeBox = (this.element.querySelector('.innerEye') as HTMLElement).getBoundingClientRect()
        gsap.to(this.element.querySelector('.innerEye'), {
            duration: 0.2,
            translateX: `${moveX * INNER_EYE_MOVEMENT}%`,
            translateY: `${currentVH + moveY * INNER_EYE_MOVEMENT * innerEyeBox.height * 0.01}px`,
        })

        const pupilBox = (this.element.querySelector('.pupil') as HTMLElement).getBoundingClientRect()
        gsap.to(this.element.querySelector('.pupil'), {
            duration: 0.2,
            translateX: `${moveX * PUPIL_MOVEMENT}%`,
            translateY: `${currentVH + moveY * PUPIL_MOVEMENT * pupilBox.height * 0.01}px`,
        })

        const angle = Math.atan2(moveX, moveY)
        const inCircle = moveX > - EYETRACKING_RADIUS && moveX < EYETRACKING_RADIUS
        && moveY > - EYETRACKING_RADIUS && moveY < EYETRACKING_RADIUS
        const pupilCenterX = inCircle ? this.centerX + moveX * this.pupilR : Math.sin(angle) * this.pupilR + this.centerX
        const pupilCenterY = inCircle ? this.centerY + moveY * this.pupilR : Math.cos(angle) * this.pupilR + this.centerY
        gsap.to(this.element.querySelector('.pupilCenter circle'), {
            duration: 0.2,
            cx: pupilCenterX,
            cy: pupilCenterY,
        })
        gsap.to(this.element.querySelector('.pupilCenterMask'), {
            duration: 0.2,
            cx: pupilCenterX,
            cy: pupilCenterY,
        })

        gsap.to(this.element.querySelector('.pupilCenter'), {
            duration: 0.2,
            translateX: `${moveX * PUPIL_MOVEMENT * pupilBox.width * 0.01}px`,
            translateY: `${currentVH + moveY * PUPIL_MOVEMENT * pupilBox.height * 0.01}px`,
        })
    }

    checkInZone(x, y) {
        const isInZone = Math.pow(x, 2) + (Math.pow(y, 2)) < Math.pow(EYETRACKING_RADIUS, 2)

        if (this.inZone.length < EYETRACKING_DURATION) {
            return this.inZone.push(isInZone)
        }

        this.inZone.shift()
        this.inZone.push(isInZone)

        const percentage = this.inZone.reduce((acc, val) => acc + (val ? 1 : 0), 0) / EYETRACKING_DURATION

        if (percentage > EYETRACKING_SUCCESS) {
            this.stop()
        }
    }

    listenMouseDown() {
        this.element.querySelectorAll('.point .pointCircle').forEach((elem: HTMLElement) => {
            const index = parseInt(elem.getAttribute('data-order'))

            elem.addEventListener('click', () => {
                this.pointsClicks[index] += 1

                if (this.pointsClicks[index] < 3) {
                    const r = 10 + 2 * this.pointsClicks[index]
                    return elem.setAttribute('r', r.toString())
                }

                elem.classList.add('invisible')
                this.currentPoint += 1

                this.handleNextPoint()
            })
        })
    }

    handleNextPoint() {
        if (this.currentPoint === this.pointsClicks.length) {
            return this.calibrated = true
        }

        const nextPoint = this.element.querySelector(`.point .pointCircle[data-order="${this.currentPoint}"]`)
        nextPoint.classList.remove('invisible')
        if (this.currentPoint === Math.floor(this.pointsClicks.length / 2) || this.currentPoint === this.pointsClicks.length - 1) {
            this.currentTranslate = this.currentPoint === this.pointsClicks.length - 1 ? 0 : -25
            return gsap.to(this.element.querySelectorAll('svg > g'), {
                duration: 0.5,
                translateY: `${this.currentTranslate}vh`
            })
        }
    }

    render() {
        const width = this.sizes.viewport.width
        const height = this.sizes.viewport.height
        this.centerX = width * 0.5
        this.centerY = height * 0.5
        const outerAdd = height > width * 0.7 ? height * 0.5 : height * 0.2
        const outerRX = width * 0.5 + outerAdd
        const outerRY = height * 0.7
        this.pupilR = height * 0.3
        const pupilCenterX = Math.cos(-Math.PI / 6) * this.pupilR + this.centerX
        const pupilCenterY = Math.sin(-Math.PI / 6) * this.pupilR + this.centerY

        const getPointY = (x, direction) => this.getPointYEllipse(x, [this.centerX, this.centerY], outerRX, outerRY, direction)

        const pointsHTML = this.pointsClicks.reduce((acc, val, i) => {
            const r = 10 + 2 * val
            const invisible = this.currentPoint === i ? '' : 'invisible'

            if (i < this.pointsClicks.length - 1) {
                const halfPoints = Math.floor(this.pointsClicks.length / 2)
                const index = i % halfPoints
                const line = Math.floor(i / halfPoints)

                const direction = -1 + (2 * line)
                const x = (width - 200) * index / (halfPoints - 1) + 100
                const y = getPointY(x, direction)

                return acc + htmlUtils.createHTMLFromTemplate(pointTemplate, { x, y, r, order: i, invisible })
            }

            return acc + htmlUtils.createHTMLFromTemplate(pointTemplate, { x: this.centerX, y: this.centerY, r, order: i, invisible })
        }, '')
        const eyetrackingTemplate = htmlUtils.insertHTMLInTemplate(template, pointsHTML, 'points')

        htmlUtils.renderToDOM(this.element, eyetrackingTemplate, {
            width,
            height,
            pupilR: this.pupilR,
            centerX: this.centerX,
            centerY: this.centerY,
            outerRX,
            outerRY,
            innerEyeR: height * 0.6,
            pupilCenterR: height * 0.15,
            pupilCenterX,
            pupilCenterY
        })
    }

    getPointYEllipse (x, center, rX, rY, direction) {
        return Math.sqrt((1 - Math.pow(x - center[0], 2) / Math.pow(rX, 2)) * Math.pow(rY, 2)) * direction + center[1]
    }

    stop() {
        webgazer.pause()
        document.getElementById('webgazerVideoContainer').remove()

        htmlUtils.renderToDOM(this.element, '', {})
        this.render = () => {}

        store.dispatch('updateScene', store.state.scene + 1)
    }
}