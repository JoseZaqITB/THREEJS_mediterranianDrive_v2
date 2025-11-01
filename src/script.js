import GUI from "lil-gui";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import firefliesVertex from "./shaders/fireflies/vertex.glsl";
import firefliesFragment from "./shaders/fireflies/fragment.glsl";
import alphaVertex from "./shaders/alpha/vertex.glsl";
import alphaFragment from "./shaders/alpha/fragment.glsl";
import waterFragmentShader from "./shaders/water/water/fragment.glsl";
import waterVertexShader from "./shaders/water/water/vertex.glsl";


/**
 * Base
 */
// Debug
const debugObject = {
  depthColor: "#1a1805",
  surfaceColor: "#042c71",
  colorMoon: "#8b8b8b",
  moonPosition: new THREE.Vector2(0.55, 1.0),
};

const gui = new GUI({
  width: 400,
});

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader();

// Draco loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("draco/");

// GLTF loader
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Textures
 */
const bakedTxt = textureLoader.load("baked.jpg");
bakedTxt.colorSpace = THREE.SRGBColorSpace;
bakedTxt.flipY = false; // IMPORTANT¡: the baked image will be flipped if not set to false.


const moonAlphaTxt = textureLoader.load("./moon/alpha.jpg");
moonAlphaTxt.colorSpace = THREE.SRGBColorSpace;

/**
 * Materials
 */
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTxt });

const poleLightMaterial = new THREE.MeshBasicMaterial({ color: "#ffffe5" });

const alphaBakedMaterial = new THREE.ShaderMaterial({
  // CSM
  vertexShader: alphaVertex,
  fragmentShader: alphaFragment,
  uniforms:{
    uMap: new THREE.Uniform(bakedTxt),
  },
  transparent: true,
});

/**
 * Models
 */

gltfLoader.load("./mediterraneanDrive.glb", (gltf) => {
  gltf.scene.traverse((child) => {
    if (/.*light.*/.test(child.name)) {
      
     child.material = poleLightMaterial;
    } else {
      if (/.*alpha.*/.test(child.name)) child.material = alphaBakedMaterial;
      else child.material = bakedMaterial;
    }
  });

  scene.add(gltf.scene);
});

/**
 * fireflies
 */

const fireFliesGeometry = new THREE.BufferGeometry();
const fireFliesCount = 15;

const firefliesPositions = new Float32Array(fireFliesCount * 3);
const firefliesScale = new Float32Array(fireFliesCount * 1);

for (let i = 0; i < firefliesPositions.length; i++) {
  const i3 = i * 3;
  firefliesPositions[i3 + 0] = (Math.random() - 0.5) * 4;
  firefliesPositions[i3 + 1] = Math.random() * 1.5;
  firefliesPositions[i3 + 2] = (Math.random() - 0.5) * 4;

  // scale
  firefliesScale[i] = Math.random();
}

fireFliesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(firefliesPositions, 3)
);

fireFliesGeometry.setAttribute(
  "aScale",
  new THREE.BufferAttribute(firefliesScale, 1)
);

const fireFliesMaterial = new THREE.ShaderMaterial({
  vertexShader: firefliesVertex,
  fragmentShader: firefliesFragment,
  uniforms: {
    uPixelRatio: new THREE.Uniform(Math.min(window.devicePixelRatio, 2)),
    uResolution: new THREE.Uniform(
      new THREE.Vector2(
        window.innerWidth * Math.min(window.devicePixelRatio, 2),
        window.innerHeight * Math.min(window.devicePixelRatio, 2)
      )
    ),
    uSize: new THREE.Uniform(40),
    uTime: new THREE.Uniform(0),
  },
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

const fireFlies = new THREE.Points(fireFliesGeometry, fireFliesMaterial);
fireFlies.position.y = 4;
fireFlies.position.z = -4;

scene.add(fireFlies);

// tweaks
gui.add(fireFliesMaterial.uniforms.uSize, "value", 1, 500, 1).name("uSize");

/**
 * Water
 */
// Geometry
const waterGeometry = new THREE.PlaneGeometry(20, 20, 512, 512);

// Material
const waterMaterial = new THREE.ShaderMaterial({
  vertexShader: waterVertexShader,
  fragmentShader: waterFragmentShader,
  uniforms: {
    uTime: { value: 0 },

    uBigWavesElevation: { value: 0.036 },
    uBigWavesFrequency: { value: new THREE.Vector2(5.383, 1.98) },
    uBigWavesSpeed: { value: 0.854 },

    uSmallWavesElevation: { value: 0.4 },
    uSmallWavesFrequency: { value: 0.75 },
    uSmallWavesSpeed: { value: 0.2 },
    uSmallIterations: { value: 3 },

    uDepthColor: { value: new THREE.Color(debugObject.depthColor) },
    uSurfaceColor: { value: new THREE.Color(debugObject.surfaceColor) },
    uColorOffset: { value: 0.376 },
    uColorMultiplier: { value: 1.052 },
  },
});

// Mesh
const water = new THREE.Mesh(waterGeometry, waterMaterial);
water.rotation.x = -Math.PI * 0.5;
water.position.z = -18;
scene.add(water);

// debug
const waterTweak = gui.addFolder("Water");
waterTweak.addColor(debugObject, "depthColor").onChange(() => {
  waterMaterial.uniforms.uDepthColor.value.set(debugObject.depthColor);
  renderer.setClearColor(debugObject.depthColor);
});
waterTweak.addColor(debugObject, "surfaceColor").onChange(() => {
  waterMaterial.uniforms.uSurfaceColor.value.set(debugObject.surfaceColor);
});

waterTweak
  .add(waterMaterial.uniforms.uBigWavesElevation, "value")
  .min(0)
  .max(1)
  .step(0.001)
  .name("uBigWavesElevation");
waterTweak
  .add(waterMaterial.uniforms.uBigWavesFrequency.value, "x")
  .min(0)
  .max(10)
  .step(0.001)
  .name("uBigWavesFrequencyX");
waterTweak
  .add(waterMaterial.uniforms.uBigWavesFrequency.value, "y")
  .min(0)
  .max(10)
  .step(0.001)
  .name("uBigWavesFrequencyY");
waterTweak
  .add(waterMaterial.uniforms.uBigWavesSpeed, "value")
  .min(0)
  .max(4)
  .step(0.001)
  .name("uBigWavesSpeed");

waterTweak
  .add(waterMaterial.uniforms.uSmallWavesElevation, "value")
  .min(0)
  .max(1)
  .step(0.001)
  .name("uSmallWavesElevation");
waterTweak
  .add(waterMaterial.uniforms.uSmallWavesFrequency, "value")
  .min(0)
  .max(30)
  .step(0.001)
  .name("uSmallWavesFrequency");
waterTweak
  .add(waterMaterial.uniforms.uSmallWavesSpeed, "value")
  .min(0)
  .max(4)
  .step(0.001)
  .name("uSmallWavesSpeed");
waterTweak
  .add(waterMaterial.uniforms.uSmallIterations, "value")
  .min(0)
  .max(5)
  .step(1)
  .name("uSmallIterations");

waterTweak
  .add(waterMaterial.uniforms.uColorOffset, "value")
  .min(0)
  .max(1)
  .step(0.001)
  .name("uColorOffset");
waterTweak
  .add(waterMaterial.uniforms.uColorMultiplier, "value")
  .min(0)
  .max(10)
  .step(0.001)
  .name("uColorMultiplier");

/**
 * Moon
 */

const moonGeometry = new THREE.CircleGeometry(0.75, 32);
const moonMaterial = new THREE.MeshBasicMaterial({
  color: "#ffffff",
  alphaMap: moonAlphaTxt,
  transparent: true,
});

const moon = new THREE.Mesh(moonGeometry, moonMaterial);
moon.position.set(4, 5, -30);

scene.add(moon);


/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
sizes.resolution = new THREE.Vector2(
  sizes.width * Math.min(window.devicePixelRatio, 2),
  sizes.height * Math.min(window.devicePixelRatio, 2)
);

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  sizes.resolution.set(
    sizes.width * Math.min(window.devicePixelRatio, 2),
    sizes.height * Math.min(window.devicePixelRatio, 2)
  );
  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // update materials
  fireFliesMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
  fireFliesMaterial.uniforms.uResolution.value = sizes.resolution;
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 12;
camera.position.y = 4;
camera.position.z = 14;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(debugObject.depthColor);

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();
  // update materials
  fireFliesMaterial.uniforms.uTime.value = elapsedTime;
  waterMaterial.uniforms.uTime.value = elapsedTime;
  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
