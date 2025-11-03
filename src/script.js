import GUI from "lil-gui";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import firefliesVertex from "./shaders/fireflies/vertex.glsl";
import firefliesFragment from "./shaders/fireflies/fragment.glsl";
import alphaVertex from "./shaders/alpha/vertex.glsl";
import alphaFragment from "./shaders/alpha/fragment.glsl";
import leafVertex from "./shaders/leaf/vertex.glsl";
import leafFragment from "./shaders/leaf/fragment.glsl";
import waterFragmentShader from "./shaders/water/water/fragment.glsl";
import waterVertexShader from "./shaders/water/water/vertex.glsl";


/**
 * Base
 */
const listener = new THREE.AudioListener();

// Debug
const debugObject = {
  depthColor: "#1a1805",
  surfaceColor: "#042c71",
  colorMoon: "#70a5ff",
  moonPosition: new THREE.Vector2(0.55, 1.0),
};

const gui = new GUI({
  width: 400,
});

gui.close()
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Loaders
 */

const loadingBarElement = document.querySelector(".loading-bar");
const startButton = document.querySelector(".button-79");
startButton.onclick = () => {
   startButton.style.background = "#ffffff00";
    startButton.style.color = "#ffffff00";
    loadingBarElement.style.color = "#ffffff00";
    loadingBarElement.parentElement.style.background = "#ffffff00";
    loadingBarElement.style.background = "#ffffff00";

    // start sounds
	  music.play();
    ambientSound.play();
   window.setTimeout(() => {
       document.body.removeChild(loadingBarElement.parentElement);
    },2000)

}
const loadingManager = new THREE.LoadingManager(
  // loaded
  () => {
    startButton.style.background = debugObject.surfaceColor;
    startButton.style.color = "#adadad";

    loadingBarElement.textContent = "🌴🚗";
   
  },
  // progress
  (itemUrl, itemLoaded, totalItems) => {
    const progressRatio = itemLoaded / totalItems;
    loadingBarElement.style.transform = `translateX(${ progressRatio * sizes.width * 0.5 - sizes.width * 0.25 }px) scale(-1,1)`;
    
  }
);
// Texture loader
const textureLoader = new THREE.TextureLoader(loadingManager);

// GLTF loader
const gltfLoader = new GLTFLoader(loadingManager);

const audioLoader = new THREE.AudioLoader(loadingManager);




/**
 * Audio
 */
const ambientSound = new THREE.PositionalAudio(listener);
const music = new THREE.Audio(listener);

audioLoader.load("./sounds/144141__alukahn__beach_at_night.mp3",(buffer) => {
  
  ambientSound.setBuffer( buffer );
  ambientSound.setRefDistance(10); // distancia desde donde escuchar
	ambientSound.setLoop( true );
	ambientSound.setVolume( 0.8 );

  
})

audioLoader.load("./sounds/Zambolino_Nighttime_(freetouse.com).mp3",(buffer) => {
  music.setBuffer( buffer );
	music.setLoop( false );
	music.setVolume( 0.1 );
})

/**
 * Textures
 */
const bakedTxt = textureLoader.load("baked_v2_subdivision.jpg");
bakedTxt.colorSpace = THREE.SRGBColorSpace;
bakedTxt.flipY = false; // IMPORTANT¡: the baked image will be flipped if not set to false.


const moonAlphaTxt = textureLoader.load("./moon/alpha.jpg");
moonAlphaTxt.colorSpace = THREE.SRGBColorSpace;

/**
 * Materials
 */
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTxt });
const leafBakedMaterial = new THREE.ShaderMaterial({
  // CSM
  vertexShader: leafVertex,
  fragmentShader: leafFragment,
  uniforms:{
    uMap: new THREE.Uniform(bakedTxt),
    uTime: new THREE.Uniform(0),
    uWindSpeed: new THREE.Uniform(1.5),
    uWindElevation: new THREE.Uniform(0.6),
  },
  side: THREE.DoubleSide,
});

const yellowLightMaterial = new THREE.MeshBasicMaterial({ color: "#F3F359" });
const redLightMaterial = new THREE.MeshBasicMaterial({ color: "#F35959" });

const alphaBakedMaterial = new THREE.ShaderMaterial({
  // CSM
  vertexShader: alphaVertex,
  fragmentShader: alphaFragment,
  uniforms:{
    uMap: new THREE.Uniform(bakedTxt),
    uAlpha: new THREE.Uniform(0.11),
  },
  transparent: true,
});
// tweaks
const guiMaterials = gui.addFolder("Materials");
guiMaterials.add(alphaBakedMaterial.uniforms.uAlpha, "value", 0.001,0.5,0.001).name("uAlpha");
guiMaterials.add(leafBakedMaterial.uniforms.uWindSpeed,"value",0.1, 10, 0.1).name("uWindSpeed");
guiMaterials.add(leafBakedMaterial.uniforms.uWindElevation,"value",0.1, 3, 0.01).name("uWindElevation");

/**
 * Models
 */

gltfLoader.load("./mediterraneanDrive.glb", (gltf) => {
  gltf.scene.traverse((child) => {
    const name = child.name;
    if (/.*light.*/.test(name)) {
      if(name === "car_front_light") child.material = redLightMaterial;
      else child.material = yellowLightMaterial;
    } else {
      if (/.*alpha.*/.test(name)) child.material = alphaBakedMaterial;
      else if(name === "Plane001") child.material = leafBakedMaterial;
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

    uBigWavesElevation: { value: 0.15 },
    uBigWavesFrequency: { value: new THREE.Vector2(0.2, 1.25) },
    uBigWavesSpeed: { value: 0.8 },

    uSmallWavesElevation: { value: 0.1},
    uSmallWavesFrequency: { value: 1 },
    uSmallWavesSpeed: { value: 0},
    uSmallIterations: { value: 1 },

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
water.add(ambientSound);
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
  color: debugObject.colorMoon,
  alphaMap: moonAlphaTxt,
  transparent: true,
});

const moon = new THREE.Mesh(moonGeometry, moonMaterial);
moon.position.set(1, 5, -30);

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
// add audio listener
camera.add(listener);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.45;
controls.dampingFactor = 0.01;
controls.enablePan = false;

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
  leafBakedMaterial.uniforms.uTime.value = elapsedTime;


  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
