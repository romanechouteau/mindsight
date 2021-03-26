varying vec2 vUv;
varying vec3 vPosition;

void main()
{
    gl_FragColor = vec4(vec3(vPosition.y * 10. + 0.5), 1.);
}