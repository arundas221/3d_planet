import * as THREE from "three";
import gsap from "gsap";
import earthVertex from "../shaders/earth/vertex.glsl";
import earthFragment from "../shaders/earth/fragment.glsl";
import atmosphereVertex from "../shaders/atmosphere/vertex.glsl";
import atmosphereFragment from "../shaders/atmosphere/fragment.glsl";
import ScrollTrigger from "gsap/dist/ScrollTrigger"

const initPlanet3D = (): { scene: THREE.Scene, renderer: THREE.WebGLRenderer } => {
  const canvas = document.querySelector("canvas.planet-3D") as HTMLCanvasElement;

  // scene
  const scene = new THREE.Scene();

  //camera
  const size = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: window.devicePixelRatio,
  }

  const camera = new THREE.PerspectiveCamera(15, size.width / size.height, 0.1, 1000);
  camera.position.x = 0;
  camera.position.y = 2.15;
  camera.position.z = 4.5;
  scene.add(camera);

  // renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(size.width, size.height);
  renderer.setPixelRatio(size.pixelRatio);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  //texture
  const TL = new THREE.TextureLoader();
  const dayTexture = TL.load("./earth/day.jpg");
  const nightTexture = TL.load("./earth/night.jpg");
  const specularTexture = TL.load("./earth/specularClouds.jpg");

  dayTexture.colorSpace = THREE.SRGBColorSpace;
  nightTexture.colorSpace = THREE.SRGBColorSpace;

  const baseAnisotropy = renderer.capabilities.getMaxAnisotropy();

  dayTexture.anisotropy = baseAnisotropy;
  nightTexture.anisotropy = baseAnisotropy;
  specularTexture.anisotropy = baseAnisotropy;

  //geomatry
  const earthGeomatry = new THREE.SphereGeometry(2, 64, 64);
  const atmosphereGeomatry = new THREE.SphereGeometry(2, 64, 64);

  const atmosphereDayColor = "#4a96e8";
  const atmosphereTwilightColor = "#1950E5";
  //material
  const earthMaterial = new THREE.ShaderMaterial({
    vertexShader: earthVertex,
    fragmentShader: earthFragment,
    uniforms: {
      uDayTexture: new THREE.Uniform(dayTexture),
      uNightTexture: new THREE.Uniform(nightTexture),
      uSpecularTexture: new THREE.Uniform(specularTexture),
      uSunDirection: new THREE.Uniform(new THREE.Vector3(-1, 0, 0)),
      uAtmosphereDayColor: new THREE.Uniform(
        new THREE.Color(atmosphereDayColor),
      ),
      uAtmosphereTwilightColor: new THREE.Uniform(
        new THREE.Color(atmosphereTwilightColor),
      ),
    },
    transparent: true,
  })

  const atmosphereMaterial = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.BackSide,
    vertexShader: atmosphereVertex,
    fragmentShader: atmosphereFragment,
    uniforms: {
      uOpacity: { value: 1 },
      uSunDirection: new THREE.Uniform(new THREE.Vector3(-1, 0, 0)),
      uAtmosphereDayColor: new THREE.Uniform(
        new THREE.Color(atmosphereDayColor),
      ),
      uAtmosphereTwilightColor: new THREE.Uniform(
        new THREE.Color(atmosphereTwilightColor),
      )
    },
    depthWrite: false,
  });

  const earth = new THREE.Mesh(earthGeomatry, earthMaterial);
  const atmosphere = new THREE.Mesh(atmosphereGeomatry, atmosphereMaterial);
  atmosphere.scale.set(1.13, 1.13, 1.13);

  const earthGroup = new THREE.Group().add(earth, atmosphere);

  let sunSperical = new THREE.Spherical(1, Math.PI * 0.48, -1.8);
  const sunDirection = new THREE.Vector3(1, 0, 0);

  sunDirection.setFromSpherical(sunSperical);

  earthMaterial.uniforms.uSunDirection.value.copy(sunDirection);
  atmosphereMaterial.uniforms.uSunDirection.value.copy(sunDirection);

  scene.add(earthGroup);

  gsap.registerPlugin(ScrollTrigger);
  gsap.timeline({
    scrollTrigger: {
      trigger: ".hero_main",
      start: () => "top top",
      scrub: 3,
      anticipatePin: 1,
      pin: true,
    },
  })

    .to(
      "hero_main .content",
      {
        filter: `blur(40px)`,
        autoAlpha: 0,
        scale: 0.5,
        duration: 2,
        ease: "power1.inOut",
      },
      "setting",
    )
    .to(
      camera.position,
      {
        y: 0.1,
        z: window.innerWidth > 768 ? 19 : 30,
        x: window.innerWidth > 768 ? 0 : 0.1,
        duration: 2,
        eaese: "power1.inOut",
      },
      "setting",
    )

  let isHovered = false;
  let isDragging = false;
  let previousMouseX = 0;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(-1, -1);

  window.addEventListener("mousedown", (event) => {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(earth);
    if (intersects.length > 0) {
      isDragging = true;
      previousMouseX = event.clientX;
    }
  });

  window.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    if (isDragging) {
      const deltaX = event.clientX - previousMouseX;
      currentRotation += deltaX * 0.005;
      previousMouseX = event.clientX;
    }
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
  });

  let lastTime = 0;
  let currentRotation = 0;

  //animate
  gsap.ticker.add((time) => {
    const deltaTime = time - lastTime;
    lastTime = time;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(earth);
    isHovered = intersects.length > 0;

    if (!isHovered && !isDragging) {
      currentRotation += deltaTime * 0.2;
    }

    earth.rotation.y = currentRotation;
    renderer.render(scene, camera);
  })
  gsap.ticker.lagSmoothing(0)

  window.addEventListener("resize", () => {
    size.width = window.innerWidth;
    size.height = window.innerHeight;
    size.pixelRatio = window.devicePixelRatio;

    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();

    renderer.setSize(size.width, size.height);
    renderer.setPixelRatio(size.pixelRatio);
  });


  return { scene, renderer };
};

export default initPlanet3D;