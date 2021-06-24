import { BackSide, Mesh, Object3D, ShaderMaterial, SphereBufferGeometry, Scene, Color } from 'three'
import { WORLDBUILDER_PRECISION, SKY_COLORS, MOODS, LIST_MOODS, WORLDBUILDER_MAX_VALUE, ENVIRONMENTS, LIST_ENVIRONMENTS } from '../constants'
import gsap from "gsap/all"

// @ts-ignore
import vertexShader from '@shaders/skyvert.glsl'
// @ts-ignore
import fragmentShader from '@shaders/skyfrag.glsl'
// @ts-ignore
import Time from '@tools/Time'
// @ts-ignore
import { mix, toRGBPercent } from '@tools/colorUtils'

export default class SkyCreator {
    time: Time
    scene: Object3D
    globalScene: Scene
    skyMaterial: ShaderMaterial
    sky: Mesh
    debug: dat.GUI
    constructor(options: { scene: Object3D, globalScene: Scene, time: Time, debug?: dat.GUI }) {
        const { scene, globalScene, time, debug } = options

        this.time = time
        this.debug = debug
        this.scene = scene
        this.globalScene = globalScene
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
                uFirstColorTop: { value: SKY_COLORS[ENVIRONMENTS.BEACH][0] },
                uSecondColorTop: { value: SKY_COLORS[ENVIRONMENTS.MEADOW][0] },
                uFirstColorBottom: { value: SKY_COLORS[ENVIRONMENTS.BEACH][1] },
                uSecondColorBottom: { value: SKY_COLORS[ENVIRONMENTS.MEADOW][1] },
                uPercentage: { value: 0. }
            },
            side: BackSide
        })
        this.sky = new Mesh(skyGeometry, this.skyMaterial)

        this.scene.add(this.sky)

        // add sky colors to debug
        if (this.debug) {
            this.debug.addColor(SKY_COLORS[MOODS.JOY], '0').name('sky color - joy (top)')
            this.debug.addColor(SKY_COLORS[MOODS.JOY], '1').name('sky color - joy (bottom)')
            this.debug.addColor(SKY_COLORS[MOODS.FEAR], '0').name('sky color - fear (top)')
            this.debug.addColor(SKY_COLORS[MOODS.FEAR], '1').name('sky color - fear (bottom)')
            this.debug.addColor(SKY_COLORS[MOODS.SADNESS], '0').name('sky color - SADNESS (top)')
            this.debug.addColor(SKY_COLORS[MOODS.SADNESS], '1').name('sky color - SADNESS (bottom)')
            this.debug.addColor(SKY_COLORS[MOODS.ANGER], '0').name('sky color - ANGER (top)')
            this.debug.addColor(SKY_COLORS[MOODS.ANGER], '1').name('sky color - ANGER (bottom)')
            this.debug.addColor(SKY_COLORS[ENVIRONMENTS.BEACH], '0').name('sky color - BEACH (top)')
            this.debug.addColor(SKY_COLORS[ENVIRONMENTS.BEACH], '1').name('sky color - BEACH (bottom)')
            this.debug.addColor(SKY_COLORS[ENVIRONMENTS.MEADOW], '0').name('sky color - MEADOW (top)')
            this.debug.addColor(SKY_COLORS[ENVIRONMENTS.MEADOW], '1').name('sky color - MEADOW (bottom)')
        }

        // set fog to default color
        const fogColor = mix(toRGBPercent(SKY_COLORS[ENVIRONMENTS.BEACH][0]), toRGBPercent(SKY_COLORS[ENVIRONMENTS.BEACH][1]), 0.5, true)
        this.globalScene.fog.color = new Color(`rgb(${fogColor[0]}, ${fogColor[1]}, ${fogColor[2]})`)

        this.setMovement()
    }

    handleChange(input) {
        const value = input % WORLDBUILDER_MAX_VALUE
        const step = Math.floor(value / WORLDBUILDER_PRECISION)

        const [firstSky, secondSky] = this.getSkyIndexes(step, LIST_MOODS)
        const [firstColors, secondColors] = this.getColors(firstSky, secondSky, LIST_MOODS)
        const percentage = this.getPercentage(value, firstSky)

        this.changeGradient(firstColors, secondColors)
        this.setNewColors(percentage)
        this.setFog(firstColors, secondColors, percentage)
    }

    handleEnvChange(value) {
        const [firstSky, secondSky] = this.getSkyIndexes(value, LIST_ENVIRONMENTS)
        const [firstColors, secondColors] = this.getColors(firstSky, secondSky, LIST_ENVIRONMENTS)

        this.changeGradient(firstColors, secondColors)
        this.lerpNewColors()
        this.lerpFog(firstColors)
    }

    getSkyIndexes (value, list) {
        return [value % list.length, (value + 1) % list.length]
    }

    getColors(firstSky, secondSky, list) {
        return [SKY_COLORS[list[firstSky]], SKY_COLORS[list[secondSky]]]
    }

    getPercentage (value, firstSky) {
        return (value - firstSky * WORLDBUILDER_PRECISION) / WORLDBUILDER_PRECISION
    }

    changeGradient(firstColors, secondColors) {
        this.skyMaterial.uniforms.uFirstColorTop.value = firstColors[0]
        this.skyMaterial.uniforms.uFirstColorBottom.value = firstColors[1]
        this.skyMaterial.uniforms.uSecondColorTop.value = secondColors[0]
        this.skyMaterial.uniforms.uSecondColorBottom.value = secondColors[1]
    }

    setNewColors (percentage) {
        this.skyMaterial.uniforms.uPercentage.value = percentage
    }

    lerpNewColors () {
        this.skyMaterial.uniforms.uPercentage.value = 1
        gsap.to(this.skyMaterial.uniforms.uPercentage, {
            value: 0,
            duration: 1.5,
            ease: 'power3.inOut'
        })
    }

    setFog (firstColors, secondColors, percentage) {
        const fogColor1 = mix(toRGBPercent(firstColors[0]), toRGBPercent(firstColors[1]), 0.5)
        const fogColor2 = mix(toRGBPercent(secondColors[0]), toRGBPercent(secondColors[1]), 0.5)
        const fogColor = mix(fogColor1, fogColor2, percentage, true)

        this.globalScene.fog.color = new Color(`rgb(${fogColor[0]}, ${fogColor[1]}, ${fogColor[2]})`)
    }

    lerpFog (colors) {
        const fogColor = mix(toRGBPercent(colors[0]), toRGBPercent(colors[1]), 0.5)
        gsap.to(this.globalScene.fog.color, {
            r: fogColor[0],
            g: fogColor[1],
            b: fogColor[2],
            duration: 1.5,
            ease: 'power3.inOut'
        })
    }

    setMovement() {
        this.time.on('tick', () => {
            this.skyMaterial.uniforms.uTime.value += 0.0005
        })
    }
}