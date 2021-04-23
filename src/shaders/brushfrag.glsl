uniform vec3 uColor;
uniform float uTime;
uniform float uOpacity;

varying float randomized;

float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main()
{
    float strength = distance(gl_PointCoord, vec2(0.5));
    float colorStep = smoothstep(0.3, 0.5, strength);
    vec4 finalColor = mix(vec4(uColor, 1.), vec4(uColor, 0.), colorStep);

    gl_FragColor = finalColor;
}