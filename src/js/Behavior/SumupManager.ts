// @ts-ignore
import webgazer from '@tools/WebGazer'
// @ts-ignore
import store from '@store/index'
import { htmlUtils } from '../Tools/utils'
// @ts-ignore
import template from '../../templates/sumup.template'
import Sizes from '../Tools/Sizes'
import { INNER_EYE_MOVEMENT, MOODS, MOOD_NAMES, OUTER_EYE_MOVEMENT, PUPIL_MOVEMENT, PUPIL_SHINE_MOVEMENT } from '../constants'
import { Mouse } from '../Tools/Mouse'
import { eyeMovement } from '../Tools/eyeUtils'

export default class SumupManager {
    sizes: Sizes
    mouse: Mouse
    element: HTMLElement
    pupilBox: ClientRect
    outerEyeBox: ClientRect
    innerEyeBox: ClientRect
    pupilCenterBox: ClientRect
    constructor(props: { sizes: Sizes, mouse: Mouse }) {
        const { sizes, mouse } = props

        this.sizes = sizes
        this.mouse = mouse
        this.element = document.querySelector('#sumup')

        this.render()
        this.moveEye()
    }

    moveEye () {
        this.mouse.on('move', () => {
            const moveX = this.mouse.cursor[0]
            const moveY = -this.mouse.cursor[1]
            const duration = 0.5
            const currentVH = this.sizes.height * 0.01
            const elemBoxes = {
                outerEyeBox: this.outerEyeBox,
                innerEyeBox: this.innerEyeBox,
                pupilBox: this.pupilBox,
                pupilCenterBox: this.pupilCenterBox
            }
            const elemMovement = {
                outerEyeMovement: OUTER_EYE_MOVEMENT,
                innerEyeMovement: INNER_EYE_MOVEMENT,
                pupilMovement: PUPIL_MOVEMENT,
                pupilShineMovement: PUPIL_SHINE_MOVEMENT
            }

            eyeMovement(moveX, moveY, this.element, duration, currentVH, elemBoxes, elemMovement, true, true)
        })
    }

    render () {
        // render elements
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

        htmlUtils.renderToDOM(this.element, template, {
            word: store.state.word,
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
            pupilCenterY,
            emotion1: MOOD_NAMES[MOODS.FEAR],
            emotion2: MOOD_NAMES[MOODS.JOY],
            emotion3: MOOD_NAMES[MOODS.SADNESS],
            emotion4: MOOD_NAMES[MOODS.ANGER],
            emotion1Percent: 45,
            emotion2Percent: 45,
            emotion3Percent: 45,
            emotion4Percent: 45,
        })

        // display elements
        this.element.style.opacity = '1'
        ;(this.element.querySelector('.bg-wrapper') as HTMLElement).style.display = 'block'

        // get elements sizes
        this.outerEyeBox = (this.element.querySelector('.outerEye') as HTMLElement).getBoundingClientRect()
        this.innerEyeBox = (this.element.querySelector('.innerEye') as HTMLElement).getBoundingClientRect()
        this.pupilBox = (this.element.querySelector('.pupil') as HTMLElement).getBoundingClientRect()
        this.pupilCenterBox = (this.element.querySelector('.pupilCenter') as HTMLElement).getBoundingClientRect()
    }
}