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
    leftLineConfigs: drawWaveConfig[]
    rightLineConfigs: drawWaveConfig[]
    waveHeight: number
    debug?: dat.GUI

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
            { ...waveBaseConfig, offset: 2, widthReductor: 2, height: this.waveHeight, speed: 500, steps: 400, inflexionPoint: 0 }, 
            { ...waveBaseConfig, offset: 3, widthReductor: 2, height: this.waveHeight, speed: 500, steps: 400 , inflexionPoint: 0}, 
            { ...waveBaseConfig, widthReductor: 2, height: this.waveHeight, speed: 500, steps: 400, inflexionPoint: 0 }
        ]
        this.rightLineConfigs = [
            { ...waveBaseConfig, offset: 3, widthReductor: 1.8, height: this.waveHeight, speed: 450, steps: 400, inflexionPoint: 1 }, 
            { ...waveBaseConfig, offset: 4, widthReductor: 2, height: this.waveHeight, speed: 500, steps: 400, inflexionPoint: 1 }, 
            { ...waveBaseConfig, widthReductor: 2.2, height: this.waveHeight, speed: 550, steps: 400, inflexionPoint: 1 }
        ]

        if (this.debug) {
            const mainFolder = this.debug.addFolder('intro wavesets')
            ;[this.fullLineConfigs, this.leftLineConfigs, this.rightLineConfigs].forEach((configs, wasetId) => {
                const subfolder = mainFolder.addFolder(`waveset ${wasetId}`)
                configs.forEach((conf, waveId) => {
                    const subsubfolder = subfolder.addFolder(`wave ${waveId}`)
                    Object.keys(conf).forEach(key => subsubfolder.add(conf, key))
                })
            })
        }

        this.addWave(this.fullCanvas, 'tick.introFullCanvas', this.fullLineConfigs)
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
            }, 2100)
            // @ts-ignore
            this.headPhoneImage.attributeStyleMap.set('display', 'inline-block')
            // @ts-ignore
            this.headPhoneImage.attributeStyleMap.set('opacity', 1)
        }, 500)
    }

    flyLines() {
        gsap.to(this.fullLineConfigs[0], {
            widthReductor: 1,
            ease: 'power1.inOut',
            duration: 2
        })
        gsap.to(this.fullLineConfigs[1], {
            widthReductor: 1,
            ease: 'power1.inOut',
            duration: 2
        })
        gsap.to(this.fullLineConfigs[2], {
            widthReductor: 1,
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