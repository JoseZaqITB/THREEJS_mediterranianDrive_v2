void main() {
    float distance2Center = distance(gl_PointCoord, vec2(0.5));
    float strength = (0.05 / distance2Center) - 0.05 * 2.0;
    gl_FragColor = vec4(1.0,1.0,0.0, strength);
}