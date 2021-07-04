import gsap from 'gsap/all'
// @ts-ignore
import template from '../templates/intro.template'
// @ts-ignore
import hpSrc from '../images/headphones.svg'
import { waveBaseConfig, drawWaveConfig } from './Tools/canvasUtils'
import Time from './Tools/Time'
import { queue } from './Tools/asyncUtils'
import lottie from 'lottie-web'
// @ts-ignore
import logoAnimation from '../images/MindSight_LogoAnimation.json'
import SoundManager from './Behavior/SoundManager'
import PointerCursor from './Tools/PointerCursor'

// @ts-ignore
import store from '@store/index'

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
    fullWorker: Worker
    rightWorker: Worker
    leftWorker: Worker
    configKeys: string[]
    pointerCursor: PointerCursor
    holdText: HTMLElement
    canGoNext: Boolean
    hidden: Boolean

    constructor({ time, pointerCursor, debug }) {
        this.time = time
        this.debug = debug
        this.createHtml()
        this.waveHeight = 200
        this.fullLineConfigs = [
            { ...waveBaseConfig, steps: 170, waveLength: 40, speed: 2900, offset: 2, height: 400, widthReductor: 0, inflexionPoint: 0.7 },
            { ...waveBaseConfig, steps: 250, speed: 2410, offset: 3, height: 250, widthReductor: 0, inflexionPoint: 0.8 },
            { ...waveBaseConfig, steps: 150, waveLength: 60, speed: 3600, height: 500, widthReductor: 0, inflexionPoint: 0.5 }
        ]

        this.leftLineConfigs = [
            { ...waveBaseConfig, offset: 2 },
            { ...waveBaseConfig, speed: 1300, offset: 1, height: 230, widthReductor: 1.4, inflexionPoint: 0.06 },
            { ...waveBaseConfig, speed: 1900, offset: -1, height: 240, widthReductor: 1.3 }
        ]
        this.rightLineConfigs = [
            { ...waveBaseConfig, offset: 5, inflexionPoint: 1 },
            { ...waveBaseConfig, speed: 1300, offset: 1, height: 230, widthReductor: 1, inflexionPoint: 1.06 },
            { ...waveBaseConfig, speed: 1900, offset: 3, height: 240, widthReductor: 1.2, inflexionPoint: 0.9 }
        ]

        this.configKeys = Object.keys(this.fullLineConfigs[0])

        // @ts-ignore
        this.fullWorker = new Worker(new URL('./Workers/IntroControllerWorker.js', import.meta.url), { type: 'module' })
        // @ts-ignore
        this.leftWorker = new Worker(new URL('./Workers/IntroControllerWorker.js', import.meta.url), { type: 'module' })
        // @ts-ignore
        this.rightWorker = new Worker(new URL('./Workers/IntroControllerWorker.js', import.meta.url), { type: 'module' })

        this.bindHtml()

        this.timeouts = {
            fadeTitle: 2000,
            lineSplit: 2000,
            linesGoesAway: 5000,
            linesMoveAfterDisassemble: 1000
        }

        this.pointerCursor = pointerCursor
        this.hidden = false

        if (this.debug) {
            const wavesFolder = this.debug.addFolder('intro wavesets')
            ;[
                {conf: this.fullLineConfigs, worker: this.fullWorker},
                {conf: this.leftLineConfigs, worker: this.leftWorker},
                {conf: this.rightLineConfigs, worker: this.rightWorker}
            ].forEach((configs, wasetId) => {
                const subfolder = wavesFolder.addFolder(`waveset ${wasetId}`)
                configs.conf.forEach((conf, waveId) => {
                    const subsubfolder = subfolder.addFolder(`wave ${waveId}`)
                    Object.keys(conf).forEach(key => subsubfolder.add(conf, key).onChange(() => configs.worker.postMessage({ configs: configs.conf.map(_conf => ({..._conf, _gsap: null})) }) ))
                })
            })
            const timeoutsFolder = this.debug.addFolder('intro timeouts')
            Object.keys(this.timeouts).forEach(key => timeoutsFolder.add(this.timeouts, key))
        }

        this.addWave(this.fullWorker, 'tick.introFullCanvas', this.fullLineConfigs)
        this.mouseDown = this.mouseDown.bind(this)
        this.mouseUp = this.mouseUp.bind(this)
        document.addEventListener('mousedown', this.mouseDown)
        document.addEventListener('mouseup', this.mouseUp)
    }

    mouseDown() {
        // @ts-ignore
        if ((!document.querySelector('.dg.ac') || (document.querySelector('.dg.ac') && !document.querySelector('.dg.ac').contains(event.target)))
            && store.state.begin === false) {
            this.pointerCursor.startHold(this.initXp.bind(this))
        } else if (store.state.begin === true && this.canGoNext === true) {
            this.pointerCursor.startHold(this.handleNextScene.bind(this))
        }
    }

    mouseUp() {
        this.pointerCursor.stopHold()
    }

    initXp() {
        // @ts-ignore
        document.querySelector('#pre-intro').style.opacity = '0'
        // @ts-ignore
        document.querySelector('#pre-intro').style.pointerEvents = 'none'
        SoundManager.playMusic()
        store.dispatch('beginXp')
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
        const fullOffscreen = this.fullCanvas.transferControlToOffscreen()
        this.fullWorker.postMessage({ canvas: fullOffscreen }, [fullOffscreen])
        this.leftCanvas = document.querySelector('canvas#left')
        const leftOffscreen = this.leftCanvas.transferControlToOffscreen()
        this.leftWorker.postMessage({ canvas: leftOffscreen }, [leftOffscreen])
        this.rightCanvas = document.querySelector('canvas#right')
        const rightOffscreen = this.rightCanvas.transferControlToOffscreen()
        this.rightWorker.postMessage({ canvas: rightOffscreen }, [rightOffscreen])
        this.title = document.querySelector('.title')
        this.headPhoneImage = document.querySelector('.headphone')
        this.holdText = document.querySelector('.holdText')
    }

    addWave(worker: Worker, evtNameSpace: string , configs: drawWaveConfig[]) {
        worker.postMessage({ configs: configs.map(conf => ({ ...conf, _gsap: null })) })
        this.time.on(evtNameSpace, () => {
            worker.postMessage({ action: 'drawWave', elapsed: this.time.elapsed })
        })
    }

    toggleLineMovement() {
        let height = 0
        if (this.fullLineConfigs[0].height === 0) height = this.waveHeight
        ;[{conf: this.fullLineConfigs, worker: this.fullWorker}, {conf: this.leftLineConfigs, worker: this.leftWorker}, {conf: this.rightLineConfigs, worker: this.rightWorker}].forEach(configs => {
            gsap.to(configs.conf[0], {
                height: height,
                widthReductor: 1.5,
                ease: 'power1.inOut',
                duration: 2,
                onUpdate: () => {
                    configs.worker.postMessage({ configs: configs.conf.map(_conf => ({..._conf, _gsap: null}))  })
                }
            })
            gsap.to(configs.conf[1], {
                height: height,
                widthReductor: 1.5,
                ease: 'power1.inOut',
                duration: 2,
                onUpdate: () => {
                    configs.worker.postMessage({ configs: configs.conf.map(_conf => ({..._conf, _gsap: null}))  })
                }
            })
            gsap.to(configs.conf[2], {
                height: height,
                widthReductor: 1.5,
                ease: 'power1.inOut',
                duration: 2,
                onUpdate: () => {
                    configs.worker.postMessage({ configs: configs.conf.map(_conf => ({..._conf, _gsap: null}))  })
                }
            })
        })
    }

    killFullLine() {
        setTimeout(() => {
            this.time.off('tick.introFullCanvas')
            // @ts-ignore
            this.fullCanvas.attributeStyleMap.set('display', 'none')
        }, 100);
    }

    enableSideLines() {
        this.addWave(this.leftWorker, 'tick.introLeftCanvas', this.leftLineConfigs)
        this.addWave(this.rightWorker, 'tick.introRightCanvas', this.rightLineConfigs)
        // @ts-ignore
        this.leftCanvas.attributeStyleMap.set('width', CSS.vw(35))
        // @ts-ignore
        this.rightCanvas.attributeStyleMap.set('width', CSS.vw(35))
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
                this.enableSideLines()
                this.killFullLine()
                // @ts-ignore
                this.headPhoneImage.attributeStyleMap.set('display', 'inline-block')
                setTimeout(() => {
                    // @ts-ignore
                    this.headPhoneImage.attributeStyleMap.set('opacity', 1)
                }, 500);
            }, 2500)
        }, 500)
    }

    showHoldText() {
        setTimeout(() => {
            // @ts-ignore
            this.holdText.attributeStyleMap.set('display', 'block')
            setTimeout(() => {
                // @ts-ignore
                this.holdText.attributeStyleMap.set('opacity', 1)
            }, 500)
        }, 1000)
    }

    hideHoldText() {
        // @ts-ignore
        this.holdText.attributeStyleMap.set('opacity', 0)
        setTimeout(() => {
            // @ts-ignore
            this.holdText.attributeStyleMap.set('display', 'none')
        }, 500)
    }

    flatLines() {
        ;[{conf: this.leftLineConfigs, worker: this.leftWorker}, {conf: this.rightLineConfigs, worker: this.rightWorker}].forEach(configs => {
            gsap.to(configs.conf[0], {
                height: 0,
                ease: 'power1.inOut',
                duration: 2,
                onUpdate: () => {
                    configs.worker.postMessage({ configs: configs.conf.map(_conf => ({..._conf, _gsap: null})) })
                }
            })
            gsap.to(configs.conf[1], {
                height: 0,
                ease: 'power1.inOut',
                duration: 2,
                onUpdate: () => {
                    configs.worker.postMessage({ configs: configs.conf.map(_conf => ({..._conf, _gsap: null})) })
                }
            })
            gsap.to(configs.conf[2], {
                height: 0,
                ease: 'power1.inOut',
                duration: 2,
                onUpdate: () => {
                    configs.worker.postMessage({ configs: configs.conf.map(_conf => ({..._conf, _gsap: null})) })
                }
            })
        })
    }

    assembleLines() {
        // @ts-ignore
        this.leftCanvas.attributeStyleMap.set('width', CSS.vw(50.1))
        // @ts-ignore
        this.rightCanvas.attributeStyleMap.set('width', CSS.vw(50.1))
    }

    splitLines() {
        // @ts-ignore
        this.leftCanvas.attributeStyleMap.set('width', CSS.vw(0))
        // @ts-ignore
        this.rightCanvas.attributeStyleMap.set('width', CSS.vw(0))
    }

    hideHeadphone() {
        setTimeout(() => {
            // @ts-ignore
            this.headPhoneImage.attributeStyleMap.set('opacity', 0)
            setTimeout(() => {
                // @ts-ignore
                this.headPhoneImage.attributeStyleMap.set('display', 'none')
            }, 500)
        }, 4000)
    }

    revealLine() {
        const canvas = document.querySelector('.canvas-full')
        if (canvas) {
            // @ts-ignore
            canvas.style.width = `100vw`
        }
    }

    hideLines(callback = () => {}) {
        this.hidden = true
        this.hideHoldText()
        setTimeout(() => {
            this.assembleLines()
        }, 500)
        setTimeout(() => {
            this.flatLines()
        }, 1000)
        setTimeout(() => {
            this.splitLines()
            callback()
        }, 4000)
    }

    async initTicker() {
        let steps = [
            async () => {
                this.revealLine()
            },
            () => {
                this.showHeadphoneAdvice()
                SoundManager.playVoice(1, 1500).then(() => SoundManager.playVoice(2))
            },
            () => {
                this.hideHeadphone()
            },
            () => {
                this.showHoldText()
                this.canGoNext = true
            }
        ], currentIndex = 0

        if (this.debug) {
            var obj = { next:() => {
                if (currentIndex < steps.length) steps[currentIndex++]()
             }}
            this.debug.add(obj,'next').name('next intro step');
        } else {
            for (const step of steps) {
                await queue(step, 5000)
            }
        }
    }

    handleNextScene() {
        document.removeEventListener('mousedown', this.mouseDown)
        this.hideLines(() => store.dispatch('updateScene', store.state.scene + 1))
    }

    dispose() {
        setTimeout(() => {
            if (document.querySelector('#intro')) {
                document.body.removeChild(document.querySelector('#intro'))
            }
        }, 5000);
    }

}