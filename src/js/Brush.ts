import { BufferAttribute, BufferGeometry, Points, PointsMaterial, Raycaster, Vector2 } from "three";

function onMouseMove( event ) {

	// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components

    
}

export default class Brush {
    raycaster: Raycaster;
    mouse: Vector2;

    geometry?: BufferGeometry;
    positionsArray: Float32Array;
    positions: number[]
    shouldPaint: boolean

    constructor (time) {
        console.log('brush mounted');
        
        this.raycaster = new Raycaster();
        this.mouse = new Vector2();
        
        window.addEventListener('mousemove', e => {
            this.mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
            this.mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
        })

        window.addEventListener('mousedown', this.initShape)
        window.addEventListener('mouseup', this.endShape);

        this.shouldPaint = false

        this.time = time

        this.time.on('tick', () => {            
            
            if (this.shouldPaint) this.drawShape()
        })
    }

    initShape = () => {
        console.log('draw');
        
        this.geometry = new BufferGeometry()
        // this.positionsArray = new Float32Array(1000)
        this.positions = []
        this.shouldPaint = true

        console.log(this.shouldPaint);
        
    }

    endShape () {
        this.geometry = new BufferGeometry()
        // this.positionsArray = new Float32Array(1000)
        this.positions = []
        this.shouldPaint = false
    }

    drawShape () {
        
        this.positions.push(this.mouse.x, this.mouse.y, 0)
        this.positionsArray = new Float32Array(this.positions)

        const positionsAttribute = new BufferAttribute(this.positionsArray, 3);
        this.geometry.setAttribute('position', positionsAttribute)

        const particlesMaterial = new PointsMaterial()
        particlesMaterial.size = 0.02
        particlesMaterial.sizeAttenuation = true

        const points = new Points(this.geometry, particlesMaterial);

        points.name = 'TEMPPOINTS';

        if ((App as any).scene.getObjectByName('TEMPPOINTS')) (App as any).scene.remove((App as any).scene.getObjectByName('TEMPPOINTS'));

        (App as any).scene.add(points);

        
    }


}