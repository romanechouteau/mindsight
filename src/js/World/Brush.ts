import { Object3D, Raycaster, Vector2, BufferGeometry, BufferAttribute, Points, ShaderMaterial, Color, DoubleSide } from 'three'
import * as dat from 'dat.gui'
import { isEqual, map, reduce, last, nth, slice } from 'lodash'

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
  depthTest: true,
  vertexColors: true,
  vertexShader,
  fragmentShader,
  transparent: true
}

const angles = [
  null,
  Math.PI * 4 / 3 + (3 * Math.PI / 2),
  Math.PI * 2 / 3 + (3 * Math.PI / 2),
  0 + (3 * Math.PI / 2)
]

const origins = [
  [0, 0],
  [Math.cos(Math.PI * 2 / 3), Math.sin(Math.PI * 2 / 3)],
  [Math.cos(Math.PI * 4 / 3), Math.sin(Math.PI * 4 / 3)],
  [1, 0]
]

const originPercentage = [
  null,
  Math.sqrt(Math.pow(Math.cos(Math.PI * 2 / 3) / 2 + 0.5, 2) + Math.pow(- Math.sin(Math.PI * 2 / 3) / 2 + 0.5, 2)) / 2 * 100,
  Math.sqrt(Math.pow(Math.cos(Math.PI * 4 / 3) / 2 + 0.5, 2) + Math.pow(Math.sin(Math.PI * 4 / 3) / 2 + 0.5, 2)) / 2 * 100,
  null
]

const percentages = [
  100,
  45,
  45,
  45
]

const colors = {
  joy: [[255, 0, 0], [255, 255, 0], [0, 255, 255], [85, 0, 255]]
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
        uParticleSize: { value: store.state.brush.particleSize * this.pixelRatio },
        uSize: { value: store.state.brush.size },
        uTime: { value: 0. },
        uColor: { value: this.getColorInGradient() },
        uOpacity: { value: 1. }
      },
    })

    this.setBrush()
    this.setMovement()
    this.listenMouseDown()
    this.listenMouseUp()
    this.listenKeyboard()
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
        this.painting.frustumCulled = false
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
            uParticleSize: { value: store.state.brush.particleSize * this.pixelRatio },
            uSize: { value: store.state.brush.size },
            uTime: { value: 0. },
            uColor: { value: this.getColorInGradient() },
            uOpacity: { value: 1. }
          },
        })
        this.brush.material = this.material
        this.brush.frustumCulled = false
      }
    })
  }

  listenKeyboard() {
    document.addEventListener('keyup', (event) => {
      event.preventDefault()
      const key = event.key || event.keyCode
      if (isEqual(key, ' ') || isEqual(key, 'Space') || isEqual(key, 32)) {
        const checkbox = <HTMLInputElement> this.element.querySelector('#canDraw')
        store.dispatch('updateBrushParams', { param: 'canDraw', value: !checkbox.checked })
      }
    })
  }

  render() {
    const sizePosition = this.getThumbPosition(0, 0.7, store.state.brush.size)
    const colorPosition = this.getThumbColorPosition(store.state.brush.color)

    this.element.innerHTML = `
      <div class="paramsGroup bigAndSmallCircles">
        <div class="inputGroup colorGroup">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            name="color2"
            id="color2"
            value="${store.state.brush.color}"
            style="background-image: linear-gradient(to right, ${map(colors[store.state.emotion], color =>
              `rgb(${color[0]}, ${color[1]}, ${color[2]})`)})" />
        </div>
        <div class="inputGroup circleRangeGroup">
          <div class="label">Brush size</div>
          <div
              class="circleRange"
              id="size"
              data-min="0"
              data-max="0.7">
            <div
                class="rangeThumb"
                style="top: ${sizePosition[1]}%; left: ${sizePosition[0]}%;"></div>
          </div>
        </div>
        <div class="inputGroup colorRangeGroup">
          <div
              class="colorRange"
              id="color"
              style="
              background-color: red;
              background-image: linear-gradient(${nth(angles, 2)}rad, rgb(${nth(colors[store.state.emotion], 2)}), rgb(${nth(colors[store.state.emotion], 2)}) ${nth(originPercentage, 2)}%, transparent ${nth(percentages, 2)}%),
              linear-gradient(${nth(angles, 1)}rad, rgb(${nth(colors[store.state.emotion], 1)}), rgb(${nth(colors[store.state.emotion], 1)}) ${nth(originPercentage, 2)}%, transparent ${nth(percentages, 1)}%),
              linear-gradient(${last(angles)}rad, rgb(${last(colors[store.state.emotion])}), transparent ${last(percentages)}%);">

            <div
                class="rangeThumb"
                style="top: ${colorPosition[1]}%; left: ${colorPosition[0]}%;"></div>
          </div>
        </div>
      </div>
      <div class="paramsGroup">
        <div class="inputGroup checkbox">
          <div class="checkboxWrapper">
            <div class="toggle">
              <input
                type="checkbox"
                name="canDraw"
                id="canDraw"
                ${store.state.brush.canDraw && 'checked'} />
              <div class="slider"></div>
            </div>
          </div>
          <label for="canDraw">Draw</label>
        </div>
        <div class="inputGroup">
        <input
        type="range"
        min="1"
        max="50"
        step="1"
        name="particleSize"
        id="particleSize"
        value="${store.state.brush.particleSize}" />
        <label for="particleSize">Particle size</label>
        </div>
        <div class="inputGroup">
          <input
            type="range"
            min="1"
            max="50"
            step="1"
            name="count"
            id="count"
            value="${store.state.brush.count}" />
          <label for="count">Density</label>
        </div>
      </div>
    `

    this.element.querySelectorAll('.circleRange').forEach((range) => {
      const param = range.id
      const min = parseFloat(range.getAttribute('data-min'))
      const max = parseFloat(range.getAttribute('data-max'))
      const isRounded = isEqual(range.getAttribute('data-round'), 'true')

      range.addEventListener('mousedown', (event: Event) => {
        const target = <HTMLInputElement>event.target
        const thumb = isEqual(target.className, 'rangeThumb') ? target : target.querySelector('.rangeThumb')
        const circle = isEqual(target.className, 'rangeThumb') ? <HTMLInputElement>target.parentNode : target
        const circleBox = circle.getBoundingClientRect()
        const center = [circleBox.left + (circleBox.width / 2), circleBox.top + (circleBox.height / 2)]
        const angleDecal = Math.PI / 4

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

    this.element.querySelectorAll('.colorRange').forEach((range) => {
      const param = range.id

      range.addEventListener('mousedown', (event: Event) => {
        const target = <HTMLInputElement>event.target
        const thumb = isEqual(target.className, 'rangeThumb') ? target : target.querySelector('.rangeThumb')
        const circle = isEqual(target.className, 'rangeThumb') ? <HTMLInputElement>target.parentNode : target
        const circleBox = circle.getBoundingClientRect()
        const radius = circleBox.width / 2
        const center = [circleBox.left + radius, circleBox.top + radius]

        this.updateColorRange(event, param, thumb, center, radius)

        const handleMouseMove = (mouseEvent: MouseEvent) => {
          this.updateColorRange(mouseEvent, param, thumb, center, radius)
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

    thumb.style.left = `${position[0]}%`
    thumb.style.top = `${position[1]}%`

    this.params[param] = value
    this.updateParam(param)
  }

  updateColorRange(event, param, thumb, center, radius) {
    const value = this.getColorValue(event, center, radius)
    const position = this.getThumbColorPosition(value)

    thumb.style.left = `${position[0]}%`
    thumb.style.top = `${position[1]}%`

    this.params[param] = value
    this.updateParam(param)
  }

  getThumbPosition(min, max, value) {
    const start = 7
    const end = 1
    const angleTrigo = Math.PI / 4
    const percentage = (value - min) / (max - min)
    const number = start - (percentage * (start - end))
    const angle = number * angleTrigo
    const x = (Math.sin(angle) / 2 + 0.5) * 100
    const y = (Math.cos(angle) / 2 + 0.5) * 100
    return [x, y]
  }

  getThumbColorPosition(value) {
    const x = (value[0] / 2 + 0.5) * 100
    const y = (- value[1] / 2 + 0.5) * 100
    return [x, y]
  }

  getColorValue(event, center, radius) {
    const position = [event.clientX, event.clientY]
    const angle = Math.atan2(position[0] - center[0], position[1] - center[1])
    const borderX = Math.abs(Math.sin(angle) * radius)
    const borderY = Math.abs(Math.cos(angle) * radius)

    const clampedX = Math.max(Math.min(position[0] - center[0], borderX), -borderX)
    const clampedY = Math.max(Math.min(center[1] - position[1], borderY), -borderY)

    const x = clampedX / radius
    const y = clampedY / radius

    return [x, y]
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
      return this.material.uniforms.uParticleSize.value = this.params.particleSize * this.pixelRatio
    }

    if (isEqual(param, 'size')) {
      return this.material.uniforms.uSize.value = this.params.size
    }

    if (isEqual(param, 'color')) {
      return this.material.uniforms.uColor.value = this.getColorInGradient()
    }

    return
  }

  getCoordsIntersect(origin, position, slopeAngle) {
    if (isEqual(slopeAngle, 0)) {
      const xIntersect = origin[0]
      const yIntersect = position[1]
      return [xIntersect, yIntersect]
    }

    const slopeTangent = -1 / slopeAngle
    const bTangent = - (slopeTangent * origin[0]) + origin[1]

    const bPerpendicular = - (slopeAngle * position[0]) + position[1]
    const perpendicular = (x) => slopeAngle * x + bPerpendicular

    const xIntersect = (bTangent - bPerpendicular) / (slopeAngle - slopeTangent)
    const yIntersect = perpendicular(xIntersect)
    return [xIntersect, yIntersect]
  }

  getColorInGradient() {
    const palette = [
      { color: colors[store.state.emotion][0] },
      ...map(slice(colors[store.state.emotion], 1), (color, i) => {
        const origin = origins[i + 1]
        const percentage = percentages[i + 1]

        const slopeAngle = origin[1] / origin[0]

        const [xIntersect, yIntersect] = this.getCoordsIntersect(origin, this.params.color, slopeAngle)

        const distanceX = Math.abs(this.params.color[0] - xIntersect)
        const distanceY = Math.abs(this.params.color[1] - yIntersect)
        const distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2))

        const clampedDistance = distance > 1 ? 1 : distance
        const proximity = 1 - clampedDistance
        return { color, proximity }
      })
    ]
    const totalWeight = reduce(slice(palette, 1), (acc, color) => acc + color.proximity, 0)
    palette[0].proximity = 1 - totalWeight
    const r = reduce(palette, (acc, color, i) => {
      return acc + color.color[0] * color.proximity
    }, 0)
    const g = reduce(palette, (acc, color, i) => {
      return acc + color.color[1] * color.proximity
    }, 0)
    const b = reduce(palette, (acc, color, i) => {
      return acc + color.color[2] * color.proximity
    }, 0)
    return new Color(r / 255, g / 255, b / 255)
  }
}