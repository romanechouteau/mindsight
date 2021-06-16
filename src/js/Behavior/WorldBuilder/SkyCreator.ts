import { BackSide, Mesh, Object3D, ShaderMaterial, SphereBufferGeometry, Scene, FogExp2, Color } from 'three'
import { WORLDBUILDER_PRECISION, SKY_COLORS, MOODS, LIST_MOODS, WORLDBUILDER_MAX_VALUE } from '../../../js/constants'

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
    constructor(options: { scene: Object3D, globalScene: Scene, time: Time }) {
        const { scene, globalScene, time } = options

        this.time = time
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
                uFirstColorTop: { value: SKY_COLORS[MOODS.JOY][0] },
                uSecondColorTop: { value: SKY_COLORS[MOODS.FEAR][0] },
                uFirstColorBottom: { value: SKY_COLORS[MOODS.JOY][1] },
                uSecondColorBottom: { value: SKY_COLORS[MOODS.FEAR][1] },
                uPercentage: { value: 0. }
            },
            side: BackSide
        })
        this.sky = new Mesh(skyGeometry, this.skyMaterial)

        this.scene.add(this.sky)

        // @ts-ignore
        // this.pmremGenerator = new PMREMGenerator(App.renderer)
        
        // @ts-ignore
        // ;(this.scene as Scene).environment = this.pmremGenerator.fromScene(this.sky).texture

        this.changeGradient(0)
        this.setMovement()
    }

    handleChange(value) {
        this.changeGradient(value)
    }

    changeGradient(input) {
        const value = input % WORLDBUILDER_MAX_VALUE
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

        const fogColor1 = this.mix(this.toRGB(firstColors[0]), this.toRGB(firstColors[1]), 0.5)
        const fogColor2 = this.mix(this.toRGB(secondColors[0]), this.toRGB(secondColors[1]), 0.5)
        const fogColor = this.mix(fogColor1, fogColor2, percentage, true)

        this.globalScene.fog = new FogExp2(`rgb(${fogColor[0]}, ${fogColor[1]}, ${fogColor[2]})`, 0.03)
        this.globalScene.fog.color = new Color(`rgb(${fogColor[0]}, ${fogColor[1]}, ${fogColor[2]})`)
    }

    setMovement() {
        this.time.on('tick', () => {
            this.skyMaterial.uniforms.uTime.value += 0.0005
        })
    }

    mix(color1, color2, percentage, to255?) {
        return color1.map((val, i) => {
            const color = val * (1 - percentage) + color2[i] * percentage
            return to255 ? Math.round(color * 255) : color
        })
    }

    toRGB(color) {
        const r = ((color / 256 / 256) % 256) / 255.
        const g = ((color / 256) % 256) / 255.
        const b = ((color) % 256) / 255.
        return [r, g, b]
    }
}