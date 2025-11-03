uniform float uTime;
uniform float uWindSpeed;
uniform float uWindElevation;
varying vec2 vGlobalPosition;
varying vec2 vUv;

#include ../includes/perlinNoise3D

void main() {
    float speed = uTime * 0.25 * uWindSpeed;
    vec3 newPosition = position;
    newPosition.y += (cnoise(vec3(newPosition.xy, speed)) ) * 0.25 * uWindElevation * distance(newPosition, vec3(0.0));
    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);

    vec4 viewPosition = viewMatrix * modelPosition;
    
    gl_Position = projectionMatrix * viewPosition;

    // varyings
    vGlobalPosition = modelPosition.xz;
    vUv = uv;
}