import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { AnaglyphEffect } from 'three/addons/effects/AnaglyphEffect.js';

let camera, scene, renderer, effect, controls;
let model, mixer;
const clock = new THREE.Clock();

init();
animate();

function init() {
  const container = document.getElementById('canvas-container');

  // Cámara
  camera = new THREE.PerspectiveCamera(70, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 2, 5);

  // Escena
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xaaaaaa);

  // Luces
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.1);
  hemiLight.position.set(0, 10, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(3, 10, 10);
  dirLight.castShadow = true;
  scene.add(dirLight);

  // Piso
  const floorGeometry = new THREE.PlaneGeometry(100, 100);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.8, metalness: 0.2 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Cuadrícula
  const grid = new THREE.GridHelper(100, 100, 0x555555, 0xaaaaaa);
  grid.position.y = 0.01;
  scene.add(grid);

  // Render + efecto anaglifo
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  effect = new AnaglyphEffect(renderer);
  effect.setSize(container.clientWidth, container.clientHeight);

  // Aumentar efecto 3D
  if (effect._cameraL && effect._cameraR) {
    effect._cameraL.translateX(-0.12);
    effect._cameraR.translateX(0.12);
  }

  // Controles
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = true;
  controls.target.set(0, 1, 0);

  // Modelo FBX
  const loader = new FBXLoader();
  loader.load('models/personaje.fbx', (fbx) => {
    model = fbx;
    model.scale.set(0.01, 0.01, 0.01);
    model.traverse((child) => { if (child.isMesh) child.castShadow = true; });
    scene.add(model);

    // Animación
    const animLoader = new FBXLoader();
    animLoader.load('models/animacion.fbx', (anim) => {
      mixer = new THREE.AnimationMixer(model);
      const action = mixer.clipAction(anim.animations[0]);
      action.play();
    });
  });

  // Redimensionamiento
  window.addEventListener('resize', () => onWindowResize(container));
}

function onWindowResize(container) {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  effect.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  controls.update();
  effect.render(scene, camera);
}
