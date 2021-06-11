uniform float uTime;
uniform float uOpacity;
uniform vec2 uMouse;

varying vec2 vUv;

void main()
{

   float pct = 0.0;

   // The DISTANCE from the pixel to the mouse
   pct = distance( vUv, uMouse) * 24.;

    float strength = smoothstep(0.0, 0.005, abs(distance(vUv, uMouse) - tan(uTime)/24.));

    float strength2 = smoothstep(0.0, 0.005, abs(distance(vUv, uMouse) - tan(uTime + 2.)/18.));

    float strength3 = smoothstep(0.0, 0.005, abs(distance(vUv, uMouse) - tan(uTime - 2.)/18.));

    float strength4= smoothstep(0.0, 0.005, abs(distance(vUv, uMouse) - tan(uTime + 4.)/18.));

    float strength5 = smoothstep(0.0, 0.005, abs(distance(vUv, uMouse) - tan(uTime - 4.)/18.));

    float strength6 = smoothstep(0.0, 0.005, abs(distance(vUv, uMouse) - tan(uTime + 6.)/18.));

    float strengthAll = strength * strength2 * strength3 * strength4 * strength5 * strength6;

    float opacity = clamp((uOpacity - strengthAll) - pct, 0., 1.);

    gl_FragColor = vec4(vec3(1.), opacity);
}