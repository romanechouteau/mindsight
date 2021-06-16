uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColorSpecial1;
uniform vec3 uColorSpecial2;

varying vec2 vUv;
varying float vSpecial;
varying float vVisible;

#include <fog_pars_fragment>

void main()
{
    float stepSpecial = step(0.1, vSpecial);
    vec3 colorBottom = mix(uColor1, uColorSpecial1, stepSpecial);
    vec3 colorTop = mix(uColor2, uColorSpecial2, stepSpecial);
    vec3 finalColor = mix(colorTop, colorBottom, vUv.y);

    float opacity = mix(0., 1., vVisible + vUv.y * vVisible);
    if (opacity < 0.5) {
        discard;
    }

    gl_FragColor = vec4(finalColor, 1.);
    #include <fog_fragment>
}