// precision highp float;
uniform sampler2D map1;
uniform sampler2D map2;
uniform sampler2D map3;
uniform sampler2D map4;
uniform vec4 values;
uniform float uPercentage;
uniform float uEnvInfluence;
uniform float uEnvPercentage;
uniform vec2 uEnvSky1;
uniform vec2 uEnvSky2;
uniform vec2 uSky1;
uniform vec2 uSky2;
uniform vec2 uSky3;
uniform vec2 uSky4;
uniform float uSkyInfluence;

varying vec2 vUv;

#include <fog_pars_fragment>

vec3 toRGB(int color) {
   float r = float((color / 256 / 256) % 256) / 255.;
   float g = float((color / 256) % 256) / 255.;
   float b = float((color) % 256) / 255.;

   return vec3(r, g, b);
}

float getWeight (float percentage, float peak) {
  return max(1. - abs(peak - percentage), 0.);
}

vec3 mixSky (float percentage, int color1, int color2, int color3, int color4) {
  return toRGB(color1) * getWeight(percentage, 0.)
   + toRGB(color2) * getWeight(percentage, 1.)
   + toRGB(color3) * getWeight(percentage, 2.)
   + toRGB(color4) * getWeight(percentage, 3.)
   + toRGB(color1) * getWeight(percentage, 4.);
}

vec3 mixSkyEnv (float percentage, int color1, int color2) {
  return toRGB(color1) * getWeight(percentage, 0.)
   + toRGB(color2) * getWeight(percentage, 1.);
}

void main() {
    vec3 colorBottomEnv = mixSkyEnv(uEnvPercentage, int(uEnvSky1.y), int(uEnvSky2.y));
    vec3 colorBottomBuilder = mixSky(uPercentage, int(uSky1.y), int(uSky2.y), int(uSky3.y), int(uSky4.y));
    vec3 skyColorMixed =  mix(colorBottomBuilder, colorBottomEnv, uEnvInfluence);
    // vec3 skyColorSmooth = mix(skyColorMixed, vec3(0., 0., 0.), 1. - uSkyInfluence);
    vec3 skyColorSmooth2 = mix(skyColorMixed, vec3(1., 1., 1.), 1. - uSkyInfluence);

    vec3 color = (
        texture2D(map1, vUv).xyz * values.x +
        texture2D(map2, vUv).xyz * values.y +
        texture2D(map3, vUv).xyz * values.z +
        texture2D(map4, vUv).xyz * values.w
    );


    // vec3 colorSmooth = mix(color, vec3(0., 0., 0.), uSkyInfluence);
    vec3 final = color * skyColorSmooth2;

    // vec3 final = mix(color, skyColorFinal, 0.2);
    gl_FragColor = vec4(final, 1.);
    #include <fog_fragment>
}
