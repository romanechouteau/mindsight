uniform sampler2D uTexture;
varying vec2 vUv;

#include <fog_pars_fragment>

void main()
{
    gl_FragColor = texture2D(uTexture, vUv);
    #include <fog_fragment>
}