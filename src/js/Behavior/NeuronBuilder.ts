import { Group, Mesh, ShaderMaterial, Object3D, Vector3, Color, Points, BufferGeometry } from "three"
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

// @ts-ignore
import Time from '@tools/Time'
// @ts-ignore
import neuronSrc from '@models/branche.glb'
// @ts-ignore
import neuronVert from '@shaders/neuronvert.glsl'
// @ts-ignore
import neuronFrag from '@shaders/neuronfrag.glsl'

const loader = new GLTFLoader()

class NeuronBuilder {
    time: Time
    ground: Object3D
    container: Group
    pixelRatio: number
    neuronGeometry: BufferGeometry
    neuronMaterial: ShaderMaterial
    constructor() {
        // TODO: wait for app mount
        setTimeout(() => {
            this.ground = App.scene.getObjectByName('Ground')
            this.container = new Group()
            this.container.name = 'NeuronContainer'

            this.time = App.time
            this.pixelRatio = App.renderer.getPixelRatio()

            this.setGeometry()

            App.scene.add(this.container)
            this.setMovement()
            this.removeNeurons = this.removeNeurons.bind(this)
        }, 50);
    }

    async setGeometry() {
        const model = (await loader.loadAsync(neuronSrc))
        const neuronModel = <Mesh> model.scene.children[0]

        this.neuronGeometry = neuronModel.geometry
        this.neuronGeometry.scale(neuronModel.scale.x, neuronModel.scale.y, neuronModel.scale.z)
        this.neuronGeometry.rotateX(neuronModel.rotation.x)
        this.neuronGeometry.rotateY(neuronModel.rotation.y)
        this.neuronGeometry.rotateZ(neuronModel.rotation.z)
        this.neuronGeometry.translate(neuronModel.position.x, neuronModel.position.y + 1, neuronModel.position.z)
    }

    spawnNeuron(position: Vector3){
        const oldNeurons = [...this.container.children]
        this.neuronMaterial = new ShaderMaterial({
            depthWrite: false,
            vertexColors: true,
            transparent: true,
            uniforms:
            {
              uSize: { value:  6. * this.pixelRatio },
              uTime: { value: 0. },
              uColor: { value: new Color(0xffffff) }
            },
            vertexShader: neuronVert,
            fragmentShader: neuronFrag
          })

        for (let i = 1; i <= 3; i++) {
            const neuron = new Points(this.neuronGeometry, this.neuronMaterial)
            neuron.scale.set(0.3, 0.3, 0.3)

            const x = position.x + Math.cos(Math.PI * 2 * i / 3) * 2
            const z = position.z + Math.sin(Math.PI * 2 * i / 3) * 2
            neuron.position.set(x, position.y, z)

            this.container.add(neuron)
        }

        return oldNeurons
    }

    setMovement() {
        this.time.on('tick', () => {
            if (this.neuronMaterial) {
                this.neuronMaterial.uniforms.uTime.value += 0.005
            }
        })
    }

    removeNeurons(neurons) {
        this.container.remove(...neurons)
    }
}

const instance = new NeuronBuilder()
export default instance