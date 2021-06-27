// precision highp float;
uniform sampler2D map1;
uniform sampler2D map2;
uniform sampler2D map3;
uniform sampler2D map4;
uniform vec4 values;
uniform int uFirstColorBottom;
uniform int uSecondColorBottom;
uniform float uPercentage;
uniform float uSkyInfluence;

varying vec2 vUv;

vec3 toRGB(int color) {
   float r = float((color / 256 / 256) % 256) / 255.;
   float g = float((color / 256) % 256) / 255.;
   float b = float((color) % 256) / 255.;

   return vec3(r, g, b);
}

void main() {

    vec3 skyColor1 = toRGB(uFirstColorBottom);
    vec3 skyColor2 = toRGB(uSecondColorBottom);
    vec3 skyColorMixed = mix(skyColor1, skyColor2, uPercentage);
    vec3 skyColorSmooth = mix(skyColorMixed, vec3(0., 0., 0.), 1. - uSkyInfluence);

    vec3 color = (
        texture2D(map1, vUv).xyz * values.x + 
        texture2D(map2, vUv).xyz * values.y +
        texture2D(map3, vUv).xyz * values.z +
        texture2D(map4, vUv).xyz * values.w
    );

    vec3 colorSmooth = mix(color, vec3(0., 0., 0.), uSkyInfluence);
    vec3 final = colorSmooth + skyColorSmooth;

    // vec3 final = mix(color, skyColorFinal, 0.2);
    gl_FragColor = vec4(final, 1.);
}
