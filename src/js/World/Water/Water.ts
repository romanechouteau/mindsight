import { textureLoader } from "../../Tools/utils"
import { Color, DoubleSide, FrontSide, Mesh, MeshBasicMaterial, Object3D, PlaneBufferGeometry, PMREMGenerator, RepeatWrapping, ShaderMaterial, sRGBEncoding, Vector3 } from "three"
import Time from "../../Tools/Time"
import { WaterMesh } from './WaterMesh2'
// import { Water as WaterMesh } from 'three/examples/jsm/objects/Water'
import waterNormalsSrc from '../../../images/textures/plage/waternormals.jpeg'

interface WaterParams {
    time: Time
    dimensions: { width: number, height: number }
    debug: dat.GUI
}

export default class Water {
    time: Time
    waterMesh: Mesh
    material: ShaderMaterial
    container: Object3D
    debug: dat.GUI
    constructor({ time, dimensions, debug }: WaterParams) {
        this.container = new Object3D
        this.container.name = 'WaterContainer'
        this.time = time
        this.debug = debug
        this.init(dimensions)
    }

    init(dimensions: { width: number, height: number }) {
        const geometry = new PlaneBufferGeometry(dimensions.width, dimensions.height)
        this.waterMesh = new WaterMesh(
            geometry,
            {
                textureWidth: 512,
                textureHeight: 512,
                color: 0x3b82d8,
                alpha: 1,
                encoding: sRGBEncoding,
            }
        )
        this.waterMesh.rotation.x = -Math.PI/2
        this.container.add(this.waterMesh)

        if (this.debug) {
            const waterUniforms = (this.waterMesh.material as ShaderMaterial).uniforms

            const palette = {
                color: waterUniforms.color.value.getHex()
            }

            const folderWater = this.debug.addFolder('Water')
            folderWater.add(waterUniforms.reflectivity, 'value', 0, 0.5, 0.01).name('distortionScale')
            // folderWater.add(waterUniforms.flowSpeed, 'value', 0, 0.5, 0.01).name('size')
            // folderWater.add(waterUniforms.scale, 'value', 0.1, 10, 0.2).name('scale')
            folderWater.add(waterUniforms.alpha, 'value', 0.1, 1, 0.1).name('alpha')
            // folderWater.add(waterUniforms.flowDirection, 'value', 0.1, 1, 0.1).name('alpha')

            folderWater.addColor(palette, 'color').name('waterColor').onChange(val => {
                waterUniforms.color.value = new Color(val)
            })
            folderWater.open()
        }
    }
}