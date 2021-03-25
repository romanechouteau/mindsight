import { Object3D, Raycaster, Vector2, BufferGeometry, BufferAttribute, Points, ShaderMaterial, AdditiveBlending, Color } from 'three'
import * as dat from 'dat.gui'
import { isEqual, map } from 'lodash'

// @ts-ignore
import store from '@store/index'
// @ts-ignore
import { Mouse } from '@tools/Mouse'
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
        uColor: { value: this.getColorInGradient() },
        uOpacity: { value: 1. }
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
        const onCanvas = isEqual(this.mouse.targeted, this.canvas) || isEqual(this.mouse.targeted, this.element)
        if (onCanvas && this.material.uniforms.uOpacity.value < 1) {
          const value = this.material.uniforms.uOpacity.value += 0.06
          this.material.uniforms.uOpacity.value = Math.min(value, 1)
        } else if (!onCanvas && this.material.uniforms.uOpacity.value > 0) {
          const value = this.material.uniforms.uOpacity.value -= 0.03
          this.material.uniforms.uOpacity.value = Math.max(value, 0)
        }

        const cursor = new Vector2(this.mouse.cursor[0], this.mouse.cursor[1])
        this.raycaster.setFromCamera(cursor, this.camera.camera)

        const intersection = this.raycaster.intersectObject(this.camera.raycasterPlane)

        if (intersection[0]) {
          const position = intersection[0].point
          const currentPositions = []
          this.brushPositions = this.brushPositions.length % this.params.count * 3 === 0
            ? this.brushPositions.slice((-this.params.count * 3 * lastPositions))
            : []

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
        this.brushPositions = []
        this.brushGeometry.setAttribute(
          'position',
          new BufferAttribute(new Float32Array(), 3)
        )
      }
    })
  }

  listenMouseDown() {
    this.mouse.on('down', () => {
      if ((isEqual(this.mouse.targeted, this.canvas) || isEqual(this.mouse.targeted, this.element)) && isEqual(store.state.brush.canDraw, true)) {
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
            uColor: { value: this.getColorInGradient() },
            uOpacity: { value: 1. }
          },
        })
        this.brush.material = this.material
      }
    })
  }

  render() {
    const sizePosition = this.getThumbPosition(0, 1, store.state.brush.size)
    const countPosition = this.getThumbPosition(1, 50, store.state.brush.count)
    const particleSizePosition = this.getThumbPosition(1, 50, store.state.brush.particleSize)

    this.element.innerHTML = `
      <div class="paramsWrapper leftParams">
        <div class="paramsGroup bigAndSmallCircles">
          <div class="inputGroup circleRangeGroup smallCircle">
            <div class="label">Particle size</div>
            <div
              class="circleRange"
              id="particleSize"
              data-min="1"
              data-max="50">
              <div
                  class="rangeThumb"
                  style="top: ${particleSizePosition[0]}%; left: ${particleSizePosition[1]}%;"></div>
            </div>
          </div>
          <div class="inputGroup circleRangeGroup">
            <div class="label">Brush size</div>
            <div
                class="circleRange"
                id="size"
                data-min="0"
                data-max="1">
              <div
                  class="rangeThumb"
                  style="top: ${sizePosition[0]}%; left: ${sizePosition[1]}%;"></div>
            </div>
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
              value="${store.state.brush.color}"
              style="background-image: linear-gradient(to right, ${map(colors[store.state.emotion], color =>
                `rgb(${color[0]}, ${color[1]}, ${color[2]})`)})" />
          </div>
        </div>
      </div>
      <div class="paramsWrapper rightParams">
        <div class="paramsGroup bottomGroup">
          <div class="inputGroup checkbox">
            <label for="canDraw">Draw</label>
            <div class="toggle">
              <input
                type="checkbox"
                name="canDraw"
                id="canDraw"
                ${store.state.brush.canDraw && 'checked'} />
              <div class="slider"></div>
            </div>
          </div>
        </div>
        <div class="paramsGroup">
          <div class="inputGroup circleRangeGroup">
            <div class="label">Density</div>
            <div
              class="circleRange"
              id="count"
              data-orientation="right"
              data-round="true"
              data-min="1"
              data-max="50">
              <div
                  class="rangeThumb"
                  style="top: ${countPosition[0]}%; left: ${countPosition[1]}%;"></div>
            </div>
          </div>
        </div>
      </div>
    `

    this.element.querySelectorAll('.circleRange').forEach((range) => {
      const param = range.id
      const min = parseFloat(range.getAttribute('data-min'))
      const max = parseFloat(range.getAttribute('data-max'))
      const isRounded = isEqual(range.getAttribute('data-round'), 'true')

      range.addEventListener('mousedown', (event: Event) => {
        console.log('hello')
        const target = <HTMLInputElement>event.target
        const thumb = isEqual(target.className, 'rangeThumb') ? target : target.querySelector('.rangeThumb')
        const circle = isEqual(target.className, 'rangeThumb') ? <HTMLInputElement>target.parentNode : target
        const circleBox = circle.getBoundingClientRect()
        const center = [circleBox.left + (circleBox.width / 2), circleBox.top + (circleBox.height / 2)]
        const angleDecal = isEqual(circle.getAttribute('data-orientation'), 'right') ? - Math.PI / 4 : Math.PI / 4

        this.updateRange(event, param, thumb, center, min, max, isRounded, angleDecal)

        const handleMouseMove = (mouseEvent: MouseEvent) => {
          this.updateRange(mouseEvent, param, thumb, center, min, max, isRounded, angleDecal)
        }

        document.addEventListener('mousemove', handleMouseMove)

        document.addEventListener('mouseup', () => {
          document.removeEventListener('mousemove', handleMouseMove)

          store.dispatch('updateBrushParams', { param, value: this.params[param] })
        }, { once: true })
      })
    })

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

  updateRange(event, param, thumb, center, min, max, isRounded, angleDecal) {
    const value = this.getParamValue(event, center, min, max, isRounded, angleDecal)
    const position = this.getThumbPosition(min, max, value)

    thumb.style.top = `${position[0]}%`
    thumb.style.left = `${position[1]}%`

    this.params[param] = value
    this.updateParam(param)
  }

  getParamValue(event, center, min, max, isRounded, angleDecal) {
    const start = 7
    const end = 1
    const angleTrigo = Math.PI / 4

    const position = [event.clientX, event.clientY]
    const angle =  Math.atan2(position[0] - center[0], position[1] - center[1]) + angleDecal
    const positiveAngle = angle > 0 ? angle : angle + (Math.PI * 2)

    const number = positiveAngle / angleTrigo
    const percentage = (start - number) / (start - end)
    const value = (percentage * (max - min)) + min
    const finalValue = Math.min(Math.max(value, min), max)

    return isRounded ? Math.round(finalValue) : finalValue
  }

  getThumbPosition(min, max, value) {
    const start = 7
    const end = 1
    const angleTrigo = Math.PI / 4
    const percentage = (value - min) / (max - min)
    const number = start - (percentage * (start - end))
    const angle = number * angleTrigo
    const x = (Math.cos(angle) / 2 + 0.5) * 100
    const y = (Math.sin(angle) / 2 + 0.5) * 100
    return [x, y]
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