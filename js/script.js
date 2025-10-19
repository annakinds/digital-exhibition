import * as THREE from "https://unpkg.com/three@0.169.0/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.169.0/examples/jsm/loaders/GLTFLoader.js";
// import portalVertexShader from '../shaders/portal/vertex.glsl?raw';
// import portalFragmentShader from '../shaders/portal/fragment.glsl?raw';

//shaders
const portalVertexShader = `precision highp float;
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const portalFragmentShader = `precision highp float;
uniform float iTime;
uniform sampler2D iChannel0;

varying vec2 vUv;   

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
    uv.y = 1.0 - uv.y; 

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
`;

//scene setup
const canvas = document.querySelector('canvas.webgl');
const scene = new THREE.Scene();
const textureLoader = new THREE.TextureLoader();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedCube = null;
let isDragging = false;
let previousMouseX = 0
let previousMouseY = 0;

const size = { width: window.innerWidth, height: window.innerHeight };
const camera = new THREE.PerspectiveCamera(90, size.width / size.height, 0.1, 100);
camera.position.set(0, 5, 10);
camera.lookAt(0, 5, 0);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
scene.add(directionalLight);
directionalLight.position.set(5, 10, 7.5);

const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
scene.add(directionalLight2);
directionalLight2.position.set(-5, 5, 7.5);

//cubes
const cubeTextures = [
    'assets/pictures/Box 3.png',
    'assets/pictures/Box 2.png',
    'assets/pictures/Box 1.png',
];

const cubeGroup = new THREE.Group();
scene.add(cubeGroup);
const createWrappedCube = (texturePath, positionY) => {
    textureLoader.load(texturePath, (sideTexture) => {
        sideTexture.wrapS = THREE.RepeatWrapping;
        sideTexture.wrapT = THREE.ClampToEdgeWrapping;
        sideTexture.repeat.set(0.25, 1);

        const materials = [
            new THREE.MeshBasicMaterial({ map: sideTexture.clone() }),
            new THREE.MeshBasicMaterial({ map: sideTexture.clone() }),
            new THREE.MeshBasicMaterial({ color: 0x808080 }),
            new THREE.MeshBasicMaterial({ color: 0x808080 }),
            new THREE.MeshBasicMaterial({ map: sideTexture.clone() }),
            new THREE.MeshBasicMaterial({ map: sideTexture.clone() })
        ];

        materials[0].map.offset.x = 0;
        materials[1].map.offset.x = 0.25;
        materials[4].map.offset.x = 0.5;
        materials[5].map.offset.x = 0.75;

        const cube = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), materials);
        cube.position.y = positionY;
        cubeGroup.add(cube);
    });
};

createWrappedCube(cubeTextures[0], 0);
createWrappedCube(cubeTextures[1], 2.1);
createWrappedCube(cubeTextures[2], 4.2);

cubeGroup.position.x = -4;
cubeGroup.position.y = 2; 

//frames
const frames = [
    'assets/pictures/horizontalPhoto1.jpg',
    'assets/pictures/horizontalPhoto2.jpg',
    'assets/pictures/roundPhoto1.jpg',
    'assets/pictures/roundPhoto2.jpg',
    'assets/pictures/verticalPhoto1.jpg',
    'assets/pictures/verticalPhoto2.jpg'
];

const textures = [];
const photoPlanes = [];

frames.forEach((frame) => {
    const texture = textureLoader.load(frame, () => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.y = -1;
        texture.offset.y = 1;
    });
    textures.push(texture);
});

const basicMaterials = textures.map((texture) => {
    return new THREE.MeshBasicMaterial({ map: texture });
});

const shaderMaterials = textures.map((texture) => {
    return new THREE.ShaderMaterial({
        uniforms: {
            iResolution: { value: new THREE.Vector3(window.innerWidth, window.innerHeight, 1) },
            iTime: { value: 0 },
            iChannel0: { value: texture },
        },
        vertexShader: portalVertexShader,
        fragmentShader: portalFragmentShader,
        side: THREE.DoubleSide,
        // glslVersion: THREE.GLSL3
    });
});

//loader
const loader = new GLTFLoader();
loader.load(
    'assets/Exhibition.glb',
    (gltf) => {
        gltf.scene.traverse(child => {
            const names = [
                "horizontalPlane_left",
                "horizontalPlane_right",
                "roundPlane_left",
                "roundPlane_right",
                "verticalPlane_left",
                "verticalPlane_right"
            ];
            const index = names.indexOf(child.name);
            if (index !== -1) {
                child.material = basicMaterials[index];
                child.userData.shaderIndex = index;
                photoPlanes.push(child);
            }
        });
        gltf.scene.position.set(0, 0, 0);
        gltf.scene.scale.set(1, 1, 1);
        scene.add(gltf.scene);
    }
);

const clock = new THREE.Clock()
const draw = () => {
    const elapsedTime = clock.getElapsedTime()
    shaderMaterials.forEach((material) => {
        material.uniforms.iTime.value = elapsedTime
    });
    renderer.render(scene, camera)
    window.requestAnimationFrame(draw)
}
draw();

//eventlisteners
window.addEventListener('resize', () => {
    size.width = window.innerWidth;
    size.height = window.innerHeight;
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    renderer.setSize(size.width, size.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

window.addEventListener('mousedown', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cubeGroup.children);
    if (intersects.length > 0) {
        selectedCube = intersects[0].object;
        isDragging = true;
        previousMouseX = event.clientX;
        previousMouseY = event.clientY;
    }
});

window.addEventListener('mousemove', (event) => {
    if (isDragging && selectedCube) {
        const deltaX = event.clientX - previousMouseX;

        selectedCube.rotation.y += deltaX * 0.01;

        previousMouseX = event.clientX;
    }
});

window.addEventListener('mouseup', () => {
    isDragging = false;
    selectedCube = null;
});

window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(photoPlanes);

    if (intersects.length > 0) {
        const plane = intersects[0].object;
        const shaderIndex = plane.userData.shaderIndex;

        if (plane.material === shaderMaterials[shaderIndex]) {
            plane.material = basicMaterials[shaderIndex];
        } else {
            plane.material = shaderMaterials[shaderIndex];
        }
    }
});

