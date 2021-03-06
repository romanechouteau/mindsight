#include <morphtarget_pars_vertex>

varying vec2 vUv;

#include <fog_pars_vertex>

void main() {
   #include <begin_vertex>
   #include <morphtarget_vertex>
   vUv = uv;
   vUv.y = 1. - vUv.y; 
   gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed.xyz, 1.);

   vec4 modelPosition = modelMatrix * vec4(position, 1.0);
   vec4 mvPosition = viewMatrix * modelPosition;
   #include <fog_vertex>
}
