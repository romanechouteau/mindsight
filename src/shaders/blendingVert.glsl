// precision highp float;

// attribute vec3 position;
// attribute vec2 uv;

 
 #include <morphtarget_pars_vertex>

varying vec2 vUv;

void main() {
   #include <begin_vertex>
   #include <morphtarget_vertex>
   vUv = uv;

   // vec2 center = vec2(0.5, 0.5);
   // float rotation = 3.14/2.; // in rad
   // float c = cos(rotation);
   // float s = sin(rotation);

   //  // apply rotation
   //  vUv = (vec3(vUv, 1) * mat3(
   //      	1. * c, 1. * s, - 1. * ( c * center.x + s * center.y ) + center.x + 0.,
	// 		- 1. * s, 1. * c, - 1. * ( - s * center.x + c * center.y ) + center.y + 0.,
	// 		0., 0., 1.
   //   )).xy;
     vUv.y = 1. - vUv.y; 
   gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed.xyz, 1.);
}
