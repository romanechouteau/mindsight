uniform float uSize;
uniform float uTime;

varying vec3 vColor;
varying float randomized;

float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
  vColor = color;
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);

  float offset = rand(vec2(gl_VertexID, gl_VertexID));
  modelPosition.x += cos(uTime + offset * 10.) * 0.04;
  modelPosition.y += sin(uTime + offset * 15.) * 0.04;
  modelPosition.z += sin(uTime + offset * 5.) * 0.04;

  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectedPosition;

  randomized = offset;

  gl_PointSize = uSize + (sin(offset) - 0.5) * 10.;
  gl_PointSize *= (1.0 / - viewPosition.z);
}