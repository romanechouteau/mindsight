uniform float uSize;
uniform float uTime;
uniform float uParticleSize;

varying float randomized;

float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);

  float offset = rand(vec2(gl_VertexID, gl_VertexID));
  modelPosition.x += cos(uTime + offset * 10.) * (pow((0.1), 1. / (0.5 + uSize)));
  modelPosition.y += sin(uTime + offset * 15.) * (pow((0.1),1. / (0.5 + uSize)));
  modelPosition.z += sin(uTime + offset * 5.) * (pow((0.1), 1. / (0.5 + uSize)));

  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectedPosition;

  randomized = offset;

  gl_PointSize = uParticleSize + (sin(offset) - 0.5) * 40.;
  gl_PointSize *= (1.0 / - viewPosition.z);
}