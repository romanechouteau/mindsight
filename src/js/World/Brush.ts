import { Object3D, Raycaster, Vector2, BufferGeometry, BufferAttribute, Points, ShaderMaterial, AdditiveBlending, Vector3 } from 'three'
// @ts-ignore
import Mouse from '@tools/Mouse'
// @ts-ignore
import Time from '@tools/Time'
// @ts-ignore
import Camera from '@js/Camera'

// @ts-ignore
import vertexShader from '../../shaders/brushvert.glsl';
// @ts-ignore
import fragmentShader from '../../shaders/brushfrag.glsl';

export default class Brush {
  raycaster: Raycaster
  scene: Object3D
  material: ShaderMaterial
  mouse: Mouse
  camera: Camera
  time: Time
  particles: Points
  isPainting: Boolean
  painting: Points
  geometry: BufferGeometry
  positions: number[]
  pixelRatio: number
  brushSize: number
  brushCount: number
  brushColor: Vector3
  particleSize: number

  constructor(options: { scene: Object3D, mouse: Mouse, camera: Camera, time: Time, pixelRatio: number, 
    brushSize: number, brushCount: number, particleSize: number, brushColor: Vector3 }) {
    const { scene, mouse, camera, time, pixelRatio, brushSize, brushCount, brushColor, particleSize } = options

    this.time = time
    this.scene = scene
    this.mouse = mouse
    this.camera = camera
    this.pixelRatio = pixelRatio

    this.brushSize = brushSize ?? 0.3
    this.brushCount = brushCount ?? 20
    this.particleSize = particleSize ?? 20
    this.brushColor = brushColor ?? new Vector3(1, 1, 1)

    this.geometry = new BufferGeometry()
    this.raycaster = new Raycaster()
    this.positions = []
    this.isPainting = false

    this.material = new ShaderMaterial({
      depthWrite: false,
      blending: AdditiveBlending,
      vertexColors: true,
      uniforms:
      {
        uSize: { value: this.particleSize * this.pixelRatio },
        uTime: { value: 0. },
        uColor: { value: this.brushColor }
      },
      vertexShader,
      fragmentShader
    })

    this.setBrush()
    this.listenCameraMove()
    this.setMovement()
    this.listenMouseDown()
    this.listenMouseUp()
  }

  setBrush() {
    const count = 50
    const geometry = new BufferGeometry()
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = Math.random() * this.brushSize
      positions[i * 3 + 1] = Math.random() * this.brushSize
      positions[i * 3 + 2] = Math.random() * this.brushSize
    }
    geometry.setAttribute(
      'position',
      new BufferAttribute(positions, 3)
    )
    this.particles = new Points(geometry, this.material)
    this.scene.add(this.particles)
  }

  listenCameraMove() {
    this.camera.orbitControls.addEventListener('change', () => {
      const { rotation } = this.camera.camera
      this.particles.rotation.x = rotation.x
      this.particles.rotation.y = rotation.y
      this.particles.rotation.z = rotation.z
    })
  }

  setMovement() {
    this.time.on('tick', () => {
      this.material.uniforms.uTime.value += 0.01

      const cursor = new Vector2(this.mouse.cursor[0], this.mouse.cursor[1])
      this.raycaster.setFromCamera(cursor, this.camera.camera)

      const intersection = this.raycaster.intersectObject(this.camera.raycasterPlane)
      if (intersection[0]) {
        const position = intersection[0].point
        this.particles.position.x = position.x
        this.particles.position.y = position.y
        this.particles.position.z = position.z

        if (this.isPainting) {
          for (let i = 0; i < this.brushCount; i++) {
            this.positions.push(
              position.x + (Math.random() - 0.5) * this.brushSize, 
              position.y + (Math.random() - 0.5) * this.brushSize, 
              position.z + (Math.random() - 0.5) * this.brushSize)
          }
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