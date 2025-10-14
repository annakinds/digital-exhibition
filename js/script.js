import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const canvas = document.querySelector('canvas.webgl');
const scene = new THREE.Scene();
const textureLoader = new THREE.TextureLoader();

const cubeTextures = [
    'assets/pictures/Box 3.png',
    'assets/pictures/Box 2.png',
    'assets/pictures/Box 1.png',
];

const createWrappedCube = (texturePath, positionY) => {
    textureLoader.load(texturePath, (sideTexture) => {
        sideTexture.wrapS = THREE.RepeatWrapping;
        sideTexture.wrapT = THREE.ClampToEdgeWrapping;
        sideTexture.repeat.set(0.25, 1); // 4 vlakken breed

        // Maak vier materialen met verschillende offsets
        const materials = [
            new THREE.MeshBasicMaterial({ map: sideTexture.clone() }), // right
            new THREE.MeshBasicMaterial({ map: sideTexture.clone() }), // left
            new THREE.MeshBasicMaterial({ color: 0x808080 }),           // top
            new THREE.MeshBasicMaterial({ color: 0x808080 }),           // bottom
            new THREE.MeshBasicMaterial({ map: sideTexture.clone() }), // front
            new THREE.MeshBasicMaterial({ map: sideTexture.clone() })  // back
        ];

        // Zet de offset voor elk vlak
        materials[0].map.offset.x = 0;     // right
        materials[1].map.offset.x = 0.25;  // left
        materials[4].map.offset.x = 0.5;   // front
        materials[5].map.offset.x = 0.75;  // back

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
camera.position.set(5, 5, 10);
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const draw = () => {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(draw);
}
draw();

// ✅ Responsiveness
window.addEventListener('resize', () => {
    size.width = window.innerWidth;
    size.height = window.innerHeight;
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    renderer.setSize(size.width, size.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
