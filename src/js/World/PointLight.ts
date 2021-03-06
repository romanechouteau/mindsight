import { Object3D, PointLight, Color, DirectionalLight } from 'three'
import SkyManager from '../Behavior/SkyManager'
import { mix, toHexInt, toRGB } from '../Tools/colorUtils'

export default class PointLightSource {
  debug: any
  container: Object3D
  params: { color: number; positionX: number; positionY: number; positionZ: number }
  light: PointLight
  debugFolder: any
  sky: SkyManager
  constructor(options) {
    // Set options
    this.debug = options.debug
    this.sky = options.sky

    // Set up
    this.container = new Object3D()
    this.container.name = 'Point Light'
    this.params = {
      color: 0xFFD160,
      positionX: 0,
      positionY: 30,
      positionZ: 5,
    }

    this.createPointLight()

    if (this.debug) {
      this.setDebug()
    }
  }
  createPointLight() {
    this.light = new PointLight(this.params.color, 0.05)
    this.light.castShadow = true
    this.light.position.set(
      this.params.positionX,
      this.params.positionY,
      this.params.positionZ
    )
    this.container.add(this.light)
  }
  setSky(sky: SkyManager) {
    this.sky = sky
    this.light.color = new Color(toHexInt(mix(
      toRGB(this.sky.skyMaterial.uniforms.uFirstColorTop.value),
      toRGB(0xFFFFFF),
      0.9,
    )))  
  }
  setDebug() {
    // Color debug
    this.debugFolder = this.debug.addFolder('Point Light')
    this.debugFolder
      .addColor(this.params, 'color')
      .name('Color')
      .onChange(() => {
        this.light.color = new Color(this.params.color)
      })
    //Position debug
    this.debugFolder
      .add(this.light.position, 'x')
      .step(0.1)
      .min(-5)
      .max(5)
      .name('Position X')
    this.debugFolder
      .add(this.light.position, 'y')
      .step(0.1)
      .min(-5)
      .max(5)
      .name('Position Y')
    this.debugFolder
      .add(this.light.position, 'z')
      .step(0.1)
      .min(-5)
      .max(5)
      .name('Position Z')
  }
}
