import { Object3D, Raycaster, Vector2, BufferGeometry, BufferAttribute, Points, ShaderMaterial, AdditiveBlending, Color } from 'three'
import * as dat from 'dat.gui'
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

const configShaderMaterial = {
  depthWrite: false,
  blending: AdditiveBlending,
  vertexColors: true,
  vertexShader,
  fragmentShader,
}

export default class Brush {
  time: Time
  debug: dat.GUI
  scene: Object3D
  mouse: Mouse
  brush: Points
  camera: Camera
  params: {
    brushSize: number,
    brushCount: number,
    particleSize: number,
    brushColor: number
  }
  painting: Points
  material: ShaderMaterial
  positions: number[]
  raycaster: Raycaster
  pixelRatio: number
  isPainting: Boolean
  debugFolder: dat.GUI
  paintedMaterials: ShaderMaterial[]
  brushGeometry: BufferGeometry
  paintingGeometry: BufferGeometry

  constructor(options: { debug: dat.GUI, scene: Object3D, mouse: Mouse, camera: Camera, time: Time, pixelRatio: number }) {
    const { debug, scene, mouse, camera, time, pixelRatio } = options

    this.time = time
    this.debug = debug
    this.scene = scene
    this.mouse = mouse
    this.camera = camera
    this.pixelRatio = pixelRatio

    this.params = {
      brushSize: 0.3,
      brushCount: 10,
      particleSize: 20,
      brushColor: 0xFFFFFF,
    }

    this.raycaster = new Raycaster()
    this.positions = []
    this.isPainting = false
    this.paintedMaterials = []
    this.paintingGeometry = new BufferGeometry()
    this.material = new ShaderMaterial({
      ...configShaderMaterial,
      uniforms:
      {
        uSize: { value: this.params.particleSize * this.pixelRatio },
        uTime: { value: 0. },
        uColor: { value: new Color(this.params.brushColor) }
      },
    })

    this.setBrush()
    this.listenCameraMove()
    this.setMovement()
    this.listenMouseDown()
    this.listenMouseUp()
    if (this.debug) {
      this.setDebug()
    }
  }

  getBrushPositions() {
    const count = 50
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = Math.random() * this.params.brushSize
      positions[i * 3 + 1] = Math.random() * this.params.brushSize
      positions[i * 3 + 2] = Math.random() * this.params.brushSize
    }
    return positions
  }

  setBrush() {
    this.brushGeometry = new BufferGeometry()
    this.brushGeometry.setAttribute(
      'position',
      new BufferAttribute(this.getBrushPositions(), 3)
    )
    this.brush = new Points(this.brushGeometry, this.material)
    this.scene.add(this.brush)
  }

  listenCameraMove() {
    this.camera.orbitControls.addEventListener('change', () => {
      const { rotation } = this.camera.camera
      this.brush.rotation.x = rotation.x
      this.brush.rotation.y = rotation.y
      this.brush.rotation.z = rotation.z
    })
  }

  setMovement() {
    this.time.on('tick', () => {
      this.material.uniforms.uTime.value += 0.01
      this.paintedMaterials.forEach(material => material.uniforms.uTime.value += 0.01)

      const cursor = new Vector2(this.mouse.cursor[0], this.mouse.cursor[1])
      this.raycaster.setFromCamera(cursor, this.camera.camera)

      const intersection = this.raycaster.intersectObject(this.camera.raycasterPlane)
      if (intersection[0]) {
        const position = intersection[0].point
        this.brush.position.x = position.x
        this.brush.position.y = position.y
        this.brush.position.z = position.z

        if (this.isPainting) {
          for (let i = 0; i < this.params.brushCount; i++) {
            this.positions.push(
              position.x + (Math.random() - 0.5) * this.params.brushSize,
              position.y + (Math.random() - 0.5) * this.params.brushSize,
              position.z + (Math.random() - 0.5) * this.params.brushSize)
          }
          const positions = new Float32Array(this.positions)
          this.paintingGeometry.setAttribute(
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
      this.paintingGeometry = new BufferGeometry()
      this.positions = []

      this.painting = new Points(this.paintingGeometry, this.material)
      this.scene.add(this.painting)
    })
  }

  listenMouseUp() {
    this.mouse.on('up', () => {
      this.isPainting = false
      this.paintedMaterials.push(this.material)
      this.material = new ShaderMaterial({
        ...configShaderMaterial,
        uniforms:
        {
          uSize: { value: this.params.particleSize * this.pixelRatio },
          uTime: { value: 0. },
          uColor: { value: new Color(this.params.brushColor) }
        },
      })
      this.brush.material = this.material
    })
  }

  setDebug() {
    this.debugFolder = this.debug.addFolder('Brush')
    this.debugFolder.open()

    this.debugFolder
      .add(this.params, 'brushSize', 0, 1, 0.01)
      .name('Brush Size')
      .onChange(() => {
        this.brushGeometry.setAttribute(
          'position',
          new BufferAttribute(this.getBrushPositions(), 3)
        )
      })
    this.debugFolder
      .add(this.params, 'brushCount', 0, 50, 1)
      .name('Brush Count')
    this.debugFolder
      .add(this.params, 'particleSize', 0, 50, 1)
      .name('Particle Size')
      .onChange(() => {
        this.material.uniforms.uSize.value = this.params.particleSize * this.pixelRatio
      })
    this.debugFolder
    .addColor(this.params, 'brushColor')
    .name('Color')
    .onChange(() => {
      this.material.uniforms.uColor.value = new Color(this.params.brushColor)
    })
  }
}