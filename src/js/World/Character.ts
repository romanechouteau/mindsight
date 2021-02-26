import { Object3D, Points, ShaderMaterial, BufferAttribute, WebGLRenderer, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
// @ts-ignore
import characterSrc from '@models/character.gltf'
// @ts-ignore
import characterVert from '@shaders/particles/vertex.glsl'
// @ts-ignore
import characterFrag from '@shaders/particles/fragment.glsl'

const loader = new GLTFLoader()

export default class Character {
  time: any
  renderer: WebGLRenderer
  assets: any
  container: Object3D
  characterGeometry: any
  character: any
  characterMaterial: ShaderMaterial
  initialPositions: Float32Array
  count: number
  constructor(options) {
    // Options
    this.time = options.time
    this.assets = options.assets
    this.renderer = options.renderer

    // Set up
    this.container = new Object3D()
    this.container.name = 'Character'

    this.init()
  }
  async init() {
    await this.createCharacter()
    this.setMovement()
  }
  async createCharacter() {
    // Geometry
    const model = (await loader.loadAsync(characterSrc)).scene
    // @ts-ignore
    this.characterGeometry = model.children[0].children[1].geometry
    this.count = this.characterGeometry.attributes.position.count
    this.initialPositions = this.characterGeometry.attributes.position.array

    const scales = new Float32Array(this.count)
    const positions = new Float32Array(this.count * 3)

    for (let i = 0; i < this.count; i++) {
      scales[i] = Math.random()

      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * 500
      positions[i3 + 1] = (Math.random() - 0.5) * 500
      positions[i3 + 2] = (Math.random() - 0.5) * 500
    }

    this.characterGeometry.setAttribute('aScale', new BufferAttribute(scales, 1))
    this.characterGeometry.setAttribute('position', new BufferAttribute(positions, 3))

    // Material
    this.characterMaterial = new ShaderMaterial({
      depthWrite: false,
      vertexColors: true,
      transparent: true,
      uniforms:
      {
        uSize: { value: 6.0 * this.renderer.getPixelRatio() },
        uTime: { value: 0. }
      },
      vertexShader: characterVert,
      fragmentShader: characterFrag
    })

    // Object
    this.character = new Points(this.characterGeometry, this.characterMaterial)
    this.character.scale.x = 0.02
    this.character.scale.y = 0.02
    this.character.scale.z = 0.02

    this.container.add(this.character)
  }

  setMovement() {
    this.time.on('tick', () => {
      const elapsedTime = this.time.elapsed * 0.001
      this.characterMaterial.uniforms.uTime.value = elapsedTime

      if (elapsedTime > 5) {
        for (let i = 0; i < this.count; i++) {
          const i3 = i * 3
          const position = this.characterGeometry.attributes.position.array
          const actualPosition = new Vector3(position[i3], position[i3 + 1], position[i3 + 2])
          const targetPosition = new Vector3(this.initialPositions[i3], this.initialPositions[i3 + 1], this.initialPositions[i3 + 2])
          const newPosition = actualPosition.lerp(targetPosition, Math.random() * 0.1)
          this.characterGeometry.attributes.position.array[i3] = newPosition.x
          this.characterGeometry.attributes.position.array[i3 + 1] = newPosition.y
          this.characterGeometry.attributes.position.array[i3 + 2] = newPosition.z
        }

        this.characterGeometry.attributes.position.needsUpdate = true
      }
    })
  }
}
