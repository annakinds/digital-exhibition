precision highp float;

in vec2 vUV;
out vec4 fragColor;

uniform sampler2D uTex0;
uniform sampler2D uTex1;
uniform sampler2D uTex2;
uniform sampler2D uTex3;

uniform vec2 uResolution;
uniform float uFrame;

#define RotNum 5
const float PI = 3.1415926535;
const float ang = 2.0 * PI / float(RotNum);

mat2 m = mat2(cos(ang), sin(ang),
             -sin(ang), cos(ang));

mat2 mh = mat2(cos(ang*0.5), sin(ang*0.5),
              -sin(ang*0.5), cos(ang*0.5));

vec4 randS(vec2 uv) {
    return texture(uTex1, uv) - vec4(0.5);
}

float getRot(vec2 pos, vec2 b) {
    vec2 p = b;
    float rot = 0.0;
    for (int i = 0; i < RotNum; i++) {
        vec2 texVal = texture(uTex0, fract(pos + p)).xy - 0.5;
        rot += dot(texVal, p.yx * vec2(1.0, -1.0));
        p = m * p;
    }
    return rot / float(RotNum) / dot(b, b);
}

float getVal(vec2 uv) {
    return length(texture(uTex0, uv).xyz);
}

vec2 getGrad(vec2 uv, float delta) {
    vec2 d = vec2(delta, 0.0);
    return vec2(
        getVal(uv + d.xy) - getVal(uv - d.xy),
        getVal(uv + d.yx) - getVal(uv - d.yx)
    ) / delta;
}

void main() {
    float rnd = randS(vec2(uFrame / uResolution.x, 0.5)).x;
    vec2 b = vec2(cos(ang * rnd), sin(ang * rnd));
    vec2 v = vec2(0.0);
    float bbMax = 0.7 * uResolution.y;
    bbMax *= bbMax;

    for (int l = 0; l < 20; l++) {
        if (dot(b, b) > bbMax) break;
        vec2 p = b;
        for (int i = 0; i < RotNum; i++) {
            v += p.yx * getRot(vUV * uResolution, b);
            p = m * p;
        }
        b *= 2.0;
    }

    vec2 uv = fract((vUV + v * vec2(-1.0, 1.0) * 2.0));
    vec2 scr = (vUV * 2.0) - 1.0;
    vec4 baseCol = texture(uTex0, uv);
    baseCol.xy += 0.01 * scr / (dot(scr, scr) / 0.1 + 0.3);

    vec2 uv2 = vUV;
    vec3 n = vec3(getGrad(uv2, 1.0 / uResolution.y), 150.0);
    n = normalize(n);

    vec3 light = normalize(vec3(1.0, 1.0, 2.0));
    float diff = clamp(dot(n, light), 0.5, 1.0);
    float spec = clamp(dot(reflect(light, n), vec3(0.0, 0.0, -1.0)), 0.0, 1.0);
    spec = pow(spec, 36.0) * 2.5;

    fragColor = baseCol * diff + vec4(spec);
}
