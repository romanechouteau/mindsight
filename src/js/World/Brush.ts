import { Object3D, PointsMaterial, Raycaster, Vector2 } from 'three'
// @ts-ignore
import Mouse from '@tools/Mouse'
// @ts-ignore
import Time from '@tools/Time'
// @ts-ignore
import Camera from '@js/Camera'

export default class Brush {
  raycaster: Raycaster
  scene: Object3D
  material: PointsMaterial
  mouse: Mouse
  camera: Camera
  time: Time

  constructor(options: { scene: Object3D, mouse: Mouse, camera: Camera, time: Time }) {
    const { scene, mouse, camera, time } = options

    this.scene = scene
    this.mouse = mouse
    this.camera = camera
    this.time = time

    this.material = new PointsMaterial({
      size: 0.02,
      sizeAttenuation: true,
      color: '#FF0000'
    })

    this.raycaster = new Raycaster()

    this.listenMouseMove()
  }

  listenMouseMove() {

    this.time.on('tick', () => {
      const cursor = new Vector2(this.mouse.cursor[0], this.mouse.cursor[1])
      this.raycaster.setFromCamera(cursor, this.camera.camera)

      const intersection = this.raycaster.intersectObject(this.camera.raycasterPlane)
      console.log(intersection[0].point)
    })
  }
}