import gsap from 'gsap/all'
import template from '../templates/intro.template' 
import hpSrc from '../images/casque.svg'
import { drawWave, waveBaseConfig, drawWaveConfig } from './Tools/canvasUtils'
import Time from './Tools/Time'
import { queue } from './Tools/asyncUtils'
import lottie from 'lottie-web'
import logoAnimation from '../images/mindisight_logo_animation.json'

// TODO: replace all magical numbers
export default class IntroController {

    time: Time
    fullCanvas: HTMLCanvasElement
    leftCanvas: HTMLCanvasElement
    rightCanvas: HTMLCanvasElement
    title: HTMLDivElement
    headPhoneImage: HTMLImageElement
    fullLineConfigs: drawWaveConfig[]
    leftLineConfigs: drawWaveConfig[]
    rightLineConfigs: drawWaveConfig[]
    waveHeight: number
    debug?: dat.GUI
    timeouts: any

    constructor({time, debug}) {
        this.time = time
        this.debug = debug
        this.createHtml()
        this.bindHtml()
        this.waveHeight = 200
        this.fullLineConfigs = [
            { ...waveBaseConfig, offset: 2, widthReductor: 2, height: this.waveHeight, speed: 500, steps: 400 }, 
            { ...waveBaseConfig, offset: 3, widthReductor: 2, height: this.waveHeight, speed: 500, steps: 400 }, 
            { ...waveBaseConfig, widthReductor: 2, height: this.waveHeight, speed: 500, steps: 400 }
        ]

        this.leftLineConfigs = [
            { ...waveBaseConfig, offset: 5, widthReductor: 2, height: this.waveHeight, speed: 490, steps: 400, inflexionPoint: 0 }, 
            { ...waveBaseConfig, offset: 2, widthReductor: 1.9, height: this.waveHeight, speed: 540, steps: 400 , inflexionPoint: 0}, 
            { ...waveBaseConfig, widthReductor: 2.3, height: this.waveHeight, speed: 500, steps: 400, inflexionPoint: 0 }
        ]
        this.rightLineConfigs = [
            { ...waveBaseConfig, offset: 3, widthReductor: 1.8, height: this.waveHeight, speed: 450, steps: 400, inflexionPoint: 1 }, 
            { ...waveBaseConfig, offset: 4, widthReductor: 2, height: this.waveHeight, speed: 500, steps: 400, inflexionPoint: 1 }, 
            { ...waveBaseConfig, widthReductor: 2.2, height: this.waveHeight, speed: 550, steps: 400, inflexionPoint: 1 }
        ]

        this.timeouts = {
            fadeTitle: 2000,
            lineSplit: 2000,
            linesGoesAway: 5000,
            linesMoveAfterDisassemble: 1000
        }

        if (this.debug) {
            const wavesFolder = this.debug.addFolder('intro wavesets')
            ;[this.fullLineConfigs, this.leftLineConfigs, this.rightLineConfigs].forEach((configs, wasetId) => {
                const subfolder = wavesFolder.addFolder(`waveset ${wasetId}`)
                configs.forEach((conf, waveId) => {
                    const subsubfolder = subfolder.addFolder(`wave ${waveId}`)
                    Object.keys(conf).forEach(key => subsubfolder.add(conf, key))
                })
            })
            const timeoutsFolder = this.debug.addFolder('intro timeouts')
            Object.keys(this.timeouts).forEach(key => timeoutsFolder.add(this.timeouts, key))
        }

        this.addWave(this.fullCanvas, 'tick.introFullCanvas', this.fullLineConfigs)
        this.initTicker()
        this.initLogoAnimation()
    }

    initLogoAnimation() {
        lottie.loadAnimation({
            container: this.title,
            renderer: 'svg',
            loop: false,
            autoplay: true,
            animationData: logoAnimation
        })
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

    addWave(canvas: HTMLCanvasElement, evtNameSpace: string , configs: drawWaveConfig[]) {
        const ctx = canvas.getContext('2d')
        const {width, height} = canvas
        this.time.on(evtNameSpace, () => {
            ctx.clearRect(0, 0, width, height)
            drawWave(ctx, width, height, configs[0], this.time)
            drawWave(ctx, width, height, configs[1], this.time)
            drawWave(ctx, width, height, configs[2], this.time)
        })
    }

    toggleLineMovement() {
        let height = 0
        if (this.fullLineConfigs[0].height === 0) height = this.waveHeight        
        ;[this.fullLineConfigs, this.leftLineConfigs, this.rightLineConfigs].forEach(configs => {
            gsap.to(configs[0], {
                height: height,
                widthReductor: 1.5,
                ease: 'power1.inOut',
                duration: 2
            })
            gsap.to(configs[1], {
                height: height,
                widthReductor: 1.5,
                ease: 'power1.inOut',
                duration: 2
            })
            gsap.to(configs[2], {
                height: height,
                widthReductor: 1.5,
                ease: 'power1.inOut',
                duration: 2
            })
        })
    }

    killFullLine() {
        this.time.off('tick.introFullCanvas')
        // @ts-ignore
        this.fullCanvas.attributeStyleMap.set('display', 'none')
    }

    enableSideLines() {
        this.addWave(this.leftCanvas, 'tick.introLeftCanvas', this.leftLineConfigs)
        this.addWave(this.rightCanvas, 'tick.introRightCanvas', this.rightLineConfigs)
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
                // @ts-ignore
                this.headPhoneImage.attributeStyleMap.set('display', 'inline-block')
                setTimeout(() => {
                    // @ts-ignore
                    this.headPhoneImage.attributeStyleMap.set('opacity', 1)
                }, 500);
            }, 2100)
        }, 500)
    }

    flyLines() {
        ;[this.leftLineConfigs, this.rightLineConfigs].forEach(configs => {
            gsap.to(configs[0], {
                widthReductor: 1,
                inflexionPoint: 0.5,
                ease: 'power1.inOut',
                duration: 2
            })
            gsap.to(configs[1], {
                widthReductor: 1,
                inflexionPoint: 0.5,
                ease: 'power1.inOut',
                duration: 2
            })
            gsap.to(configs[2], {
                widthReductor: 1,
                inflexionPoint: 0.5,
                ease: 'power1.inOut',
                duration: 2
            })
        })

        setTimeout(() => {
            // @ts-ignore
            this.leftCanvas.attributeStyleMap.set('transform', 'translateX(-40vw)')
            // @ts-ignore
            this.rightCanvas.attributeStyleMap.set('transform', 'translateX(40vw)')
        }, 1000)
        setTimeout(() => {
            // @ts-ignore
            this.leftCanvas.attributeStyleMap.set('opacity', 0)
            // @ts-ignore
            this.rightCanvas.attributeStyleMap.set('opacity', 0)
        }, 1500)
    }

    assembleLines() {
        // @ts-ignore
        this.leftCanvas.attributeStyleMap.set('width', CSS.vw(50.1))
        // @ts-ignore
        this.rightCanvas.attributeStyleMap.set('width', CSS.vw(50.1))        
    }

    hideHeadphone() {
        this.headPhoneImage.attributeStyleMap.set('opacity', 0)
        setTimeout(() => {
            // @ts-ignore
            this.headPhoneImage.attributeStyleMap.set('display', 'none')
        }, 500);
    }

    revealLine() {
        document.querySelector('.canvas-full').style.width = `100vw`
    }

    async initTicker() {
        await queue(() => {
            this.revealLine()
        }, 5000)
        await queue(() => {
            this.showHeadphoneAdvice()
        }, 5000)
        await queue(() => {
            // this.flyLines()
            this.hideHeadphone()
            this.assembleLines()
        }, 5000)
    }

    dispose() {
        document.body.removeChild(document.querySelector('#intro'))
    }

}