import gsap from 'gsap/all'
import template from '../templates/intro.template' 
import hpSrc from '../images/casque.svg'
import { drawWave, waveBaseConfig, drawWaveConfig } from './Tools/canvasUtils'
import Time from './Tools/Time'
import { queue } from './Tools/asyncUtils'

// TODO: replace all magical numbers
export default class IntroController {

    time: Time
    fullCanvas: HTMLCanvasElement
    leftCanvas: HTMLCanvasElement
    rightCanvas: HTMLCanvasElement
    title: HTMLDivElement
    headPhoneImage: HTMLImageElement
    fullLineConfigs: drawWaveConfig[]
    waveHeight: number

    constructor({time}) {
        this.time = time
        this.createHtml()
        this.bindHtml()
        this.waveHeight = 200
        this.fullLineConfigs = [
            { ...waveBaseConfig, offset: 2, widthReductor: 2, height: this.waveHeight, speed: 500, steps: 400 }, 
            { ...waveBaseConfig, offset: 3, widthReductor: 2, height: this.waveHeight, speed: 500, steps: 400 }, 
            { ...waveBaseConfig, widthReductor: 2, height: this.waveHeight, speed: 500, steps: 400 }
        ]
        this.addWave(this.fullCanvas, 'tick.introFullCanvas', 0.5)
        this.initTicker()
    }

    createHtml() {
        let html
        html = template.replace('%hpSrc%', hpSrc)
        html = html.replace('%width-full%', window.innerWidth * window.devicePixelRatio)
        html = html.replace('%height-full%', window.innerHeight * window.devicePixelRatio)
        html = html.replace('%width-left%', window.innerWidth/2 * window.devicePixelRatio)
        html = html.replace('%height-left%', window.innerHeight * window.devicePixelRatio)
        html = html.replace('%width-right%', window.innerWidth/2 * window.devicePixelRatio)
        html = html.replace('%height-right%', window.innerHeight * window.devicePixelRatio)
        document.querySelector('#intro').innerHTML = html
    }

    bindHtml() {
        this.fullCanvas = document.querySelector('canvas#full')
        this.leftCanvas = document.querySelector('canvas#left')
        this.rightCanvas = document.querySelector('canvas#right')
        this.title = document.querySelector('.title')
        this.headPhoneImage = document.querySelector('.headphone')
    }

    addWave(canvas: HTMLCanvasElement, evtNameSpace: string , inflexionPoint: number) {
        const ctx = canvas.getContext('2d')
        const {width, height} = canvas
        this.time.on(evtNameSpace, () => {
            ctx.clearRect(0, 0, width, height)
            drawWave(ctx, width, height, this.fullLineConfigs[0], inflexionPoint, this.time)
            drawWave(ctx, width, height, this.fullLineConfigs[1], inflexionPoint, this.time)
            drawWave(ctx, width, height, this.fullLineConfigs[2], inflexionPoint, this.time)
        })
    }

    toggleLineMovement() {
        
        let height = 0
        if (this.fullLineConfigs[0].height === 0) height = this.waveHeight
        gsap.to(this.fullLineConfigs[0], {
            height: height,
            widthReductor: 1.5,
            ease: 'power1.inOut',
            duration: 2
        })
        gsap.to(this.fullLineConfigs[1], {
            height: height,
            widthReductor: 1.5,
            ease: 'power1.inOut',
            duration: 2
        })
        gsap.to(this.fullLineConfigs[2], {
            height: height,
            widthReductor: 1.5,
            ease: 'power1.inOut',
            duration: 2
        })
    }

    killFullLine() {
        this.time.off('tick.introFullCanvas')
        // @ts-ignore
        this.fullCanvas.attributeStyleMap.set('display', 'none')
    }

    enableSideLines() {
        this.addWave(this.leftCanvas, 'tick.introLeftCanvas', 0)
        this.addWave(this.rightCanvas, 'tick.introRightCanvas', 1)
        // @ts-ignore
        this.leftCanvas.attributeStyleMap.set('width', CSS.vw(40))
        // @ts-ignore
        this.rightCanvas.attributeStyleMap.set('width', CSS.vw(40))
        this.toggleLineMovement()
    }

    showHeadphoneAdvice() {
        // @ts-ignore
        this.title.attributeStyleMap.set('opacity', 0)
        setTimeout(() => {
            // @ts-ignore
            this.title.attributeStyleMap.set('display', 'none')
            this.toggleLineMovement()
            setTimeout(() => {
                this.killFullLine()
                this.enableSideLines()
            }, 2000)
            // @ts-ignore
            this.headPhoneImage.attributeStyleMap.set('display', 'inline-block')
            // @ts-ignore
            this.headPhoneImage.attributeStyleMap.set('opacity', 1)
        }, 500)
    }

    flyLines() {
        gsap.to(this.fullLineConfigs[0], {
            // height: height,
            // widthReductor: 1,
            ease: 'power1.inOut',
            duration: 2
        })
        gsap.to(this.fullLineConfigs[1], {
            // height: height,
            // widthReductor: 1,
            ease: 'power1.inOut',
            duration: 2
        })
        gsap.to(this.fullLineConfigs[2], {
            // height: height,
            // widthReductor: 1,
            ease: 'power1.inOut',
            duration: 2
        })

        
    }

    async initTicker() {
        await queue(() => {
            this.showHeadphoneAdvice()
        }, 2000)
        await queue(() => {
            this.flyLines()
        }, 5000)
        await queue(() => {
            // this.stepOne()
        }, 5000)
    }

    dispose() {
        document.body.removeChild(document.querySelector('#intro'))
    }

}