uniform vec3 uColor;
uniform float uTime;
uniform float uOpacity;

varying float randomized;
varying float opacityLevel;

float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main()
{
    float strength = distance(gl_PointCoord, vec2(0.5));
    float stepColor = step(0.5, strength);

    float opacityEndStep = smoothstep(0.1, 1., opacityLevel);
    float opacityEnd = mix(clamp(uOpacity - (randomized * 0.8), 0., 1.), 0., opacityLevel);
    float opacityStartStep = smoothstep(0., 0.1, opacityLevel);
    float opacity = mix(0., opacityEnd, opacityStartStep);

    vec4 finalColor = mix(vec4(uColor, opacity), vec4(uColor, 0.), stepColor);

    gl_FragColor = finalColor;
}