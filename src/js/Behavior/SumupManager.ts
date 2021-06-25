import gsap from "gsap/all"
import { debounce } from 'lodash'

// @ts-ignore
import store from '@store/index'
// @ts-ignore
import { random } from '@tools/mathUtils'
import { htmlUtils } from '../Tools/utils'
// @ts-ignore
import template from '../../templates/sumup.template'
// @ts-ignore
import particleTemplate from '../../templates/particle.template'
import Sizes from '../Tools/Sizes'
import { INNER_EYE_MOVEMENT, MOODS, MOODS_SUMUP_ORDER, MOOD_NAMES, OUTER_EYE_MOVEMENT, PUPIL_MOVEMENT, PUPIL_SHINE_MOVEMENT, SUMUP_PARTICLES_COUNT } from '../constants'
import { Mouse } from '../Tools/Mouse'
import { eyeMovement } from '../Tools/eyeUtils'

export default class SumupManager {
    sizes: Sizes
    mouse: Mouse
    element: HTMLElement
    pupilBox: ClientRect
    eyeMovement: Function
    outerEyeBox: ClientRect
    innerEyeBox: ClientRect
    pupilCenterBox: ClientRect
    constructor(props: { sizes: Sizes, mouse: Mouse }) {
        const { sizes, mouse } = props

        this.sizes = sizes
        this.mouse = mouse
        this.element = document.querySelector('#sumup')
        this.eyeMovement = debounce(this.moveEye.bind(this), 5, { leading: true })

        this.render()
        this.setMovement()
    }

    setMovement () {
        this.mouse.on('move', this.eyeMovement)
    }

    moveEye () {
        eyeMovement(
            this.mouse.cursor[0],
            -this.mouse.cursor[1],
            this.element,
            0.5,
            this.sizes.height * 0.01,
            {
            outerEyeBox: this.outerEyeBox,
            innerEyeBox: this.innerEyeBox,
            pupilBox: this.pupilBox,
            pupilCenterBox: this.pupilCenterBox
            },
            {
            outerEyeMovement: OUTER_EYE_MOVEMENT,
            innerEyeMovement: INNER_EYE_MOVEMENT,
            pupilMovement: PUPIL_MOVEMENT,
            pupilShineMovement: PUPIL_SHINE_MOVEMENT
            },
            false,
            true
        )
    }

    createParticles (centerX, centerY, innerEyeR, moodsPercents) {
        let particles = ''
        let currentMood = 0
        let percent = moodsPercents[MOODS_SUMUP_ORDER[currentMood]]
        const step = SUMUP_PARTICLES_COUNT / 100

        for (let i = 0; i < SUMUP_PARTICLES_COUNT; i++) {
            if (i >= percent * step) {
                currentMood += 1
                percent += moodsPercents[MOODS_SUMUP_ORDER[currentMood]]
            }

            const randomAngle = random(i * i) * Math.PI * 2
            const randomDist = random(i * i + 1)
            const randomSize = random(i)
            const cos = Math.cos(randomAngle) * randomDist
            const sin = Math.sin(randomAngle) * randomDist
            const x = centerX - cos * innerEyeR
            const y = centerY - sin * innerEyeR

            particles += (htmlUtils.createHTMLFromTemplate(particleTemplate, {
                x,
                y,
                r: 2 + randomSize * 2,
                mood: MOODS_SUMUP_ORDER[currentMood]
            }))
        }

        return particles
    }

    setHoverListener () {
        this.element.querySelectorAll('.mood').forEach(elem => {
            const mood = elem.getAttribute('data-mood')
            elem.addEventListener('mouseover', () => {
                gsap.to(`.particle[data-mood="${mood}"]`, {
                    opacity: 1,
                    duration: 0.5
                })
            })
            elem.addEventListener('mouseleave', () => {
                gsap.to(`.particle[data-mood="${mood}"]`, {
                    opacity: 0.3,
                    duration: 0.5
                })
            })
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
        const innerEyeR = height * 0.6
        const pupilR = height * 0.3
        const moodsPercents = {
            [MOODS.FEAR]: 10,
            [MOODS.JOY]: 20,
            [MOODS.SADNESS]: 5,
            [MOODS.ANGER]: 65
        }

        const particles = this.createParticles(centerX, centerY, innerEyeR, moodsPercents)
        const eyeTemplate = htmlUtils.insertHTMLInTemplate(template, particles, 'particles')

        htmlUtils.renderToDOM(this.element, eyeTemplate, {
            word: store.state.word,
            width,
            height,
            pupilR,
            centerX,
            centerY,
            outerRX,
            outerRY,
            innerEyeR,
            mood1: MOODS_SUMUP_ORDER[0],
            mood2: MOODS_SUMUP_ORDER[1],
            mood3: MOODS_SUMUP_ORDER[2],
            mood4: MOODS_SUMUP_ORDER[3],
            moodName1: MOOD_NAMES[MOODS_SUMUP_ORDER[0]],
            moodName2: MOOD_NAMES[MOODS_SUMUP_ORDER[1]],
            moodName3: MOOD_NAMES[MOODS_SUMUP_ORDER[2]],
            moodName4: MOOD_NAMES[MOODS_SUMUP_ORDER[3]],
            mood1Percent: moodsPercents[MOODS_SUMUP_ORDER[0]],
            mood2Percent: moodsPercents[MOODS_SUMUP_ORDER[1]],
            mood3Percent: moodsPercents[MOODS_SUMUP_ORDER[2]],
            mood4Percent: moodsPercents[MOODS_SUMUP_ORDER[3]],
        })

        // display elements
        this.element.style.opacity = '1'
        ;(this.element.querySelector('.bg-wrapper') as HTMLElement).style.display = 'block'

        // get elements sizes
        this.outerEyeBox = (this.element.querySelector('.outerEye') as HTMLElement).getBoundingClientRect()
        this.innerEyeBox = (this.element.querySelector('.innerEye') as HTMLElement).getBoundingClientRect()
        this.pupilBox = (this.element.querySelector('.pupil') as HTMLElement).getBoundingClientRect()

        this.setHoverListener()
    }
}