import { Mesh, PlaneBufferGeometry, Scene, WebGLRenderer, PerspectiveCamera, IUniform, ShaderMaterial, UniformsLib, UniformsUtils } from "three"

import { textureLoader } from '../../../Tools/utils'
// @ts-ignore
import { WORLDBUILDER_PRECISION, ENVIRONMENTS_COLOR_MAPS, SKY_MOODS_COLORS, SKY_ENV_COLORS, MOODS, ENVIRONMENTS } from "@/js/constants"

import store from '../../../Store'
// @ts-ignore
import Time from '@tools/Time'
// @ts-ignore
import blendingVertex from '../../../../shaders/blendingVert.glsl'
// @ts-ignore
import blendingFragment from '../../../../shaders/blendingFrag.glsl'
import SkyManager from '../../../Behavior/SkyManager'

interface MapHeighterParams {
    ground: Mesh
    time: Time
    envIndex: string
    skyManager: SkyManager
    debug: dat.GUI
}

export default class MapHeighter {
    ground: Mesh
    time: Time
    blendingCanvas: HTMLCanvasElement
    blendMaterial: ShaderMaterial
    envIndex: string
    skyManager: SkyManager
    debug: dat.GUI
    constructor({ ground, time, envIndex, skyManager, debug }: MapHeighterParams) {
        this.ground = ground
        this.time = time
        this.envIndex = envIndex
        this.skyManager = skyManager
        this.debug = debug
        this.handleChange = this.handleChange.bind(this)
        this.applyChange = this.applyChange.bind(this)
        this.init()
    }

    async init() {
        const src = ENVIRONMENTS_COLOR_MAPS[this.envIndex]
        const blendingScene = new Scene()
        const blendingRenderer = new WebGLRenderer()
        this.blendingCanvas = blendingRenderer.domElement
        const blendingCamera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
        blendingCamera.position.z = 8
        blendingRenderer.setSize(500, 500)
        const geometry = new PlaneBufferGeometry(2, 2, 1, 1)
        const textures = await Promise.all(src.map( _src => (textureLoader.loadAsync(_src))))

        this.blendMaterial = new ShaderMaterial({
            fog: true,
            vertexShader: blendingVertex,
            fragmentShader: blendingFragment,
            uniforms: {
                    ...UniformsUtils.merge([ UniformsLib['fog'] ]),
                        values: { type: "fv", value: [1, 0, 0, 0] } as IUniform,
                        map1: { value: textures[0] } as IUniform,
                        map2: { value: textures[1] } as IUniform,
                        map3: { value: textures[2] } as IUniform,
                        map4: { value: textures[3] } as IUniform,
                        uSky1: { value: SKY_MOODS_COLORS[MOODS.JOY] },
                        uSky2: { value: SKY_MOODS_COLORS[MOODS.FEAR] },
                        uSky3: { value: SKY_MOODS_COLORS[MOODS.SADNESS] },
                        uSky4: { value: SKY_MOODS_COLORS[MOODS.ANGER] },
                        uEnvSky1: { value: SKY_ENV_COLORS[ENVIRONMENTS.BEACH] },
                        uEnvSky2: { value: SKY_ENV_COLORS[ENVIRONMENTS.MEADOW] },
                        uPercentage: { value: 0. },
                        uEnvInfluence: { value: 1. },
                        uEnvPercentage: { value: 0. },
                        uSkyInfluence: { value: 0.2 }
            },
            morphTargets: true
        })
        blendingScene.add( new Mesh( geometry, this.blendMaterial ) )

        if (this.debug) {
            const folder = this.debug.addFolder('map')
            folder.add(this.blendMaterial.uniforms.uSkyInfluence, 'value')
        }

        this.skyManager.emitter.addEventListener('changeSky', () => {
            this.blendMaterial.uniforms.uPercentage.value = this.skyManager.skyMaterial.uniforms.uPercentage.value
            this.blendMaterial.uniforms.uEnvInfluence.value = this.skyManager.skyMaterial.uniforms.uEnvInfluence.value
            this.blendMaterial.uniforms.uEnvPercentage.value = this.skyManager.skyMaterial.uniforms.uEnvPercentage.value
        })

        this.time.on('tick', () => {
            blendingRenderer.render(blendingScene, blendingCamera)
        })
    }

    applyChange() {
        if (!(((this.ground.children[0] as Mesh).material) instanceof ShaderMaterial)) {
            ;((this.ground.children[0] as Mesh).material) = this.blendMaterial
        }
    }

    handleChange(value: number) {
        const values = [0, 0, 0, 0]

        // get morph target influences
        const [ firstMapIndex, secondMapIndex ] = [ Math.floor(value/WORLDBUILDER_PRECISION) % values.length, (Math.floor(value/WORLDBUILDER_PRECISION) + 1) % values.length ]
        const firstMapInfluence = 1 - ((value%WORLDBUILDER_PRECISION)/WORLDBUILDER_PRECISION)
        const secondMapInfluence = ((value%WORLDBUILDER_PRECISION)/WORLDBUILDER_PRECISION)

        values[firstMapIndex] = firstMapInfluence
        values[secondMapIndex] = secondMapInfluence

        this.blendMaterial.uniforms.values.value = values

        const valuesCopy = [...values]
        valuesCopy.shift() // first value is for flat ground and can be ignored
        ;(this.ground.children[0] as Mesh).morphTargetInfluences = valuesCopy

        store.dispatch('updateMapHeight', valuesCopy)

        this.applyChange()

    }
}