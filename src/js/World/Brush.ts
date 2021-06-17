import { Object3D, Raycaster, Vector2, BufferGeometry, BufferAttribute, Points, ShaderMaterial, Color, Group } from 'three'
import * as dat from 'dat.gui'
import { debounce } from 'lodash'

// @ts-ignore
import Time from '@tools/Time'
// @ts-ignore
import store from '@store/index'
// @ts-ignore
import Camera from '@js/Camera'
// @ts-ignore
import { Mouse } from '@tools/Mouse'
// @ts-ignore
import { toRGB } from '@tools/colorUtils'
// @ts-ignore
import { random } from '@tools/mathUtils'
// @ts-ignore
import template from '../../templates/brushInterface.template'
// @ts-ignore
import Component from '@lib/Component'
// @ts-ignore
import { htmlUtils } from '@tools/utils'
import VoiceManager from '../Behavior/VoiceManager'
// @ts-ignore
import vertexShader from '@shaders/brushvert.glsl'
// @ts-ignore
import fragmentShader from '@shaders/brushfrag.glsl'


import { AUDIO_INPUT_MODES, CURSOR_MODES, BRUSH_PALETTE_ANGLES,
  BRUSH_LAST_POSITIONS, BRUSH_PALETTE_COLORS, LIST_MOODS_PALETTE } from '../constants'

const configShaderMaterial = {
  depthWrite: false,
  depthTest: true,
  vertexColors: true,
  vertexShader,
  fragmentShader,
  transparent: true
}

export default class Brush extends Component {
  time: Time
  scene: Object3D
  mouse: Mouse
  brush: Points
  camera: Camera
  canvas: HTMLElement
  stopped: Boolean
  element: HTMLElement
  palette: ImageData
  painting: Points
  material: ShaderMaterial
  interface: dat.GUI
  raycaster: Raycaster
  container: Group
  pixelRatio: number
  isPainting: Boolean
  brushPreview: NodeListOf<SVGCircleElement>
  brushGeometry: BufferGeometry
  brushPositions: number[]
  resizeListener: EventListener
  particlesOffset: number[]
  mouseUpListener: Function
  paintingGeometry: BufferGeometry
  paintedMaterials: ShaderMaterial[]
  paintedGeometries: BufferGeometry[]
  paintingPositions: number[]
  mouseDownListener: Function
  params: {
    size: number
    count: number,
    particleSize: number,
    color: number[],
  }
  audioData: {
    intensity: number
    moving: boolean
    waitForNextBeat: boolean
    peak: boolean
  }
  debug: any

  constructor(options: { scene: Object3D, mouse: Mouse, camera: Camera, time: Time, canvas: HTMLElement, pixelRatio: number, debug: any }) {

    super({
      store,
      element: document.querySelector('.brushInterface')
    })

    const { scene, mouse, camera, time, canvas, pixelRatio, debug } = options

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

    this.stopped = false
    this.interface = new dat.GUI({ autoPlace: false })
    this.raycaster = new Raycaster()
    this.paintingPositions = []
    this.isPainting = false
    this.brushPositions = []
    this.particlesOffset = []
    this.paintedMaterials = []
    this.paintedGeometries = []
    this.paintingGeometry = new BufferGeometry()
    this.container = new Group()
    this.scene.add(this.container)
    this.debug = debug

    this.firstRender()

    this.material = new ShaderMaterial({
      ...configShaderMaterial,
      uniforms:
      {
        uParticleSize: { value: store.state.brush.particleSize * this.pixelRatio },
        uSize: { value: store.state.brush.size },
        uTime: { value: 0. },
        uColor: { value: this.getColorInGradient() },
        uOpacity: { value: 1. },
        uBeat: { value: 0. }
      },
    })

    this.audioData = { moving: false, intensity: 0, waitForNextBeat: false, peak: false }

    this.setBrush()
    this.setMovement()
    this.listenMouseDown()
    this.listenMouseUp()

    this.resizeListener = debounce(() => this.resizePalette(), 150)
    window.addEventListener('resize', this.resizeListener)
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
    this.brush.frustumCulled = false
    this.scene.add(this.brush)
  }

  setMovement() {
    this.time.on('tick.brush', () => {
      this.material.uniforms.uTime.value += 0.01
      this.paintedMaterials.forEach(material => material.uniforms.uTime.value += 0.01)

      if (store.state.audioInputMode === AUDIO_INPUT_MODES.VOICE) {
        const data = VoiceManager.getAudioData()
        this.paintedGeometries.forEach(geometry => {
          const values = []
          for (let i = 0; i < geometry.attributes.position.count; i++) {
            values.push(data[i % VoiceManager.bufferSize])
          }
          geometry.setAttribute(
            'audioData',
            new BufferAttribute(new Float32Array(values), 1)
          )
        })
      }

      if (store.state.cursorMode === CURSOR_MODES.BRUSH) {
        if (this.mouse.targeted === this.canvas && this.material.uniforms.uOpacity.value < 1) {
          const value = this.material.uniforms.uOpacity.value + 0.06
          this.material.uniforms.uOpacity.value = Math.min(value, 1)
        } else if (this.mouse.targeted !== this.canvas && this.material.uniforms.uOpacity.value > 0) {
          const value = this.material.uniforms.uOpacity.value - 0.03
          this.material.uniforms.uOpacity.value = Math.max(value, 0)
        }

        const cursor = new Vector2(this.mouse.cursor[0], this.mouse.cursor[1])
        this.raycaster.setFromCamera(cursor, this.camera.camera)

        const intersection = this.raycaster.intersectObject(this.camera.raycasterPlane)

        if (intersection[0]) {
          const position = intersection[0].point
          const currentPositions = []
          this.brushPositions = this.brushPositions.length % this.params.count * 3 === 0
            ? this.brushPositions.slice((-this.params.count * 3 * BRUSH_LAST_POSITIONS))
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
        if (this.material.uniforms.uOpacity.value > 0) {
          const value = this.material.uniforms.uOpacity.value - 0.03
          this.material.uniforms.uOpacity.value = Math.max(value, 0)
        } else {
          this.brushPositions = []
          this.brushGeometry.setAttribute(
            'position',
            new BufferAttribute(new Float32Array(), 3)
          )
        }
      }
    })
  }

  listenMouseDown() {
    this.mouseDownListener = () => {
      if (this.mouse.targeted === this.canvas && store.state.cursorMode === CURSOR_MODES.BRUSH) {
        this.isPainting = true
        this.paintingGeometry = new BufferGeometry()
        this.paintingPositions = []

        this.painting = new Points(this.paintingGeometry, this.material)
        this.painting.frustumCulled = false
        this.container.add(this.painting)
      }
    }
    this.mouse.on('down', this.mouseDownListener)
  }

  listenMouseUp() {
    this.mouseUpListener = () => {
      if (this.isPainting === true && store.state.cursorMode === CURSOR_MODES.BRUSH) {
        this.isPainting = false
        this.paintedMaterials.push(this.material)
        this.paintedGeometries.push(this.paintingGeometry)
        this.material = new ShaderMaterial({
          ...configShaderMaterial,
          uniforms:
          {
            uParticleSize: { value: store.state.brush.particleSize * this.pixelRatio },
            uSize: { value: store.state.brush.size },
            uTime: { value: 0. },
            uColor: { value: this.getColorInGradient() },
            uOpacity: { value: 1. },
            uBeat: { value: 0. }
          },
        })
        this.brush.material = this.material
      }
    }
    this.mouse.on('up', this.mouseUpListener)
  }

  firstRender () {
    const sizePosition = this.getThumbPosition(0, 0.5, store.state.brush.size)
    const paletteSize = Math.floor(0.1 * window.innerHeight)

    htmlUtils.renderToDOM(this.element, template, {
      count: store.state.brush.count,
      paletteSize,
      particleSize: store.state.brush.particleSize,
      brushColorTop: store.state.brush.color[1],
      brushColorLeft: store.state.brush.color[0],
      sizePositionTop: sizePosition[1],
      sizePositionLeft: sizePosition[0],
     })

    this.createPalette(paletteSize)
    this.renderBrushPreview()

    this.element.querySelectorAll('.circleRange').forEach((range) => {
      const param = range.id
      const min = parseFloat(range.getAttribute('data-min'))
      const max = parseFloat(range.getAttribute('data-max'))
      const isRounded = range.getAttribute('data-round') === 'true'

      range.addEventListener('mousedown', (event: Event) => {
        const thumb = range.querySelector('.rangeThumb')
        const circleBox = range.getBoundingClientRect()
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
        const thumb = range.querySelector('.rangeThumb')
        const circleBox = range.getBoundingClientRect()
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

    this.element.querySelectorAll('.paramsGroup input').forEach((input: HTMLInputElement) => {
      const param = input.getAttribute('name')
      const type = input.getAttribute('type')

      if (type === 'range') {
        input.addEventListener('input', () => {
          const value = parseFloat(input.value)
          this.params[param] = value
          this.updateParam(param)
        })

        input.addEventListener('change', () => {
          const value = parseFloat(input.value)
          store.dispatch('updateBrushParams', { param, value })
        })
      }
    })
  }


  render () {
    if (store.state.cursorMode === CURSOR_MODES.BRUSH) {
      this.element.classList.add('visible')
    } else {
      this.element.classList.remove('visible')
    }

    if (store.state.audioInputMode !== AUDIO_INPUT_MODES.VOICE) {
      this.paintedGeometries.forEach(geometry => {
        geometry.setAttribute(
          'audioData',
          new BufferAttribute(new Float32Array(Array(geometry.attributes.position.count).fill(0)), 1)
        )
      })
    }
  }

  resizePalette () {
    const paletteSize = Math.floor(0.1 * window.innerHeight)
    this.createPalette(paletteSize)
  }

  createPalette(paletteSize) {
    const colorCanvas = this.element.querySelector('#colorPalette') as HTMLCanvasElement
    const colorRange = this.element.querySelector('.colorRange') as HTMLElement
    colorRange.style.width = paletteSize
    colorRange.style.height = paletteSize
    colorCanvas.width = paletteSize
    colorCanvas.height = paletteSize

    const ctx = colorCanvas.getContext("2d")
    ctx.clearRect(0, 0, paletteSize, paletteSize)
    ctx.beginPath()
    ctx.arc(paletteSize / 2, paletteSize / 2, paletteSize / 2, 0, 2 * Math.PI, false)

    ctx.fillStyle = `rgb(${toRGB(BRUSH_PALETTE_COLORS[LIST_MOODS_PALETTE[0]]).join(',')})`
    ctx.fill()

    BRUSH_PALETTE_ANGLES.forEach((angle, i) => {
      const x = (Math.cos(angle) * 0.5 + 0.5) * paletteSize
      const y = (- Math.sin(angle) * 0.5 + 0.5) * paletteSize
      const endX = (Math.cos(angle + Math.PI) * 0.5 + 0.5) * paletteSize
      const endY = (- Math.sin(angle + Math.PI) * 0.5 + 0.5) * paletteSize
      const grd = ctx.createLinearGradient(x, y, endX, endY)
      grd.addColorStop(0, `rgba(${toRGB(BRUSH_PALETTE_COLORS[LIST_MOODS_PALETTE[i + 1]]).join(',')}, 1)`)
      grd.addColorStop(0.45, `rgba(${toRGB(BRUSH_PALETTE_COLORS[LIST_MOODS_PALETTE[i + 1]]).join(',')}, 0)`)
      ctx.fillStyle = grd
      ctx.fill()
    })

    this.palette = ctx.getImageData(0, 0, paletteSize, paletteSize)
  }

  getBrushPreviewParam(param, i, value?) {
    if (param === 'size') {
      const randomAngle = random(i * i) * Math.PI * 2
      const randomDist = random(i * i + 1)
      const x = Math.cos(randomAngle) * randomDist
      const y = Math.sin(randomAngle) * randomDist
      return [50 - ((x * this.params.size) * 100), 50 - ((y * this.params.size) * 100)]
    }

    if (param === 'particleSize') {
      return Math.max(this.params.particleSize * 0.1  * (1 + (random(i * 2) - 0.3)), 0.5)
    }

    if (param === 'color') {
      const transparency = i <= this.params.count * 3 ? 1 - random(i * 8) * 0.7 : 0
      return `rgba(${value.r * 255}, ${value.g * 255}, ${value.b * 255}, ${transparency})`
    }
  }

  renderBrushPreview() {
    const brushPreviewSvg = this.element.querySelector('.brushPreview svg') as HTMLElement
    const color = this.getColorInGradient()

    brushPreviewSvg.innerHTML = ''
    for (let i = 0; i < 50 * 3; i++) {
      const [x, y] = this.getBrushPreviewParam('size', i) as number[]
      brushPreviewSvg.innerHTML += `
        <circle
          cx="${x}"
          cy="${y}"
          r="${this.getBrushPreviewParam('particleSize', i)}"
          style="fill: ${this.getBrushPreviewParam('color', i, color)};"/>
      `
    }
    this.brushPreview = brushPreviewSvg.querySelectorAll('circle')
  }

  updateRange(event, param, thumb, center, min, max, isRounded, angleDecal) {
    const value = this.getParamValue(event, center, min, max, isRounded, angleDecal)
    const position = this.getThumbPosition(min, max, value)

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

  updateColorRange(event, param, thumb, center, radius) {
    const position = this.getColorValue(event, center, radius)

    thumb.style.left = `${position[0]}%`
    thumb.style.top = `${position[1]}%`

    this.params[param] = position
    this.updateParam(param)
  }

  getColorValue(event, center, radius) {
    const position = [event.clientX, event.clientY]
    const angle = Math.atan2(position[0] - center[0], position[1] - center[1])
    const borderX = Math.abs(Math.sin(angle) * radius)
    const borderY = Math.abs(Math.cos(angle) * radius)

    const clampedX = Math.max(Math.min(position[0] - center[0], borderX), -borderX)
    const clampedY = Math.max(Math.min(center[1] - position[1], borderY), -borderY)

    const x = ((clampedX / radius) * 0.5 + 0.5) * 100
    const y = (- (clampedY / radius) * 0.5 + 0.5) * 100

    return [x, y]
  }

  updateParam(param) {
    if (param === 'count') {
      this.particlesOffset = []
      for (let i = 0; i < this.params.count; i++) {
          this.particlesOffset.push(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
          )
      }
      const color = this.getColorInGradient()
      this.brushPreview.forEach((elem, i) => {
        elem.style.fill = this.getBrushPreviewParam('color', i, color) as string
      })

      return this.particlesOffset
    }

    if (param ==='particleSize') {
      this.brushPreview.forEach((elem, i) => {
        elem.setAttribute('r', `${this.getBrushPreviewParam('particleSize', i)}`)
      })

      return this.material.uniforms.uParticleSize.value = this.params.particleSize * this.pixelRatio
    }

    if (param === 'size') {
      this.brushPreview.forEach((elem, i) => {
        const [x, y] = this.getBrushPreviewParam('size', i) as number[]
        elem.setAttribute('cx', `${x}`)
        elem.setAttribute('cy', `${y}`)
      })
      return this.material.uniforms.uSize.value = this.params.size
    }

    if (param === 'color') {
      const color = this.getColorInGradient()

      this.brushPreview.forEach((elem, i) => {
        elem.style.fill = this.getBrushPreviewParam('color', i, color) as string
      })

      return this.material.uniforms.uColor.value = color
    }

    return
  }

  getColorInGradient() {
    const [xPercent, yPercent] = this.params.color
    const size = this.palette.width

    const x = xPercent >= 50 ? Math.floor(xPercent / 100 * (size - 1)) : Math.ceil(xPercent / 100 * (size - 1))
    const y = yPercent >= 50 ? Math.floor(yPercent / 100 * (size - 1)) : Math.ceil(yPercent / 100 * (size - 1))
    const pixel = (y * (size * 4)) + (x * 4)

    const r = this.palette.data[pixel]
    const g = this.palette.data[pixel + 1]
    const b = this.palette.data[pixel + 2]

    return new Color(r / 255, g / 255, b / 255)
  }

  stop() {
    this.scene.remove(this.brush)

    this.element.innerHTML = ''
    this.mouse.off('up', this.mouseUpListener)
    this.mouse.off('down', this.mouseDownListener)
    window.removeEventListener('resize', this.resizeListener)

    this.render = () => {}
    this.stopped = true

    if (store.state.cursorMode === CURSOR_MODES.BRUSH) {
      store.dispatch('chooseCursor', CURSOR_MODES.DEFAULT)
    }
  }

  setSpotifyMovement = () => {
    if (this.audioData.moving) return
    this.audioData.intensity = 0
    this.audioData.moving = true
    const { tempo, loudness } = store.state.spotifyAudioData

    const PARAMS = {
      peakSpeed: 4,
      comebackSpeed: 0.4
    }

    this.time.on('tick', () => {
      if (this.audioData.peak) this.audioData.intensity += 0.05 * (loudness+40)
      if (this.audioData.intensity > 0) this.audioData.intensity -= PARAMS.comebackSpeed
      this.paintedMaterials.forEach(material => material.uniforms.uBeat.value = this.audioData.intensity/10.)
    })

    const bps = 1/ (tempo / 60) *1000
    setTimeout(() => {
      setInterval(() => {
        this.audioData.peak = true
        setTimeout(() => {
          this.audioData.peak = false
        }, this.time.delta * PARAMS.peakSpeed)
      }, bps)
    }, 1000)

    if (this.debug) {
      const folder = this.debug.addFolder('Beat deformation')
      folder.add(PARAMS.peakSpeed)
      folder.add(PARAMS.comebackSpeed)
    }

  }
}