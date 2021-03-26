import { BufferAttribute, Mesh, PlaneBufferGeometry, Vector3 } from "three";

class GeometryModifier {
    constructor() {
        
    }

    /**
     * subdividePlane
     * add vertices to plane
     */
    public subdividePlane(plane: Mesh, subdivisions: number) {
        const sideDivisions = Math.sqrt(subdivisions)
        if (!Number.isInteger( sideDivisions )) throw new Error("Cannot subdivide with a non perfect-square number of subdivision") 
        
        const vertices: number[] = []
        for (let xIndex = 0; xIndex <= sideDivisions; xIndex++) {
            for (let zIndex = 0; zIndex <= sideDivisions; zIndex++) {
                vertices.push(xIndex/subdivisions, 0, zIndex/subdivisions)                
            }
        }

        plane.geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3))
    }
    
}

export const geometryModifier = new GeometryModifier()