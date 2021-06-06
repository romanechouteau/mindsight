uniform float uTime;

void main() {
    vec4 modelPosition = modelMatrix * instanceMatrix * vec4(position, 1.0);

    float displacement = cos(uTime) * modelPosition.y;
    modelPosition.x += displacement;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;
}
