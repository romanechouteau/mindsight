import { Group, Mesh, Object3D } from "three"

// @ts-ignore
import shape3Src from '@models/testShape1.glb'
// @ts-ignore
import shape4Src from '@models/testShape2.glb'
// @ts-ignore
import shape1Src from '@models/Rond.gltf'
// @ts-ignore
import shape2Src from '@models/Triangle.gltf'
import { modelLoader } from '../../Tools/utils'
import { SHAPE_NUMBER, WORLDBUILDER_PRECISION } from "../../constants"

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
        this.container.name = 'World Shapes'
        this.shapes =
            (await Promise.all([
                modelLoader.loadAsync(shape1Src),
                modelLoader.loadAsync(shape2Src),
                modelLoader.loadAsync(shape3Src),
                modelLoader.loadAsync(shape4Src),
            ]))
            .map(gltf => gltf.scene)

        this.mainShape = this.shapes[0]
        const { geometry, material } = (this.mainShape.children as Mesh[]).find(child => child.isMesh)
        // create clones
        for (let i = 0; i < SHAPE_NUMBER; i++) {
            const mesh = new Mesh(geometry, material)
            mesh.position.x = (Math.random() - 0.5) * 15
            mesh.position.z = (Math.random() - 1) * 15
            this.container.add(mesh)
        }
        this.container.add(this.mainShape)
        this.scene.add(this.container)
        this.prepareMorph()
        this.prepareClonesMorph()
    }

    prepareMorph(mesh?: Mesh) {
        const shapeMesh = mesh ?? (this.container.getObjectByName('Cube002') as Mesh)
        delete shapeMesh.geometry.morphAttributes.normal
    }

    prepareClonesMorph() {
        this.container.traverse(child => {
            if ((child as Mesh).isMesh) this.prepareMorph(child as Mesh)
        })
    }

    handleChange(value: number) {
        const shapeMesh = (this.container.getObjectByName('Cube002') as Mesh)
        const [ firstShapeIndex, secondShapeIndex ] = [ Math.floor(value/WORLDBUILDER_PRECISION) % this.shapes.length, (Math.floor(value/WORLDBUILDER_PRECISION) + 1) % this.shapes.length ]
        shapeMesh.morphTargetInfluences[firstShapeIndex] = 1 - ((value%WORLDBUILDER_PRECISION)/WORLDBUILDER_PRECISION)
    }
}