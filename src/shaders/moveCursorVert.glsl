uniform float uTime;
uniform float morphTargetBaseInfluence;
uniform float morphTargetInfluences[ 4 ];

varying vec2 vUv;

void main() {
  vUv = uv;

  vec3 transformed = vec3( position );
  transformed *= morphTargetBaseInfluence;
	transformed += morphTarget0 * morphTargetInfluences[ 0 ];
	transformed += morphTarget1 * morphTargetInfluences[ 1 ];
	transformed += morphTarget2 * morphTargetInfluences[ 2 ];
	transformed += morphTarget3 * morphTargetInfluences[ 3 ];

  vec4 modelPosition = modelMatrix * vec4(transformed, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectedPosition;
}