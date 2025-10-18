precision highp float;

out vec2 vUV; // output naar fragment shader

void main() {
    vUV = uv; // uv komt automatisch van Three.js
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    // position, modelViewMatrix, projectionMatrix komen automatisch van Three.js
}
