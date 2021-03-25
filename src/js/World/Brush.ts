import { Object3D, Raycaster, Vector2, BufferGeometry, BufferAttribute, Points, ShaderMaterial, AdditiveBlending, Color } from 'three'
import * as dat from 'dat.gui'
import { isEqual, map } from 'lodash'

// @ts-ignore
import store from '@store/index'
// @ts-ignore
import Mouse from '@tools/Mouse'
// @ts-ignore
import Time from '@tools/Time'
// @ts-ignore
import Camera from '@js/Camera'
// @ts-ignore
import Component from '@lib/Component'

// @ts-ignore
import vertexShader from '@shaders/brushvert.glsl';
// @ts-ignore
import fragmentShader from '@shaders/brushfrag.glsl';

const configShaderMaterial = {
  depthWrite: false,
  blending: AdditiveBlending,
  vertexColors: true,
  vertexShader,
  fragmentShader,
}

const colors = {
  joy: [[0, 0, 255], [0, 255, 0], [255, 0, 0]]
}

const lastPositions = 5

export default class Brush extends Component {
  time: Time
  scene: Object3D
  mouse: Mouse
  brush: Points
  camera: Camera
  canvas: HTMLElement
  element: HTMLElement
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
  params: {
    size: number
    count: number,
    particleSize: number,
    color: number,
  }

  constructor(options: { scene: Object3D, mouse: Mouse, camera: Camera, time: Time, canvas: HTMLElement, pixelRatio: number }) {
    const { scene, mouse, camera, time, canvas, pixelRatio } = options

    super({
      store,
      element: document.querySelector('.brushInterface')
    })

    this.time = time
    this.scene = scene
    this.mouse = mouse
    this.camera = camera
    this.canvas = canvas
    this.params = {
      size: store.state.brush.size,
      count: store.state.brush.count,
      particleSize: store.state.brush.particleSize,
      color: store.state.brush.color,
    }
    this.pixelRatio = pixelRatio

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
        uSize: { value: store.state.brush.particleSize * this.pixelRatio },
        uTime: { value: 0. },
        uColor: { value: this.getColorInGradient() }
      },
    })

    this.setBrush()
    this.setMovement()
    this.listenMouseDown()
    this.listenMouseUp()
    this.render()
  }

  setBrush() {
    this.brushGeometry = new BufferGeometry()
    this.brush = new Points(this.brushGeometry, this.material)
    for (let i = 0; i < store.state.brush.count; i++) {
      this.particlesOffset.push(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5)
    }
    this.scene.add(this.brush)
  }

  setMovement() {
    this.time.on('tick', () => {
      this.material.uniforms.uTime.value += 0.01
      this.paintedMaterials.forEach(material => material.uniforms.uTime.value += 0.01)

      if (isEqual(store.state.brush.canDraw, true)) {
        const cursor = new Vector2(this.mouse.cursor[0], this.mouse.cursor[1])
        this.raycaster.setFromCamera(cursor, this.camera.camera)

        const intersection = this.raycaster.intersectObject(this.camera.raycasterPlane)

        if (intersection[0]) {
          const position = intersection[0].point
          const currentPositions = []
          this.brushPositions = this.brushPositions.slice((-this.params.count * 3) * lastPositions)

          if (this.isPainting) {
            this.particlesOffset = []
          }

          for (let i = 0; i < this.params.count; i++) {
            if (this.isPainting) {
              this.particlesOffset.push(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
              )
            }

            currentPositions.push(
              position.x + this.particlesOffset[i * 3] * this.params.size,
              position.y + this.particlesOffset[i * 3 + 1] * this.params.size,
              position.z + this.particlesOffset[i * 3 + 2] * this.params.size)
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
      } else {
        this.brushGeometry.setAttribute(
          'position',
          new BufferAttribute(new Float32Array(), 3)
        )
      }
    })
  }

  listenMouseDown() {
    this.mouse.on('down', () => {
      if (this.mouse.targeted === this.canvas && isEqual(store.state.brush.canDraw, true)) {
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
      if (isEqual(this.isPainting, true) && isEqual(store.state.brush.canDraw, true)) {
        this.isPainting = false
        this.paintedMaterials.push(this.material)
        this.material = new ShaderMaterial({
          ...configShaderMaterial,
          uniforms:
          {
            uSize: { value: store.state.brush.particleSize * this.pixelRatio },
            uTime: { value: 0. },
            uColor: { value: this.getColorInGradient() }
          },
        })
        this.brush.material = this.material
      }
    })
  }

  render() {
    this.element.innerHTML = `
      <div class="paramsGroup">
        <div class="inputGroup">
          <label for="size">Brush size</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            name="size"
            id="size"
            value="${store.state.brush.size}" />
        </div>
        <div class="inputGroup">
          <label for="count">Density</label>
          <input
            type="range"
            min="1"
            max="50"
            step="1"
            name="count"
            id="count"
            value="${store.state.brush.count}" />
        </div>
        <div class="inputGroup">
          <label for="particleSize">Particle size</label>
          <input
            type="range"
            min="1"
            max="50"
            step="1"
            name="particleSize"
            id="particleSize"
            value="${store.state.brush.particleSize}" />
        </div>
      </div>
      <div class="paramsGroup">
        <div class="inputGroup colorGroup">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            name="color"
            id="color"
            value="${store.state.brush.color}" />
        </div>
      </div>
      <div class="paramsGroup">
        <div class="inputGroup">
          <label for="canDraw">Draw</label>
          <input
            type="checkbox"
            name="canDraw"
            id="canDraw"
            ${store.state.brush.canDraw && 'checked'} />
        </div>
      </div>
    `

    this.element.querySelectorAll('input').forEach((input) => {
      const param = input.getAttribute('name')
      const type = input.getAttribute('type')

      if (isEqual(type, 'range')) {
        input.addEventListener('input', () => {
          const value = parseFloat(input.value)
          this.params[param] = value
          this.updateParam(param)
        })

        input.addEventListener('change', () => {
          const value = parseFloat(input.value)
          store.dispatch('updateBrushParams', { param, value })
        })
      } else if (isEqual(type, 'checkbox')) {
        input.addEventListener('change', () => {
          const value = input.checked
          store.dispatch('updateBrushParams', { param, value })
        })
      }
    });
  }

  updateParam(param) {
    if (isEqual(param, 'count')) {
      this.particlesOffset = []
      for (let i = 0; i < this.params.count; i++) {
          this.particlesOffset.push(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
          )
      }
      return this.particlesOffset
    }

    if (isEqual(param, 'particleSize')) {
      return this.material.uniforms.uSize.value = this.params.particleSize * this.pixelRatio
    }

    if (isEqual(param, 'color')) {
      return this.material.uniforms.uColor.value = this.getColorInGradient()
    }

    return
  }

  getColorInGradient() {
    const palette = colors[store.state.emotion]
    const share = 1 / (palette.length - 1)
    const indexFirst = Math.floor(this.params.color / share)
    const indexLast = Math.ceil(this.params.color / share)
    const percentage = (this.params.color - (share * indexFirst)) * (palette.length - 1)
    const color = map(palette[indexFirst], (colorFrag, i) => (Math.round(colorFrag * (1 - percentage) + palette[indexLast][i] * percentage) / 255))
    return new Color(...color)
  }
}