#version 300 es
precision highp float;

in vec3 aPosition;
in vec2 aUV;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

out vec2 vUV;

void main() {
    vUV = aUV;
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
}
