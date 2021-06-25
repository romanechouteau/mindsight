#include <morphtarget_pars_vertex>

varying vec2 vUv;

#include <fog_pars_vertex>

void main() {
   #include <begin_vertex>
   #include <morphtarget_vertex>
   vUv = uv;
   vUv.y = 1. - vUv.y; 
   gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed.xyz, 1.);

   #include <fog_vertex>
}
