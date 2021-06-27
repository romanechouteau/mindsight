import { Object3D, AmbientLight, Color } from 'three'
import SkyManager from '../Behavior/SkyManager'
import { mix, toHexInt, toRGB } from '../Tools/colorUtils'
import { colorUtils } from '../Tools/utils'

export default class AmbientLightSource {
  debug: any
  container: Object3D
  params: { color: number }
  light: AmbientLight
  debugFolder: any
  sky: SkyManager
  
  constructor(options) {
    // Set options
    this.debug = options.debug
    this.sky = options.sky

    // Set up
    this.container = new Object3D()
    this.container.name = 'Ambient Light'
    this.params = { color: 0xFFD160 }

    this.createAmbientLight()

    if (this.debug) {
      this.setDebug()
    }
  }
  setSky(sky: SkyManager) {
    this.sky = sky
    this.light.color = new Color(toHexInt(mix(
      toRGB(this.sky.skyMaterial.uniforms.uFirstColorTop.value),
      toRGB(0xFFFFFF),
      0.8,
    )))  
  }
  createAmbientLight() {
    this.light = new AmbientLight(this.params.color, 1)
    this.container.add(this.light)
  }
  setDebug() {
    this.debugFolder = this.debug.addFolder('Ambient Light')
    this.debugFolder
      .addColor(this.params, 'color')
      .name('Color')
      .onChange(() => {
        this.light.color = new Color(this.params.color)
      })
  }
}
