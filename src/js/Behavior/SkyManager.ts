import { BackSide, Mesh, Object3D, ShaderMaterial, SphereBufferGeometry, Scene, Color } from 'three'
import { WORLDBUILDER_PRECISION, MOODS, WORLDBUILDER_MAX_VALUE, ENVIRONMENTS, SKY_ENV_COLORS, SKY_MOODS_COLORS, LIST_MOODS, LIST_ENVIRONMENTS } from '../constants'
import gsap from "gsap/all"

// @ts-ignore
import vertexShader from '@shaders/skyvert.glsl'
// @ts-ignore
import fragmentShader from '@shaders/skyfrag.glsl'
// @ts-ignore
import Time from '@tools/Time'

export default class SkyCreator {
    time: Time
    scene: Object3D
    globalScene: Scene
    skyMaterial: ShaderMaterial
    sky: Mesh
    debug: dat.GUI
    emitter: EventTarget
    hasEnvInfluence: Boolean
    constructor(options: { scene: Object3D, globalScene: Scene, time: Time, debug?: dat.GUI }) {
        const { scene, globalScene, time, debug } = options

        this.time = time
        this.debug = debug
        this.scene = scene
        this.globalScene = globalScene
        this.emitter = new EventTarget()
        this.hasEnvInfluence = true
        this.handleChange = this.handleChange.bind(this)

        this.init()
    }

    init() {
        const skyGeometry = new SphereBufferGeometry(40, 40, 10)
        this.skyMaterial = new ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0. },
                uSky1: { value: SKY_MOODS_COLORS[MOODS.JOY] },
                uSky2: { value: SKY_MOODS_COLORS[MOODS.FEAR] },
                uSky3: { value: SKY_MOODS_COLORS[MOODS.SADNESS] },
                uSky4: { value: SKY_MOODS_COLORS[MOODS.ANGER] },
                uEnvSky1: { value: SKY_ENV_COLORS[ENVIRONMENTS.BEACH] },
                uEnvSky2: { value: SKY_ENV_COLORS[ENVIRONMENTS.MEADOW] },
                uPercentage: { value: 0. },
                uEnvInfluence: { value: 1. },
                uEnvPercentage: { value: 0. },
            },
            side: BackSide
        })
        this.sky = new Mesh(skyGeometry, this.skyMaterial)

        this.scene.add(this.sky)

        // add sky colors to debug
        if (this.debug) {
            const folder = this.debug.addFolder('sky colors')
            this.debug.addColor(SKY_MOODS_COLORS[MOODS.JOY], '0').name('sky color - joy (top)')
            this.debug.addColor(SKY_MOODS_COLORS[MOODS.JOY], '1').name('sky color - joy (bottom)')
            this.debug.addColor(SKY_MOODS_COLORS[MOODS.FEAR], '0').name('sky color - fear (top)')
            this.debug.addColor(SKY_MOODS_COLORS[MOODS.FEAR], '1').name('sky color - fear (bottom)')
            this.debug.addColor(SKY_MOODS_COLORS[MOODS.SADNESS], '0').name('sky color - SADNESS (top)')
            this.debug.addColor(SKY_MOODS_COLORS[MOODS.SADNESS], '1').name('sky color - SADNESS (bottom)')
            this.debug.addColor(SKY_MOODS_COLORS[MOODS.ANGER], '0').name('sky color - ANGER (top)')
            this.debug.addColor(SKY_MOODS_COLORS[MOODS.ANGER], '1').name('sky color - ANGER (bottom)')
            this.debug.addColor(SKY_ENV_COLORS[ENVIRONMENTS.BEACH], '0').name('sky color - BEACH (top)')
            this.debug.addColor(SKY_ENV_COLORS[ENVIRONMENTS.BEACH], '1').name('sky color - BEACH (bottom)')
            this.debug.addColor(SKY_ENV_COLORS[ENVIRONMENTS.MEADOW], '0').name('sky color - MEADOW (top)')
            this.debug.addColor(SKY_ENV_COLORS[ENVIRONMENTS.MEADOW], '1').name('sky color - MEADOW (bottom)')
        }

        // set fog to default color
        this.globalScene.fog.color = new Color(SKY_ENV_COLORS[ENVIRONMENTS.BEACH][0]).lerp(new Color(SKY_ENV_COLORS[ENVIRONMENTS.BEACH][1]), 0.5)

        this.setMovement()
    }

    handleChange(input) {
        const percentage = this.getPercentage(input % WORLDBUILDER_MAX_VALUE)
        this.setPercentage(percentage, 'uPercentage')
        this.setFog(percentage, SKY_MOODS_COLORS, LIST_MOODS, 1, '')
        this.emitter.dispatchEvent(new Event('changeSky'))

        if (this.hasEnvInfluence) {
            this.removeEnvInfluence()
            this.hasEnvInfluence = false
        }
    }

    handleEnvChange(value) {
        this.setPercentage(value, 'uEnvPercentage')
        this.setFog(value, SKY_ENV_COLORS, LIST_ENVIRONMENTS, 1.5, 'power3.inOut')
    }

    getPercentage (value) {
        return value / WORLDBUILDER_PRECISION
    }

    setPercentage (percentage, uniform) {
        gsap.to(this.skyMaterial.uniforms[uniform], {
            value: percentage,
            duration: 1
        })
    }

    removeEnvInfluence () {
        gsap.to(this.skyMaterial.uniforms.uEnvInfluence, {
            value: 0,
            duration: 1
        })
    }

    getWeight (percentage, peak) {
        return Math.max(1 - Math.abs(peak - percentage), 0)
    }

    mixFog (percentage, colors, list) {
        const colorTop = new Color(colors[list[0]][1]).multiplyScalar(this.getWeight(percentage, 0))
        const colorBottom = new Color(colors[list[0]][0]).multiplyScalar(this.getWeight(percentage, 0))
        for (let i = 1; i <= list.length; i++) {
            const index = i % list.length
            const weight = this.getWeight(percentage, i)
            colorTop.add(new Color(colors[list[index]][1]).multiplyScalar(weight))
            colorBottom.add(new Color(colors[list[index]][0]).multiplyScalar(weight))
        }
        return colorTop.lerp(colorBottom, 0.5)
    }

    setFog (percentage, colors, list, duration, ease) {
        const color = this.mixFog(percentage, colors, list)
        gsap.to(this.globalScene.fog.color, {
            r: color.r,
            g: color.g,
            b: color.b,
            duration,
            ease
        })
    }

    setMovement() {
        this.time.on('tick', () => {
            this.skyMaterial.uniforms.uTime.value += 0.0005
        })
    }
}