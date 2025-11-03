uniform sampler2D uMap;
uniform float uAlpha;

varying vec2 vGlobalPosition;
varying vec2 vUv;

#include "../includes/perlinNoise3D.glsl"

void main() {
    // create alpha
    float alpha = 1.0 - distance(vGlobalPosition * uAlpha, vec2(0.0));
    // apply map texture
    vec3 map = texture(uMap, vUv).rgb;
    // final color
    gl_FragColor = vec4(map, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}