import { Object3D, Points, ShaderMaterial, WebGLRenderer, Color, AnimationMixer, AnimationClip } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

// @ts-ignore
import Time from '@tools/Time'
// @ts-ignore
import characterSrc from '@models/character.gltf'
// @ts-ignore
import characterVert from '@shaders/charactervert.glsl'
// @ts-ignore
import characterFrag from '@shaders/characterfrag.glsl'

const loader = new GLTFLoader()

export default class Character {
  time: any
  mixer: AnimationMixer
  renderer: WebGLRenderer
  geometry: any
  material: ShaderMaterial
  container: Object3D
  character: any
  pixelRatio: number
  constructor(options: { time: Time, pixelRatio: number }) {
    const { time, pixelRatio } = options
    this.time = time
    this.pixelRatio = pixelRatio

    this.container = new Object3D()
    this.container.name = 'Character'

    this.init()
  }

  async init() {
    await this.createCharacter()
    this.setMovement()
  }

  async createCharacter() {
    const model = (await loader.loadAsync(characterSrc))
    const modelCharacter = model.scene.children[0].children[1]
    const skeleton = model.scene.children[0].children[0]

    // @ts-ignore
    this.geometry = modelCharacter.geometry
    this.material = new ShaderMaterial({
      depthWrite: false,
      vertexColors: true,
      transparent: true,
      skinning: true,
      uniforms:
      {
        uSize: { value: 6.0 * this.pixelRatio },
        uTime: { value: 0. },
        uColor: { value: new Color(0xffffff) }
      },
      vertexShader: characterVert,
      fragmentShader: characterFrag
    })

    this.character = new Points(this.geometry, this.material)
    this.setCharacterProperties(modelCharacter)

    this.container.add(skeleton, this.character)
    this.container.scale.x = 0.02
    this.container.scale.y = 0.02
    this.container.scale.z = 0.02

    this.setCharacterAnimation(model.animations)
  }

  setCharacterProperties(skinnedMesh) {
    // @ts-ignore
    this.character.skeleton = skinnedMesh.skeleton
    // @ts-ignore
    this.character.bindMatrix = skinnedMesh.bindMatrix
    // @ts-ignore
    this.character.bindMatrixInverse = skinnedMesh.bindMatrixInverse
    // @ts-ignore
    this.character.bindMode = skinnedMesh.bindMode
    this.character.name = skinnedMesh.name
    this.character.parent = skinnedMesh.parent
    this.character.uuid = skinnedMesh.uuid
    this.character.type = skinnedMesh.type
    this.character.isSkinnedMesh = true
    // @ts-ignore
    this.character.bind = skinnedMesh.bind
    this.character.clone = skinnedMesh.clone
    // @ts-ignore
    this.character.initBones = skinnedMesh.initBones
    // @ts-ignore
    this.character.normalizeSkinWeights = skinnedMesh.normalizeSkinWeights
    // @ts-ignore
    this.character.pose = skinnedMesh.pose
    this.character.updateMatrixWorld = skinnedMesh.updateMatrixWorld
  }

  setCharacterAnimation(animations) {
    this.mixer = new AnimationMixer(this.container)
    const clip = AnimationClip.findByName( animations, 'mixamo.com' )
    const action = this.mixer.clipAction(clip)
    action.play()
  }

  setMovement() {
    this.time.on('tick', () => {
        this.material.uniforms.uTime.value += 0.01
        this.mixer.update(this.time.delta * 0.0002)
    })
  }
}