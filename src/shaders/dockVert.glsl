uniform vec3 uScale;
uniform vec3 uMorphInfluences;
uniform vec3 uNormals;
uniform vec3 uMorphTargets1;
uniform vec3 uMorphTargets2;
uniform vec3 uMorphTargets3;
uniform vec3 uNormalsTarget1;
uniform vec3 uNormalsTarget2;
uniform vec3 uNormalsTarget3;

varying vec2 vUv;

#include <fog_pars_vertex>

mat3 rotateAlign( vec3 v1, vec3 v2)
{
    vec3 axis = cross( v1, v2 );

    float cosA = dot( v1, v2 );
    float k = 1.0f / (1.0f + cosA);

    mat3 result = mat3( (axis.x * axis.x * k) + cosA,
                 (axis.y * axis.x * k) - axis.z,
                 (axis.z * axis.x * k) + axis.y,
                 (axis.x * axis.y * k) + axis.z,
                 (axis.y * axis.y * k) + cosA,
                 (axis.z * axis.y * k) - axis.x,
                 (axis.x * axis.z * k) - axis.y,
                 (axis.y * axis.z * k) + axis.x,
                 (axis.z * axis.z * k) + cosA
                 );

    return result;
}

vec4 displace(vec4 modelPosition, vec3 morphTargets1, vec3 morphTargets2, vec3 morphTargets3) {
    vec4 pos = modelPosition;
    pos.x += (morphTargets1.x * uMorphInfluences.x + morphTargets2.x * uMorphInfluences.y + morphTargets3.x * uMorphInfluences.z) * uScale.x;
    pos.y += (morphTargets1.y * uMorphInfluences.x + morphTargets2.y * uMorphInfluences.y + morphTargets3.y * uMorphInfluences.z) * uScale.y;
    pos.z += (morphTargets1.z * uMorphInfluences.x + morphTargets2.z * uMorphInfluences.y + morphTargets3.z * uMorphInfluences.z) * uScale.z;

    return pos;
}

vec3 displaceNormals(vec3 normals, vec3 normalsTarget1, vec3 normalsTarget2, vec3 normalsTarget3) {
    vec3 normal = normals;
    normal.x += normalsTarget1.x * uMorphInfluences.x + normalsTarget2.x * uMorphInfluences.y + normalsTarget3.x * uMorphInfluences.z;
    normal.y += normalsTarget1.y * uMorphInfluences.x + normalsTarget2.y * uMorphInfluences.y + normalsTarget3.y * uMorphInfluences.z;
    normal.z += normalsTarget1.z * uMorphInfluences.x + normalsTarget2.z * uMorphInfluences.y + normalsTarget3.z * uMorphInfluences.z;

    return normal;
}

void main() {
    vUv = uv;

    vec3 pos = position;

    vec3 normal = displaceNormals(uNormals, uNormalsTarget1, uNormalsTarget2, uNormalsTarget3);
    mat3 rotateMatrix = rotateAlign(uNormals, normal);
    pos *= rotateMatrix;

    vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
    modelPosition = displace(modelPosition, uMorphTargets1, uMorphTargets2, uMorphTargets3);

    vec4 mvPosition = viewMatrix * modelPosition;

    vec4 projectedPosition = projectionMatrix * mvPosition;
    gl_Position = projectedPosition;

    #include <fog_vertex>
}
