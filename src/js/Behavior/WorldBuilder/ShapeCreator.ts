import { Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, Object3D, Scene, Vector3 } from "three"
import shape1Src from '@models/testShape1.glb'
import shape2Src from '@models/testShape2.glb'
import shape3Src from '@models/Rond.gltf'
import shape4Src from '@models/Triangle.gltf'
import { modelLoader } from '../../Tools/utils';
import { WORLDBUILDER_PRECISION } from "../../constants";

interface ShapeCreatorParams {
    scene: Object3D
}

export default class ShapeCreator {

    mainShape: Object3D
    container: Group
    scene: Object3D
    shapes: Object3D[]
    constructor({ scene }: ShapeCreatorParams) {
        this.scene = scene
        this.handleChange = this.handleChange.bind(this)
        this.init = this.init.bind(this)
        this.init()
    }

    async init () {
        this.container = new Group()
        this.shapes = 
        (await Promise.all([ 
            modelLoader.loadAsync(shape1Src),
            modelLoader.loadAsync(shape2Src),
            modelLoader.loadAsync(shape3Src),
            modelLoader.loadAsync(shape4Src),
         ]))
         .map(gltf => gltf.scene)
        this.mainShape = this.shapes[0]
        this.container.add(this.mainShape)
        this.scene.add(this.container)
        this.prepareMorph()
    }

    async prepareMorph() {
        const shapeMesh = (this.container.getObjectByName('Cube') as Mesh)
        shapeMesh.geometry.morphAttributes.position = []
        ;(shapeMesh.material as MeshStandardMaterial).morphTargets = true;
        for (const [index, shape] of Object.entries(this.shapes)) {
            const geometry = (shape.children as Mesh[]).find(child => child.isMesh).geometry
            shapeMesh.geometry.morphAttributes.position[ parseInt(index) ] = geometry.attributes.position.clone()
        }
        shapeMesh.updateMorphTargets()
    }

    handleChange(e) {
        const value = parseInt(e.target.value)
        const shapeMesh = (this.container.getObjectByName('Cube') as Mesh)
        const [ firstShapeIndex, secondShapeIndex ] = [ Math.floor(value/WORLDBUILDER_PRECISION) % this.shapes.length, (Math.floor(value/WORLDBUILDER_PRECISION) + 1) % this.shapes.length ]
        shapeMesh.morphTargetInfluences[firstShapeIndex] = 1 - ((value%WORLDBUILDER_PRECISION)/WORLDBUILDER_PRECISION)
        shapeMesh.morphTargetInfluences[secondShapeIndex] = (value%WORLDBUILDER_PRECISION)/WORLDBUILDER_PRECISION
    }
}