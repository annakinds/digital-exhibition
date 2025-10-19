import * as THREE from 'three'; 
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import portalVertexShader from '../shaders/portal/vertex.glsl?raw';
import portalFragmentShader from '../shaders/portal/fragment.glsl?raw';

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
directionalLight2.position.set(-5, 10, -7.5);

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
    });
});

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

