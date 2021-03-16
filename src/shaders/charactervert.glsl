#include <skinning_pars_vertex>
uniform float uSize;
uniform float uTime;

float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
    #include <skinbase_vertex>
    #include <begin_vertex>
    #include <skinning_vertex>
    #include <project_vertex>

    float offset = rand(vec2(position.x, position.z));
    gl_Position.x += sin(uTime + offset * 5.) * 0.01;
    gl_Position.y += sin(uTime + offset * 6.) * 0.01;
    gl_Position.z += sin(uTime + offset * 7.) * 0.01;

    gl_PointSize = uSize;
    gl_PointSize *= (1.0 / - mvPosition.z);
}