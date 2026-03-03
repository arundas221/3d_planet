import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface IndiaViewerOptions {
    container: HTMLElement;
    texturePath: string;
}

const initIndiaViewer = (options: IndiaViewerOptions): { setTexture: (path: string) => void; dispose: () => void } => {
    const { container, texturePath } = options;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);

    // Camera - Perspective but low FOV for flat 2D feel
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.z = 10;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Texture Loader
    const loader = new THREE.TextureLoader();
    const texture = loader.load(texturePath, (tex) => {
        // Adjust plane aspect ratio to match image
        const aspect = tex.image.width / tex.image.height;
        mesh.scale.set(aspect * 10, 10, 1);
    });

    // Flat Image Plane
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Controls - Configured for 2D pan/zoom
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = false; // Stay flat
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.minDistance = 2; // Maximum zoom in
    controls.maxDistance = 20; // Maximum zoom out

    // Intuitive pan: Left click drag = Pan
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE
    };

    // Animation Loop
    let animationId: number;
    const animate = () => {
        animationId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener("resize", handleResize);

    return {
        setTexture: (path: string) => {
            loader.load(path, (tex) => {
                material.map = tex;
                material.needsUpdate = true;
                // Update plane aspect ratio to match new image
                const aspect = tex.image.width / tex.image.height;
                mesh.scale.set(aspect * 10, 10, 1);
            });
        },
        dispose: () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener("resize", handleResize);
            controls.dispose();
            renderer.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        }
    };
};

export default initIndiaViewer;
