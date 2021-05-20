uniform float uTime;
uniform float uOpacity;

varying vec2 vUv;

void main()
{

   float pct = 0.0;
   vec2 uv = vUv - .5;
//    vec2 cursor = vec2(mouse.x, -mouse.y) / 2.;

   // The DISTANCE from the pixel to the mouse
   pct = distance( uv, vec2(0));

    // gl_FragColor = vec4(uColor, strength);
    // float strength = abs(distance(vUv, vec2(0.5)) - sin(uTime));
    float strength = smoothstep(0.0, 0.05, abs(distance(vUv, vec2(0.5)) - tan(uTime)/2.));

    float strength2 = smoothstep(0.0, 0.05, abs(distance(vUv, vec2(0.5)) - tan(uTime + 2.)/2.));

    float strength3 = smoothstep(0.0, 0.05, abs(distance(vUv, vec2(0.5)) - tan(uTime - 2.)/2.));

    float strength4= smoothstep(0.0, 0.05, abs(distance(vUv, vec2(0.5)) - tan(uTime + 4.)/2.));

    float strength5 = smoothstep(0.0, 0.05, abs(distance(vUv, vec2(0.5)) - tan(uTime - 4.)/2.));
    //  smoothstep(0.05, abs(distance(vUv, vec2(0.25)) - tan(uTime)));

    float strengthAll = strength * strength2 * strength3 * strength4 * strength5;

    float opacity = clamp((uOpacity - strengthAll) - ( pct * 2.), 0., 1.);

    gl_FragColor = vec4(vec3(1.), opacity);
}