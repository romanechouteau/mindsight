import { Object3D, Points, ShaderMaterial, BufferAttribute, WebGLRenderer } from 'three'
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
    const count = this.characterGeometry.attributes.position.count

    const scales = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      scales[i] = Math.random()
    }

    this.characterGeometry.setAttribute('aScale', new BufferAttribute(scales, 1))

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
    })
  }
}
