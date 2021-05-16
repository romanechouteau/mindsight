uniform float uParticleSize;
uniform float uTime;

varying float randomized;
varying float opacityLevel;

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
    float offset = rand(vec2(gl_VertexID, gl_VertexID));
    randomized = offset;
    float displacement = mod(uTime * offset, 3.);
    opacityLevel = displacement / 3.;

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    modelPosition.y = modelPosition.y + displacement;

    modelPosition.x += sin(uTime + offset * 2.) * 0.1;
    modelPosition.z += cos(uTime + offset * 8.) * 0.1;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    gl_PointSize = uParticleSize + (sin(offset) - 0.5) * 40.;
    gl_PointSize *= (1.0 / - viewPosition.z);
}