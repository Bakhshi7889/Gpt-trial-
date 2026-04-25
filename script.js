import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";

const canvas = document.getElementById("webgl-canvas");
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x050507, 10, 48);

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.6, 8.5);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const ambient = new THREE.AmbientLight(0x6f84ff, 0.45);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xd9ecff, 1.6);
keyLight.position.set(4, 8, 4);
scene.add(keyLight);

const rimLight = new THREE.PointLight(0x2e85ff, 18, 30);
rimLight.position.set(-6, 2, -5);
scene.add(rimLight);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(15, 80),
  new THREE.MeshStandardMaterial({ color: 0x020305, metalness: 0.25, roughness: 0.88 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.05;
scene.add(floor);

const carGroup = new THREE.Group();
scene.add(carGroup);

const carPaint = new THREE.MeshPhysicalMaterial({
  color: 0x1a62ff,
  metalness: 0.92,
  roughness: 0.2,
  clearcoat: 1,
  clearcoatRoughness: 0.12,
});

const carbon = new THREE.MeshStandardMaterial({ color: 0x10131e, metalness: 0.68, roughness: 0.4 });
const glass = new THREE.MeshPhysicalMaterial({
  color: 0x8ca8ff,
  transmission: 0.83,
  roughness: 0.08,
  metalness: 0,
  transparent: true,
  opacity: 0.45,
});

const body = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.95, 1.9), carPaint);
body.position.y = 0;
body.scale.z = 1.08;
carGroup.add(body);

const roof = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.64, 1.55), carPaint);
roof.position.set(-0.05, 0.7, 0);
roof.scale.x = 1.1;
carGroup.add(roof);

const hood = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.35, 1.78), carbon);
hood.position.set(1.9, 0.18, 0);
hood.rotation.z = -0.03;
carGroup.add(hood);

const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.32, 1.7), carbon);
trunk.position.set(-2.0, 0.22, 0);
carGroup.add(trunk);

const grille = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.45, 1.0), carbon);
grille.position.set(2.01, -0.05, 0);
carGroup.add(grille);

const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.44, 1.45), glass);
windshield.position.set(0.18, 0.71, 0);
windshield.rotation.z = -0.12;
carGroup.add(windshield);

const rearGlass = windshield.clone();
rearGlass.position.x = -0.48;
rearGlass.rotation.z = 0.16;
carGroup.add(rearGlass);

const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x0c0d11, metalness: 0.92, roughness: 0.35 });
const wheelGlowMaterial = new THREE.MeshBasicMaterial({ color: 0x3c9dff, transparent: true, opacity: 0.35 });

const wheelPositions = [
  [1.15, -0.62, 1.0],
  [1.15, -0.62, -1.0],
  [-1.22, -0.62, 1.0],
  [-1.22, -0.62, -1.0],
];

const wheelMeshes = [];
wheelPositions.forEach(([x, y, z]) => {
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.4, 28), wheelMaterial);
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(x, y, z);

  const glow = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.06, 28), wheelGlowMaterial);
  glow.rotation.z = Math.PI / 2;
  glow.position.copy(wheel.position);

  wheelMeshes.push({ wheel, glow });
  carGroup.add(wheel);
  carGroup.add(glow);
});

const progressState = {
  current: 0,
  target: 0,
};

const sections = [...document.querySelectorAll(".panel")];
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function calcScrollProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollable <= 0) return 0;
  return clamp(window.scrollY / scrollable, 0, 1);
}

function driveScene(progress) {
  const eased = 1 - Math.pow(1 - progress, 3);

  carGroup.rotation.y = eased * Math.PI * 2.4 + Math.sin(eased * Math.PI * 4) * 0.1;
  carGroup.rotation.x = Math.sin(eased * Math.PI * 3) * 0.06;
  carGroup.position.y = Math.sin(eased * Math.PI * 5) * 0.08;

  camera.position.x = Math.sin(eased * Math.PI * 2) * 2.2;
  camera.position.z = 8.5 - eased * 3.8;
  camera.position.y = 1.5 + Math.sin(eased * Math.PI * 2.5) * 0.45;
  camera.lookAt(0, 0, 0);

  rimLight.intensity = 10 + eased * 20;
  rimLight.color.setHSL(0.57 + eased * 0.03, 0.95, 0.55);

  const bodyColor = new THREE.Color().setHSL(0.59 + eased * 0.06, 0.78, 0.42 + eased * 0.08);
  carPaint.color.copy(bodyColor);

  wheelMeshes.forEach(({ wheel, glow }, index) => {
    wheel.rotation.x = eased * Math.PI * 8 + index * 0.15;
    glow.material.opacity = 0.22 + eased * 0.45;
    glow.scale.setScalar(1 + eased * 0.2);
  });

  sections.forEach((section, i) => {
    const sectionProgress = clamp(eased * (sections.length - 1) - i + 1, 0, 1);
    const content = section.querySelector(".content");
    content.style.transform = `translateY(${(1 - sectionProgress) * 60}px)`;
    content.style.opacity = sectionProgress;
  });
}

window.addEventListener("scroll", () => {
  progressState.target = calcScrollProgress();
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

(function animate() {
  progressState.current += (progressState.target - progressState.current) * 0.07;
  driveScene(progressState.current);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
})();

progressState.target = calcScrollProgress();
driveScene(progressState.target);
