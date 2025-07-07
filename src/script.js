import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import gsap from "gsap";
import GUI from "lil-gui";

/**
 * -------------------------
 * Canvas & Scene
 * -------------------------
 */
const canvas = document.querySelector("canvas.webgl");
const scene = new THREE.Scene();

/**
 * -------------------------
 * Skybox
 * -------------------------
 */
const cubeTextureLoader = new THREE.CubeTextureLoader();
const skybox = cubeTextureLoader.load([
  "/textures/skybox/px.jpg",
  "/textures/skybox/nx.jpg",
  "/textures/skybox/py.jpg",
  "/textures/skybox/ny.jpg",
  "/textures/skybox/pz.jpg",
  "/textures/skybox/nz.jpg",
]);
scene.background = skybox;

/**
 * -------------------------
 * Loading Manager
 * -------------------------
 */
const loadingManager = new THREE.LoadingManager();
loadingManager.onLoad = () => console.log("✅ Assets Loaded");

/**
 * -------------------------
 * Texture Setup
 * -------------------------
 */
const textureLoader = new THREE.TextureLoader(loadingManager);
const texturePaths = {
  Minecraft: "/textures/minecraft.png",
  Dirt: "/textures/dirt.jpg",
  Grass: "/textures/grass.jpg",
  Stone: "/textures/stone.jpg",
};

let currentTexture = textureLoader.load(texturePaths.Minecraft);
currentTexture.colorSpace = THREE.SRGBColorSpace;
currentTexture.magFilter = THREE.NearestFilter;
currentTexture.minFilter = THREE.NearestFilter;

/**
 * -------------------------
 * Cube Object
 * -------------------------
 */
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({
  map: currentTexture,
  color: "#ffffff",
  roughness: 0.5,
  metalness: 0.1,
  envMap: skybox,
  envMapIntensity: 1.0,
});
const mesh = new THREE.Mesh(geometry, material);
mesh.castShadow = true;
mesh.receiveShadow = true;
scene.add(mesh);

/**
 * -------------------------
 * Particle System
 * -------------------------
 */
const particleGeometry = new THREE.BufferGeometry();
const particleCount = 200;
const posArray = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount * 3; i++) {
  posArray[i] = (Math.random() - 0.5) * 10;
}
particleGeometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
const particleMaterial = new THREE.PointsMaterial({
  size: 0.05,
  color: "#ffffff",
  transparent: true,
  opacity: 0.6,
  blending: THREE.AdditiveBlending,
});
const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);

/**
 * -------------------------
 * Plane (Floor)
 * -------------------------
 */
const planeGeometry = new THREE.PlaneGeometry(10, 10);
const planeMaterial = new THREE.MeshStandardMaterial({
  color: "#2a2a2a",
  roughness: 0.7,
  metalness: 0.2,
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -0.51;
plane.receiveShadow = true;
scene.add(plane);

/**
 * -------------------------
 * Lights
 * -------------------------
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(3, 3, 2);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 15;
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0xffaa33, 0.8, 10);
pointLight.position.set(-2, 2, -2);
scene.add(pointLight);

/**
 * -------------------------
 * Camera & Controls
 * -------------------------
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(2, 2, 3);
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2.1;
controls.minDistance = 2;
controls.maxDistance = 10;

/**
 * -------------------------
 * Renderer & Post-Processing
 * -------------------------
 */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(sizes.width, sizes.height),
  0.7, // strength
  0.4, // radius
  0.1 // threshold
);
composer.addPass(bloomPass);

/**
 * -------------------------
 * Mouse Interaction
 * -------------------------
 */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
window.addEventListener("click", (event) => {
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(mesh);
  if (intersects.length > 0) {
    gsap.to(mesh.scale, {
      x: 1.5,
      y: 1.5,
      z: 1.5,
      duration: 0.3,
      yoyo: true,
      repeat: 1,
    });
  }
});

/**
 * -------------------------
 * Responsive Resize
 * -------------------------
 */
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  composer.setSize(sizes.width, sizes.height);
});

/**
 * -------------------------
 * GUI Controls
 * -------------------------
 */
const gui = new GUI();
const guiProps = {
  yPosition: 0,
  cubeScale: 1,
  colorTint: "#ffffff",
  filtering: "Pixelated",
  texture: "Minecraft",
  spinSpeed: 2,
  particleOpacity: 0.6,
  lightIntensity: 1.2,
  cycleSpeed: 0.1,
  bloomStrength: 0.7,
  toggleParticles: true,
  spin: () => {
    gsap.to(mesh.rotation, {
      y: mesh.rotation.y + Math.PI * 2,
      duration: guiProps.spinSpeed,
      ease: "power1.inOut",
    });
  },
  exportScene: () => {
    const exporter = new GLTFExporter();
    exporter.parse(scene, (gltf) => {
      const output = JSON.stringify(gltf, null, 2);
      const blob = new Blob([output], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "scene.gltf";
      link.click();
    }, { binary: false });
  },
};

// Cube Controls
const cubeFolder = gui.addFolder("Cube");
cubeFolder.add(mesh.position, "y").min(-2).max(2).step(0.01).name("Y Position");
cubeFolder.add(guiProps, "cubeScale").min(0.5).max(3).step(0.1).name("Cube Scale").onChange((val) => {
  gsap.to(mesh.scale, {
    x: val,
    y: val,
    z: val,
    duration: 0.5,
    ease: "power2.out",
  });
});
cubeFolder.add(material, "wireframe").name("Wireframe");
cubeFolder.addColor(guiProps, "colorTint").name("Color Tint").onChange(() => {
  material.color.set(guiProps.colorTint);
});
cubeFolder.add(material, "envMapIntensity").min(0).max(2).step(0.01).name("EnvMap Intensity");
cubeFolder.add(guiProps, "spinSpeed").min(0.1).max(5).step(0.1).name("Spin Speed");
cubeFolder.add(guiProps, "spin").name("Spin Cube");

// Texture Controls
const textureFolder = gui.addFolder("Texture");
textureFolder.add(guiProps, "filtering", ["Pixelated", "Smooth"]).name("Filtering").onChange((val) => {
  if (val === "Pixelated") {
    currentTexture.magFilter = THREE.NearestFilter;
    currentTexture.minFilter = THREE.NearestFilter;
  } else {
    currentTexture.magFilter = THREE.LinearFilter;
    currentTexture.minFilter = THREE.LinearMipMapLinearFilter;
  }
  currentTexture.needsUpdate = true;
});
textureFolder.add(guiProps, "texture", Object.keys(texturePaths)).name("Texture").onChange((name) => {
  const newTex = textureLoader.load(texturePaths[name]);
  newTex.colorSpace = THREE.SRGBColorSpace;
  newTex.magFilter = guiProps.filtering === "Pixelated" ? THREE.NearestFilter : THREE.LinearFilter;
  newTex.minFilter = guiProps.filtering === "Pixelated" ? THREE.NearestFilter : THREE.LinearMipMapLinearFilter;
  newTex.needsUpdate = true;
  material.map = newTex;
  currentTexture = newTex;
});

// Lighting Controls
const lightFolder = gui.addFolder("Lighting");
lightFolder.add(guiProps, "lightIntensity").min(0).max(2).step(0.1).name("Sun Intensity").onChange((val) => {
  directionalLight.intensity = val;
});
lightFolder.add(guiProps, "cycleSpeed").min(0).max(1).step(0.01).name("Day-Night Speed");
lightFolder.add(pointLight.position, "x").min(-5).max(5).step(0.1).name("Point Light X");
lightFolder.add(pointLight.position, "y").min(-5).max(5).step(0.1).name("Point Light Y");
lightFolder.add(pointLight.position, "z").min(-5).max(5).step(0.1).name("Point Light Z");

// Particle Controls
const particleFolder = gui.addFolder("Particles");
particleFolder.add(guiProps, "particleOpacity").min(0).max(1).step(0.01).name("Opacity").onChange((val) => {
  particleMaterial.opacity = val;
});
particleFolder.add(guiProps, "toggleParticles").name("Show Particles").onChange((val) => {
  particles.visible = val;
});

// Post-Processing Controls
const postFolder = gui.addFolder("Post-Processing");
postFolder.add(guiProps, "bloomStrength").min(0).max(2).step(0.01).name("Bloom Strength").onChange((val) => {
  bloomPass.strength = val;
});

// Export Control
gui.add(guiProps, "exportScene").name("Export Scene");

/**
 * -------------------------
 * Animations
 * -------------------------
 */
gsap.to(mesh.position, {
  y: "+=0.25",
  duration: 1.5,
  repeat: -1,
  yoyo: true,
  ease: "sine.inOut",
});

gsap.to(particles.rotation, {
  y: Math.PI * 2,
  duration: 20,
  repeat: -1,
  ease: "none",
});

/**
 * -------------------------
 * Animation Loop
 * -------------------------
 */
const clock = new THREE.Clock();
const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Day-Night Cycle
  const time = elapsedTime * guiProps.cycleSpeed;
  directionalLight.position.x = 3 * Math.cos(time);
  directionalLight.position.z = 3 * Math.sin(time);
  directionalLight.position.y = 3 * Math.abs(Math.sin(time));
  directionalLight.color.setHSL(time % 1, 0.5, 0.5);

  // Animate particles
  if (particles.visible) {
    const positions = particleGeometry.attributes.position.array;
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i + 1] += Math.sin(elapsedTime + positions[i]) * 0.001;
    }
    particleGeometry.attributes.position.needsUpdate = true;
  }

  controls.update();
  composer.render();
  window.requestAnimationFrame(tick);
};
tick(); 