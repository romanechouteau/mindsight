import { Object3D, PointLight, Color, DirectionalLight } from 'three'

export default class PointLightSource {
  debug: any
  container: Object3D
  params: { color: number; positionX: number; positionY: number; positionZ: number }
  light: PointLight
  debugFolder: any
  constructor(options) {
    // Set options
    this.debug = options.debug

    // Set up
    this.container = new Object3D()
    this.container.name = 'Point Light'
    this.params = {
      color: 0xffffff,
      positionX: 0,
      positionY: 2,
      positionZ: 5,
    }

    this.createPointLight()

    if (this.debug) {
      this.setDebug()
    }
  }
  createPointLight() {
    this.light = new PointLight(this.params.color)
    this.light.castShadow = true
    this.light.position.set(
      this.params.positionX,
      this.params.positionY,
      this.params.positionZ
    )
    this.container.add(this.light)

    // const light = new DirectionalLight(this.params.color, 1);
    // light.position.set(0, 10, 0);
    // light.target.position.set(-5, 0, 0);
    // this.container.add(light)
  }
  setDebug() {
    // Color debug
    this.debugFolder = this.debug.addFolder('Point Light')
    this.debugFolder.open()
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
