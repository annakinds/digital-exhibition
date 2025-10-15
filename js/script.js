import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const canvas = document.querySelector('canvas.webgl');
const scene = new THREE.Scene();
const textureLoader = new THREE.TextureLoader();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedCube = null;
let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;

const cubeTextures = [
    'assets/pictures/Box 3.png',
    'assets/pictures/Box 2.png',
    'assets/pictures/Box 1.png',
];

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
        scene.add(cube);
    });
};

createWrappedCube(cubeTextures[0], 0);
createWrappedCube(cubeTextures[1], 2.1);
createWrappedCube(cubeTextures[2], 4.2);


const size = { width: window.innerWidth, height: window.innerHeight };
const camera = new THREE.PerspectiveCamera(45, size.width / size.height, 0.1, 100);
camera.position.set(10, 3, 10);
camera.lookAt(5, 2, 0);
scene.add(camera);

// const controls = new OrbitControls(camera, canvas);
// controls.enableDamping = true;



const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const draw = () => {
    // controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(draw);
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
    const intersects = raycaster.intersectObjects(scene.children);

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
