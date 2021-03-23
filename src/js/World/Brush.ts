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
  scene: Object3D
  mouse: Mouse
  brush: Points
  camera: Camera
  canvas: HTMLElement
  params: {
    brushSize: number,
    brushCount: number,
    particleSize: number,
    brushColor: number
  }
  painting: Points
  material: ShaderMaterial
  interface: dat.GUI
  raycaster: Raycaster
  pixelRatio: number
  isPainting: Boolean
  brushGeometry: BufferGeometry
  brushPositions: number[]
  particlesOffset: number[]
  paintingGeometry: BufferGeometry
  paintedMaterials: ShaderMaterial[]
  paintingPositions: number[]

  constructor(options: { scene: Object3D, mouse: Mouse, camera: Camera, time: Time, canvas: HTMLElement, pixelRatio: number }) {
    const { scene, mouse, camera, time, canvas, pixelRatio } = options

    this.time = time
    this.scene = scene
    this.mouse = mouse
    this.camera = camera
    this.canvas = canvas
    this.pixelRatio = pixelRatio

    this.params = {
      brushSize: 0.3,
      brushCount: 10,
      particleSize: 20,
      brushColor: 0xFFFFFF,
    }

    this.interface = new dat.GUI({ autoPlace: false })
    this.raycaster = new Raycaster()
    this.paintingPositions = []
    this.isPainting = false
    this.brushPositions = []
    this.particlesOffset = []
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
    this.setMovement()
    this.listenMouseDown()
    this.listenMouseUp()
    this.setParameters()
  }

  setBrush() {
    this.brushGeometry = new BufferGeometry()
    this.brush = new Points(this.brushGeometry, this.material)
    for (let i = 0; i < this.params.brushCount; i++) {
      this.particlesOffset.push(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5)
    }
    this.scene.add(this.brush)
  }

  setMovement() {
    const lastPositions = 5

    this.time.on('tick', () => {
      this.material.uniforms.uTime.value += 0.01
      this.paintedMaterials.forEach(material => material.uniforms.uTime.value += 0.01)

      const cursor = new Vector2(this.mouse.cursor[0], this.mouse.cursor[1])
      this.raycaster.setFromCamera(cursor, this.camera.camera)

      const intersection = this.raycaster.intersectObject(this.camera.raycasterPlane)

      if (intersection[0]) {
        const position = intersection[0].point
        const currentPositions = []
        this.brushPositions = this.brushPositions.slice((-this.params.brushCount * 3) * lastPositions)

        if (this.isPainting) {
          this.particlesOffset = []
        }

        for (let i = 0; i < this.params.brushCount; i++) {
          if (this.isPainting) {
            this.particlesOffset.push(
              Math.random() - 0.5,
              Math.random() - 0.5,
              Math.random() - 0.5
            )
          }

          currentPositions.push(
            position.x + this.particlesOffset[i * 3] * this.params.brushSize,
            position.y + this.particlesOffset[i * 3 + 1] * this.params.brushSize,
            position.z + this.particlesOffset[i * 3 + 2] * this.params.brushSize)
        }

        this.brushPositions.push(...currentPositions)
        this.brushGeometry.setAttribute(
          'position',
          new BufferAttribute(new Float32Array(this.brushPositions), 3)
        )

        if (this.isPainting) {
          this.paintingPositions.push(...currentPositions)
          this.paintingGeometry.setAttribute(
            'position',
            new BufferAttribute(new Float32Array(this.paintingPositions), 3)
          )
        }
      }
    })
  }

  listenMouseDown() {
    this.mouse.on('down', () => {
      if (this.mouse.targeted === this.canvas) {
        this.isPainting = true
        this.paintingGeometry = new BufferGeometry()
        this.paintingPositions = []

        this.painting = new Points(this.paintingGeometry, this.material)
        this.scene.add(this.painting)
      }
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

  setParameters() {
    this.interface
      .add(this.params, 'brushSize', 0, 1, 0.01)
      .name('Brush Size')
    this.interface
      .add(this.params, 'brushCount', 0, 50, 1)
      .name('Density')
      .onChange(() => {
        this.particlesOffset = []
        for (let i = 0; i < this.params.brushCount; i++) {
            this.particlesOffset.push(
              Math.random() - 0.5,
              Math.random() - 0.5,
              Math.random() - 0.5
            )
        }
      })
    this.interface
      .add(this.params, 'particleSize', 0, 50, 1)
      .name('Particle Size')
      .onChange(() => {
        this.material.uniforms.uSize.value = this.params.particleSize * this.pixelRatio
      })
    this.interface
    .addColor(this.params, 'brushColor')
    .name('Color')
    .onChange(() => {
      this.material.uniforms.uColor.value = new Color(this.params.brushColor)
    })
    document.getElementsByClassName('brushInterface')[0].appendChild(this.interface.domElement)
  }
}