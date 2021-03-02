import { Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera, PlaneGeometry } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

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
  }
  setCamera() {
    // Create camera
    this.camera = new PerspectiveCamera(
      75,
      this.sizes.viewport.width / this.sizes.viewport.height,
      0.1,
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
    this.camera.position.y = 1
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
      color: "#00FF00"
    })
    this.raycasterPlane = new Mesh(geometry, material)
    this.raycasterPlane.rotation.x = rotation.x
    this.raycasterPlane.rotation.y = rotation.y
    this.raycasterPlane.rotation.z = rotation.z
    this.container.add(this.raycasterPlane)
  }
}
