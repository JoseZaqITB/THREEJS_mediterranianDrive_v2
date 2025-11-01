uniform vec3 uDepthColor;
uniform vec3 uSurfaceColor;
uniform float uColorOffset;
uniform float uColorMultiplier;

varying float vElevation;
varying vec3 vNormal;
varying vec3 vPosition;

#include ../includes/pointLight.glsl

void main()
{   
    
    // mix color by elevation
    float mixStrength = (vElevation + uColorOffset) * uColorMultiplier;
    mixStrength = smoothstep(0.0, 1.0, mixStrength);
    vec3 color = mix(uDepthColor, uSurfaceColor, mixStrength);
    
    // lights
    vec3 normal = normalize(vNormal);
    vec3 viewDirection = vPosition - cameraPosition;
    vec3 lightPosition = vec3(1.0, 2.0, (- 15.0 - 5.0));
    vec3 light = vec3(0.0);
    light += pointLight(
        vec3(1.0),
        2.0,
        lightPosition,
        viewDirection,
        normal,
        0.5,
        vPosition,
        0.12
    );

    light.x = 1.0 - step(light.x, 0.9);

    color = mix(uDepthColor, color, light.x);

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
    #include <tonemapping_fragment>
}