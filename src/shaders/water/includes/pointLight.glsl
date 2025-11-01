vec3 pointLight(vec3 color, float intensity, vec3 position, vec3 viewDirection, vec3 normal, float specularPower, vec3 vertexPosition, float decayStrength) {
    // see angle between normal and light direction
    vec3 lightDelta = position - vertexPosition;
    lightDelta.z *= decayStrength * 5.0; // for moon light in water
    float pointStrength = length(lightDelta);
    vec3 lightDirection = normalize(lightDelta);
    float lightStrength = dot(lightDirection, normal);
    lightStrength = max(0.0, lightStrength);
    // add specular
    vec3 reflectDirection = reflect( - lightDirection, normal); 
    float specular = - dot(viewDirection, reflectDirection);
    specular = max(0.0, specular);
    specular = pow(specular, specularPower);
    // decay
    float decay = 1.0 - pointStrength * decayStrength;
    decay = max(0.0,decay);
    //
    return color * intensity * (lightStrength + specular ) * decay;
}