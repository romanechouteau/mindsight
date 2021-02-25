varying vec2 vUv;

void main()
{
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength *= 2.0;
    strength = 1.0 - strength;

    vec3 finalColor = vec3(vUv.x, vUv.y, 0.5);

    gl_FragColor = vec4(finalColor, strength);
}
