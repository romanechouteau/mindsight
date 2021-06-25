// precision highp float;
uniform sampler2D map1;
uniform sampler2D map2;
uniform sampler2D map3;
uniform sampler2D map4;
uniform vec4 values;

varying vec2 vUv;

#include <fog_pars_fragment>

void main() {

    vec3 color = (
        texture2D(map1, vUv).xyz * values.x + 
        texture2D(map2, vUv).xyz * values.y +
        texture2D(map3, vUv).xyz * values.z +
        texture2D(map4, vUv).xyz * values.w
    );
    gl_FragColor = vec4(color, 1.);
    #include <fog_fragment>
}
