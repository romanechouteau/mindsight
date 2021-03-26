// for shadermaterial
uniform float uTime;

varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;

  vec4 modelPosition = modelMatrix * vec4(position, 1.0);

  modelPosition.y = cos(uTime + uv.x *10. + uv.y*10.) / 100. + 0.01;
  vPosition = modelPosition.xyz;

  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectedPosition;
}

// for onbeforecompile
// float sine = cos(uTime + position.x*10. + position.y*10.);
// mat3 multiplier = mat3(0., 0., 0., 0., 0., 0., 0., 0., 0.);
// vec3 multiplier = vec3(1., sine, 1.);

// vec3 transformed = vec3( position ) * multiplier;

// vec3 vNormal = vec3(0) * multiplier;