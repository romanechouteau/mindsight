import { Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera, PlaneGeometry, Matrix4 } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import gsap from "gsap/all"

export default class Camera {
  sizes: any
  renderer: any
  debug: any
  container: Object3D
  camera: PerspectiveCamera
  orbitControls: OrbitControls
  debugFolder: any
  raycasterPlane: Mesh
  constructor(options) {
    // Set Options
    this.sizes = options.sizes
    this.renderer = options.renderer
    this.debug = options.debug

    // Set up
    this.container = new Object3D()
    this.container.name = 'Camera'

    this.setCamera()
    this.setPosition()
    this.setOrbitControls()
    this.setRaycasterPlane()
    this.moveIntro = this.moveIntro.bind(this)
  }
  setCamera() {
    // Create camera
    this.camera = new PerspectiveCamera(
      45,
      this.sizes.viewport.width / this.sizes.viewport.height,
      0.001,
      1000
    )
    this.container.add(this.camera)
    // Change camera aspect on resize
    this.sizes.on('resize', () => {
      this.camera.aspect =
        this.sizes.viewport.width / this.sizes.viewport.height
      // Call this method because of the above change
      this.camera.updateProjectionMatrix()
    })
  }
  setPosition() {
    // Set camera position
    this.camera.position.x = 0
    this.camera.position.y = 0.5
    this.camera.position.z = 5
  }
  setOrbitControls() {
    // Set orbit control
    this.orbitControls = new OrbitControls(
      this.camera,
      this.renderer.domElement
    )
    this.orbitControls.enabled = false
    this.orbitControls.enableKeys = true
    this.orbitControls.zoomSpeed = 1

    if (this.debug) {
      this.debugFolder = this.debug.addFolder('Camera')
      this.debugFolder.open()
      this.debugFolder
        .add(this.orbitControls, 'enabled')
        .name('Enable Orbit Control')
    }

    this.orbitControls.addEventListener('change', () => {
      const { rotation } = this.camera
      this.raycasterPlane.rotation.x = rotation.x
      this.raycasterPlane.rotation.y = rotation.y
      this.raycasterPlane.rotation.z = rotation.z
    })
  }

  setRaycasterPlane() {
    const { rotation } = this.camera

    const geometry = new PlaneGeometry(20, 20, 20)
    const material = new MeshBasicMaterial({
      depthWrite: false,
      depthTest: false,
      transparent: true,
      opacity: 0
    })
    geometry.applyMatrix4( new Matrix4().makeTranslation(-this.camera.position.x, -this.camera.position.y, -this.camera.position.z + 2) )
    this.raycasterPlane = new Mesh(geometry, material)
    this.raycasterPlane.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z)
    this.raycasterPlane.rotation.x = rotation.x
    this.raycasterPlane.rotation.y = rotation.y
    this.raycasterPlane.rotation.z = rotation.z
    this.container.add(this.raycasterPlane)
  }

  moveIntro() {
    const defaultY = this.camera.position.y
    const defaultZ = this.camera.position.z
    this.camera.position.y = 50
    this.camera.position.z = 500

    gsap.to(this.camera.position, {
      delay: 0.3,
      duration: 0.8,
      y: defaultY,
      z: defaultZ,
      ease: 'power3.inOut'
    })
  }
}
