uniform vec3 uColor;

void main()
{
    float strength = distance(gl_PointCoord, vec2(0.5));
    // strength *= 2.0;
    strength = 1.0 - strength;
    strength = pow(strength, 10.0);

    gl_FragColor = vec4(uColor, strength);
}