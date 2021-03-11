uniform float uSize;
uniform float uTime;

float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {vec4 modelPosition = modelMatrix * vec4(position, 1.0);

  float offset = rand(vec2(position.x, position.z));
  modelPosition.y += sin(uTime + offset * 5.) * 0.05;

  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectedPosition;

  gl_PointSize = uSize;
  gl_PointSize *= (1.0 / - viewPosition.z);
}