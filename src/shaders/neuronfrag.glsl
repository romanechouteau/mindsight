uniform vec3 uColor;
uniform float uTime;
varying vec3 vColor;
varying float randomized;

void main()
{
    float strength = distance(gl_PointCoord, vec2(0.5));
    float step = step(clamp(uTime - (1. - vColor.y), 0., 0.5), strength);
    vec4 circle = mix(vec4(uColor, clamp(1. - (randomized * 0.8), 0., 1.)), vec4(uColor, 0.), step);
    vec4 finalColor = mix(vec4(uColor, 0.), circle, clamp(uTime - (1. - vColor.y), 0., 1.));

    gl_FragColor = finalColor;
}