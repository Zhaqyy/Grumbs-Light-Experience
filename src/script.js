import * as dat from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
// import * as Stats from 'stats.js'
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";


import nVertex from "./shaders/noise/vertex.glsl";
import nFragment from "./shaders/noise/fragment.glsl";


// const stats = new Stats();
// document.body.appendChild(stats.dom);

// Canvas and scene
const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}



/**
 * Loaders
 */

// Texture loader

// const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Object
 */



//lightssss******************

const ambient = new THREE.AmbientLight(0xffffff, 0.2);

// const point = new THREE.PointLight( 0xDC143C, 1 );
// point.position.set(-14,0,1)

// const pointb = point.clone() 
// point.color= new THREE.Color(0xc341ff);
// pointb.position.set(14,0,1)

const cursorLight = new THREE.SpotLight(0xffffff, 2);

cursorLight.target.position.set(0, 2, 0)
cursorLight.angle = 0.7;
cursorLight.penumbra = 0.5;
cursorLight.decay = 0;
cursorLight.distance = 25;

cursorLight.castShadow = true;
cursorLight.shadow.mapSize.width = 1024;
cursorLight.shadow.mapSize.height = 1024;
cursorLight.shadow.camera.near = 1;
cursorLight.shadow.camera.far = 20;
cursorLight.shadow.focus = 1;
cursorLight.shadow.bias = - 0.0002;
cursorLight.shadow.radius = 4;

scene.add(cursorLight, ambient)


// ****Geometry****

const planegeo = new THREE.PlaneGeometry(sizes.width, sizes.height)

// *****materials**** //

const TextMat = new THREE.MeshStandardMaterial({
    color: "#f9c9f9",
    metalness: 0.5,
    roughness: 0.5,
})

const PlaneMat = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: 1.0,
})

const noiseMat = new THREE.ShaderMaterial({
    uniforms: {
        u_mouse: { value: new THREE.Vector2() },
        u_time: { value: 0 },
        noise_speed: { value: 0.2 },
        metaball: { value: 0.5 },
        discard_threshold: { value: 0.5 },
        antialias_threshold: { value: 0.05 },
        noise_height: { value: 0.5 },
        noise_scale: { value: 10 },
    },
    vertexShader: nVertex,
    fragmentShader: nFragment,
    transparent: true,

})


const glassMat = new THREE.MeshPhysicalMaterial({})
glassMat.reflectivity = 0.5
glassMat.transmission = 1.0
glassMat.roughness = 0.2
glassMat.metalness = 0
glassMat.clearcoat = 1
glassMat.clearcoatRoughness = 0.25
glassMat.color = new THREE.Color(0xffffff)
glassMat.ior = 2
glassMat.thickness = 1.5

// *****Meshh and model****
const planeMesh = new THREE.Mesh(planegeo, PlaneMat)
planeMesh.receiveShadow = true
scene.add(planeMesh)



gltfLoader.load(
    '/grumbsLight.glb',
    (gltf) => {
        const text = gltf.scene.children.find(child => child.name === 'Text')
        const grumbs = gltf.scene.children.find(child => child.name === 'grumbs')
    
         // Just copy the geometry from the loaded model
    const Tgeometry = text.geometry.clone();
    const Ggeometry = grumbs.geometry.clone();

    // Create a new mesh and place it in the scene
    const Tmesh = new THREE.Mesh(Tgeometry, TextMat);
    Tmesh.rotation.x = Math.PI / 2;
    Tmesh.position.set(0, 1.5, 0);
    // Tmesh.scale.set(2, 2, 2);
    Tmesh.castShadow = true


    const Gmesh = new THREE.Mesh(Ggeometry, noiseMat);
    // Gmesh.scale.set(2, 2, 2);
    Gmesh.position.set(0, -1, 1);
    // Gmesh.castShadow = true

    scene.add(Tmesh, Gmesh);


    // Discard the loaded model
    gltf.scene.children.forEach((child) => {
      child.geometry.dispose();
      child.material.dispose();
    });
    }
)

let camera;

// ****mouse movement****

// Create a variable to keep track of mouse position and touch position
const pointer = new THREE.Vector2();

noiseMat.uniforms.u_mouse.value = pointer;

// A function to be called every time the pointer (mouse or touch) moves
function onUpdatePointer(event) {
    event.preventDefault();

    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    updateCursorLight();
}

// Function to update cursor light position based on pointer (mouse or touch)
function updateCursorLight() {
    const vector = new THREE.Vector3(pointer.x, pointer.y, 1);
    vector.unproject(camera);
    const dir = vector.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z;
    const pos = camera.position.clone().add(dir.multiplyScalar(distance));
    cursorLight.position.x = pos.x;
    cursorLight.position.y = pos.y;
    cursorLight.position.z = 1;
}

// Add a listener for the pointermove event
canvas.addEventListener("pointermove", onUpdatePointer, false);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})

renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

renderer.outputColorSpace = THREE.SRGBColorSpace

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

/**
 * Camera
 */

// Camera group
const cameraGroup = new THREE.Group()
scene.add(cameraGroup)

// Base camera
let camZ = 8;
camera = new THREE.PerspectiveCamera(
    45,
    sizes.width / sizes.height,
    0.1,
    100
);
camera.position.set(0, 0, camZ);
camera.lookAt(0, 0, 0);
cameraGroup.add(camera);

// ******Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.enablePan = false
controls.enableRotate = false
controls.enableZoom = false



//*****post processing****

const renderPass = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(sizes.width, sizes.height),
    0.25,
    0,
    0.15
);
bloomPass.resolution.set(sizes.width, sizes.height);

const composer = new EffectComposer(renderer);
composer.addPass(renderPass);
composer.addPass(bloomPass);


//Resize 
window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height

    //mobile responsiveness
    if (sizes.width < sizes.height) {
        camera.position.z = camZ + 5;
    } else {
        camera.position.z = camZ;
    }
    camera.updateProjectionMatrix()

    bloomPass.resolution.set(sizes.width, sizes.height);

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

})

//***** */mobile responsiveness******
if (sizes.width < sizes.height) {
    camera.position.z = camZ + 5;
} else {
    camera.position.z = camZ;
}
camera.updateProjectionMatrix()

// console.log(grumbs);

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    //update shader
    noiseMat.uniforms.u_time.value = elapsedTime

  
    // Render
    // stats.begin()
    renderer.render(scene, camera)
    composer.render();
    // init()
    // stats.end()
    // stats.update()
    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
