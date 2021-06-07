uniform float uTime;

varying vec2 vUv;
varying float vSpecial;

attribute float aSpecial;

void main() {
    vUv = uv;
    vSpecial = aSpecial;
    vec4 modelPosition = modelMatrix * instanceMatrix * vec4(position, 1.0);

    float delay = (modelPosition.x * 0.05 + modelPosition.z * 0.02);
    float displacement = cos(uTime + delay) * (pow(1. - uv.y, 2.) * 0.5);
    modelPosition.x += displacement;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;
}
