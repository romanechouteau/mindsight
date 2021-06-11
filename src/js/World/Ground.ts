import { Object3D, Mesh, MeshBasicMaterial, DoubleSide, Group, BoxBufferGeometry, MeshNormalMaterial, Vector3, ShaderMaterial, MeshLambertMaterial } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
// @ts-ignore
import reliefSrc from '@models/mapTest.glb'
// @ts-ignore
import groundSrc from '@models/sol__.glb'

const loader = new GLTFLoader()

export default class Ground {
  time: any
  assets: any
  container: Object3D
  ground: Object3D
  relief: Object3D
  // fakeGround: Object3D
  groundDeco: Group
  constructor(options) {
    // Options
    this.time = options.time
    this.assets = options.assets

    // Set up
    this.container = new Object3D()
    this.container.name = 'Ground'

    this.createGround()
  }

  async createGround() {
    this.relief = (await loader.loadAsync(reliefSrc)).scene
    this.ground = (await loader.loadAsync(groundSrc)).scene
    this.ground.visible = false
    this.relief.scale.set(0.01, 0.01, 0.01)
    this.relief.rotation.y = Math.PI
    this.relief.position.z = 10
    this.relief.name = 'relief'
    // this.relief.getObjectByName('Plane').material = new MeshLambertMaterial({ emissive: 0x123fff })
    // this.relief.getObjectByName('Plane').material = new ShaderMaterial({
    //   vertexShader: `
    //     varying vec3 vPosition;

    //     void main() {
    //       vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    //       vPosition = modelPosition.xyz;

    //       vec4 viewPosition = viewMatrix * modelPosition;
    //       vec4 projectedPosition = projectionMatrix * viewPosition;
    //       gl_Position = projectedPosition;
    //     }
    //   `,
    //   fragmentShader: `
    //   varying vec3 vPosition;

    //   void main()
    //   {
    //       gl_FragColor = vec4(vec3(vPosition.y), 1.);
    //   }
    //   `
    // })
    // this.fakeGround = this.ground.clone(true)
    // this.fakeGround.children.forEach(mesh => (mesh as Mesh).material = new MeshBasicMaterial({ opacity: 0, side: DoubleSide }))
    // this.container.add(this.fakeGround)
    this.container.add(this.relief)
    this.container.add(this.ground)

    // this.relief.getObjectByName('Sol').visible = false
    // geometryModifier.subdividePlane((this.relief.getObjectByName('Sol') as Mesh), 1024)
  }

  // not needed anymore
  // generateDeco(basePoint: Vector3) {
  //   const decoGeometry = new BoxBufferGeometry(1, 1, 1)
  //   const decoMaterial = new MeshNormalMaterial()
  //   const deco = new Mesh(decoGeometry, decoMaterial)

  //   deco.translateX(basePoint.x + Math.random() * 2)
  //   deco.translateZ(basePoint.z + Math.random() * 2)
  // }
}
