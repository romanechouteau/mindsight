import { BackSide, Mesh, Object3D, ShaderMaterial, SphereBufferGeometry, FogExp2, Scene } from 'three'
import { WORLDBUILDER_PRECISION, SKY_COLORS, MOODS, LIST_MOODS, WORLDBUILDER_MAX_VALUE } from '../../../js/constants'

// @ts-ignore
import vertexShader from '@shaders/skyvert.glsl'
// @ts-ignore
import fragmentShader from '@shaders/skyfrag.glsl'

export default class SkyCreator {
    scene: Object3D
    range: HTMLInputElement
    globalScene: Scene
    skyMaterial: ShaderMaterial
    constructor(options: { scene: Object3D, range: HTMLInputElement, globalScene: Scene }) {
        const { scene, range, globalScene } = options

        this.scene = scene
        this.range = range
        this.globalScene = globalScene
        this.handleChange = this.handleChange.bind(this)

        this.init()
    }

    init() {
        const skyGeometry = new SphereBufferGeometry(40, 10, 10)
        this.skyMaterial = new ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0. },
                uFirstColorTop: { value: SKY_COLORS[MOODS.JOY][0] },
                uSecondColorTop: { value: SKY_COLORS[MOODS.FEAR][0] },
                uFirstColorBottom: { value: SKY_COLORS[MOODS.JOY][1] },
                uSecondColorBottom: { value: SKY_COLORS[MOODS.FEAR][1] },
                uPercentage: { value: 0. },
            },
            side: BackSide
        })
        const sky = new Mesh(skyGeometry, this.skyMaterial)

        this.scene.add(sky)

        this.changeGradient(this.range.value)
    }

    handleChange(event) {
        this.changeGradient(event.target.value)
    }

    changeGradient(input) {
        const value = parseFloat(input) % WORLDBUILDER_MAX_VALUE
        const step = Math.floor(value / WORLDBUILDER_PRECISION)
        const firstSky = step % LIST_MOODS.length
        const secondSky = (step + 1) % LIST_MOODS.length

        const firstColors = SKY_COLORS[LIST_MOODS[firstSky]]
        const secondColors = SKY_COLORS[LIST_MOODS[secondSky]]

        const percentage = (value - firstSky * WORLDBUILDER_PRECISION) / WORLDBUILDER_PRECISION

        this.skyMaterial.uniforms.uFirstColorTop.value = firstColors[0]
        this.skyMaterial.uniforms.uFirstColorBottom.value = firstColors[1]
        this.skyMaterial.uniforms.uSecondColorTop.value = secondColors[0]
        this.skyMaterial.uniforms.uSecondColorBottom.value = secondColors[1]
        this.skyMaterial.uniforms.uPercentage.value = percentage

        const fogColor1 = this.toRGB(firstColors[1])
        const fogColor2 = this.toRGB(secondColors[1])
        const fogColor = fogColor1.map((val, i) => Math.round((val * (1 - percentage) + fogColor2[i] * percentage) * 255))

        this.globalScene.fog = new FogExp2(`rgb(${fogColor[0]}, ${fogColor[1]}, ${fogColor[2]})`, 0.03)
    }

    toRGB(color) {
        const r = ((color / 256 / 256) % 256) / 255.
        const g = ((color / 256) % 256) / 255.
        const b = ((color) % 256) / 255.
        return [r, g, b]
    }
}