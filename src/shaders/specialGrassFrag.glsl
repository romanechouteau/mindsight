uniform sampler2D uMap;

varying vec2 vUv;

#include <fog_pars_fragment>

void main()
{
    gl_FragColor = texture2D(uMap, vUv);
    #include <fog_fragment>
}