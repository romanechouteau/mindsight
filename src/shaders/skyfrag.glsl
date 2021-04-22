uniform int uFirstColorTop;
uniform int uSecondColorTop;
uniform int uFirstColorBottom;
uniform int uSecondColorBottom;
uniform float uPercentage;

varying vec2 vUv;

vec3 toRGB(int color) {
   float r = float((color / 256 / 256) % 256) / 255.;
   float g = float((color / 256) % 256) / 255.;
   float b = float((color) % 256) / 255.;

   return vec3(r, g, b);
}

void main() {
   vec3 colorTop = toRGB(uFirstColorTop);
   vec3 colorBottom = toRGB(uFirstColorBottom);
   vec3 colorTop2 = toRGB(uSecondColorTop);
   vec3 colorBottom2 = toRGB(uSecondColorBottom);

   vec3 firstGradient = mix(colorBottom, colorTop, vUv.y);
   vec3 secondGradient = mix(colorBottom2, colorTop2, vUv.y);
   vec3 finalColor = mix(firstGradient, secondGradient, uPercentage);

   gl_FragColor = vec4(finalColor, 1.);
}
