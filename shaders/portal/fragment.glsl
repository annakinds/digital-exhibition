uniform float iTime;
uniform sampler2D iChannel0;

varying vec2 vUv;   // <-- komt vanuit vertex shader

const int MaxIter = 9;
float scl = 1.0;
float scl2 = 1.0;

void init() {
    scl = pow(0.5, float(MaxIter));
    scl2 = scl * scl;
}

vec2 fG(vec2 t0, vec2 t1){
    return vec2(dot(t0,t1), dot(t0, t1.yx));
}

vec2 fA(vec2 t, vec2 p){
    return fG(t,p-vec2(0.5))+vec2(0.5);
}

vec2 fCg(vec2 p){
    return vec2(p.y, (1.0-2.0*p.x)*(1.0-p.y));
}

float fL(float c){
    return max(0.0, 0.5*((-3.0*c+13.0)*c-8.0));
}

float C2L(vec2 p){
    vec2 t=vec2(1.0,0.0);
    float l=0.0;
    for(int i=0; i<MaxIter; i++){
        p *= 2.0;
        vec2 p0 = floor(p);
        p -= p0;
        p0 = fA(t, p0);
        t = fG(t, fCg(p0));
        float c = p0.x * 2.0 + p0.y;
        l = l * 4.0 + fL(c);
    }
    return l * scl2;
}

vec2 L2C(float l){
    vec2 t = vec2(1.0,0.0);
    vec2 p = vec2(0.0,0.0);
    for(int i=0; i<MaxIter; i++){
        l *= 4.0;
        float c = floor(l);
        l -= c;
        c = 0.5 * fL(c);
        vec2 p0 = vec2(floor(c), 2.0*(c-floor(c)));
        t = fG(t, fCg(p0));
        p0 = fA(t, p0);
        p = p * 2.0 + p0;
    }
    return p * scl;
}

float dist2box(vec2 p, float a){
    p = abs(p) - vec2(a);
    return max(p.x, p.y);
}

float d2line(vec2 p, vec2 a, vec2 b){
    vec2 v = b - a;
    p -= a;
    p = p - v * clamp(dot(p, v)/dot(v, v), 0.0, 1.0);
    return min(0.5*scl, length(p));
}

void main() {
    // Gebruik vUv als basis in plaats van gl_FragCoord
    vec2 uv = vUv;

    init();

    vec4 color = vec4(1.0);

    float ds = dist2box(uv - 0.5, 0.5 - 0.5*scl);
    if(ds > 0.5*scl){
        gl_FragColor = color;
        return;
    }

#ifndef SHOWPACKING
    float l = C2L(uv);
    float t = mod(1.0/4.0*scl * iTime, 1.0) / scl2;
    l = mod(l + t * scl2, 1.0);
    vec2 ps = L2C(l) + vec2(0.5*scl);
    color = texture2D(iChannel0, ps);
#else
    uv = floor(uv/scl)*scl;
    float l = uv.x*scl + uv.y;
    vec2 ps = L2C(l) + vec2(0.5*scl);
    color = texture2D(iChannel0, ps);
#endif

    gl_FragColor = color;
}
