import { Object3D, PointsMaterial, Raycaster, Vector2, Mesh, BoxBufferGeometry, MeshBasicMaterial, BufferGeometry, BufferAttribute, Points } from 'three'
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
  particles: Mesh
  isPainting: Boolean
  painting: Points
  geometry: BufferGeometry
  positions: number[]

  constructor(options: { scene: Object3D, mouse: Mouse, camera: Camera, time: Time }) {
    const { scene, mouse, camera, time } = options

    this.scene = scene
    this.mouse = mouse
    this.camera = camera
    this.time = time
    this.isPainting = false
    this.geometry = new BufferGeometry()
    this.positions = []

    this.material = new PointsMaterial({
      size: 0.02,
      sizeAttenuation: true,
      color: '#FF0000'
    })

    const geometry = new BoxBufferGeometry(.5, .5, .5)
    const material = new MeshBasicMaterial({
      color: "#ff0000"
    })

    this.particles = new Mesh(geometry, material)
    this.scene.add(this.particles)

    this.raycaster = new Raycaster()

    this.listenCameraMove()
    this.listenMouseMove()
    this.listenMouseDown()
    this.listenMouseUp()
  }

  listenCameraMove() {
    this.camera.orbitControls.addEventListener('change', () => {
      const { rotation } = this.camera.camera
      this.particles.rotation.x = rotation.x
      this.particles.rotation.y = rotation.y
      this.particles.rotation.z = rotation.z
    })
  }

  listenMouseMove() {
    this.time.on('tick', () => {
      const cursor = new Vector2(this.mouse.cursor[0], this.mouse.cursor[1])
      this.raycaster.setFromCamera(cursor, this.camera.camera)

      const intersection = this.raycaster.intersectObject(this.camera.raycasterPlane)
      if (intersection[0]) {
        const position = intersection[0].point
        this.particles.position.x = position.x
        this.particles.position.y = position.y
        this.particles.position.z = position.z

        if (this.isPainting) {
          this.positions.push(position.x, position.y, position.z)
          const positions = new Float32Array(this.positions)
          this.geometry.setAttribute(
            'position',
            new BufferAttribute(positions, 3)
          )
        }
      }
    })
  }

  listenMouseDown() {
    this.mouse.on('down', () => {
      this.isPainting = true
      this.geometry = new BufferGeometry()

      this.positions = []

      this.painting = new Points(this.geometry, this.material)
      this.scene.add(this.painting)
    })
  }

  listenMouseUp() {
    this.mouse.on('up', () => {
      this.isPainting = false
    })
  }
}