import { CylinderBufferGeometry, Group, Mesh, MeshBasicMaterial, Object3D, Vector3 } from "three"

class NeuronBuilder {
    ground: Object3D
    container: Group
    constructor() {
        // TODO: wait for app mount
        setTimeout(() => {
            this.ground = App.scene.getObjectByName('Ground')
            this.container = new Group()
            this.container.name = 'NeuronContainer'
            App.scene.add(this.container)
        }, 100);
    }

    spawnNeuron(position: Vector3){
        const neuronGeometry = new CylinderBufferGeometry(1, 1, 10, 32)
        const neuronMaterial = new MeshBasicMaterial( {color: 0xffff00} )
        const neuron = new Mesh(neuronGeometry, neuronMaterial)
        neuron.translateX(position.x + (Math.random() - 0.5) * 3)
        neuron.translateY(position.y)
        neuron.translateZ(position.z + (Math.random() - 0.5) * 3)
        this.container.add(neuron)
    }
}

const instance = new NeuronBuilder()
export default instance