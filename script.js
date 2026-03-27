// ============================================================
//  script.js — Dipak Photo
// ============================================================

// --- Navbar Scroll Effect ---
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('navbar-scrolled');
        navbar.classList.remove('py-4');
        navbar.classList.add('py-2');
    } else {
        navbar.classList.remove('navbar-scrolled');
        navbar.classList.add('py-4');
        navbar.classList.remove('py-2');
    }
});

// --- Three.js Setup & Canvas ---
const container = document.getElementById('canvas-container');

const scene    = new THREE.Scene();
const camera   = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.z = 5.5;

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xc9a84c, 3, 20);
pointLight.position.set(2, 3, 4);
scene.add(pointLight);

const fillLight = new THREE.PointLight(0x00e5ff, 1.5, 20);
fillLight.position.set(-3, -2, 2);
scene.add(fillLight);

const flashLight = new THREE.PointLight(0xffffff, 0, 15);
flashLight.position.set(0, 1, 4);
scene.add(flashLight);

const cameraGroup = new THREE.Group();
scene.add(cameraGroup);

const loader = new THREE.GLTFLoader();
loader.load(
    'models/camera_with_tripod.glb',
    function (gltf) {
        const cameraModel = gltf.scene;
        const initialBox  = new THREE.Box3().setFromObject(cameraModel);
        const initialSize = initialBox.getSize(new THREE.Vector3());
        const maxDim      = Math.max(initialSize.x, initialSize.y, initialSize.z);

        cameraModel.scale.set(8.0 / maxDim, 8.0 / maxDim, 8.0 / maxDim);
        cameraModel.rotation.y = Math.PI;
        cameraModel.updateMatrixWorld(true);

        const finalBox  = new THREE.Box3().setFromObject(cameraModel);
        const center    = finalBox.getCenter(new THREE.Vector3());
        const finalSize = finalBox.getSize(new THREE.Vector3());

        cameraModel.position.x -= center.x;
        cameraModel.position.y -= center.y;
        cameraModel.position.z -= center.z;
        cameraModel.position.y -= (finalSize.y * 0.4);

        cameraGroup.add(cameraModel);
        cameraGroup.rotation.y = -Math.PI / 8;
        cameraGroup.rotation.x = Math.PI / 16;
    },
    (xhr) => console.log(Math.round(xhr.loaded / xhr.total * 100) + '% loaded'),
    (error) => console.error('Model load error:', error)
);

window.addEventListener('resize', () => {
    if (!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
const windowHalfX      = window.innerWidth / 2;
const windowHalfY      = window.innerHeight / 2;
const mouseNormalized  = new THREE.Vector2(-1, -1);
const raycaster        = new THREE.Raycaster();

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX) * 0.001;
    mouseY = (event.clientY - windowHalfY) * 0.001;

    if (container) {
        const rect   = container.getBoundingClientRect();
        const xInside = event.clientX - rect.left;
        const yInside = event.clientY - rect.top;
        mouseNormalized.x = (xInside / rect.width) * 2 - 1;
        mouseNormalized.y = -(yInside / rect.height) * 2 + 1;
    }
});

function animate() {
    requestAnimationFrame(animate);

    targetX = mouseX * 0.5;
    targetY = mouseY * 0.5;

    const targetRotationY = -Math.PI / 8 + (window.scrollY * 0.005) + targetX;
    const targetRotationX = Math.PI / 16 + targetY;

    cameraGroup.rotation.y += 0.05 * (targetRotationY - cameraGroup.rotation.y);
    cameraGroup.rotation.x += 0.05 * (targetRotationX - cameraGroup.rotation.x);

    if (cameraGroup.children.length > 0) {
        raycaster.setFromCamera(mouseNormalized, camera);
        const intersects     = raycaster.intersectObject(cameraGroup, true);
        const targetIntensity = intersects.length > 0 ? 10 : 0;
        flashLight.intensity += (targetIntensity - flashLight.intensity) * 0.1;
    }

    renderer.render(scene, camera);
}
animate();

// --- GSAP ScrollTrigger ---
gsap.registerPlugin(ScrollTrigger);

gsap.from("#hero h1", { y: 50, opacity: 0, duration: 1, ease: "power3.out", delay: 0.2 });
gsap.from("#hero p",  { y: 30, opacity: 0, duration: 1, ease: "power3.out", delay: 0.4 });

// ============================================================
//  STAR RATING — inline SVG, no CDN dependency
// ============================================================
const starRatingEl = document.getElementById('star-rating');
const stars        = starRatingEl ? Array.from(starRatingEl.querySelectorAll('.star-item')) : [];

window.currentRating = 0;

function updateStars(rating) {
    window.currentRating = rating;
    stars.forEach(s => {
        const val = parseInt(s.getAttribute('data-value'));
        if (val <= rating) {
            s.style.color  = '#c9a84c';
            s.style.fill   = '#c9a84c';
            s.style.stroke = '#c9a84c';
        } else {
            s.style.color  = '#4b5563';
            s.style.fill   = 'none';
            s.style.stroke = '#4b5563';
        }
    });
    const lbl = document.getElementById('star-label');
    if (lbl) lbl.textContent = rating > 0 ? `${rating} / 5` : 'Select a rating';
}

window.updateStars = updateStars;
updateStars(0);  // start empty — user must pick

stars.forEach(star => {
    star.addEventListener('click', () => updateStars(parseInt(star.getAttribute('data-value'))));
    star.addEventListener('mouseenter', () => {
        const hoverVal = parseInt(star.getAttribute('data-value'));
        stars.forEach(s => {
            const v = parseInt(s.getAttribute('data-value'));
            s.style.color  = v <= hoverVal ? '#c9a84c' : '#4b5563';
            s.style.fill   = v <= hoverVal ? '#c9a84c' : 'none';
            s.style.stroke = v <= hoverVal ? '#c9a84c' : '#4b5563';
        });
    });
    star.addEventListener('mouseleave', () => updateStars(window.currentRating));
});

// ============================================================
//  LIGHTBOX
// ============================================================
const lightbox        = document.getElementById('lightbox');
const lightboxImg     = document.getElementById('lightbox-img');
const lightboxClose   = document.getElementById('lightbox-close');
const portfolioItems  = document.querySelectorAll('.portfolio-item');

if (lightbox && portfolioItems) {
    portfolioItems.forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            if (img) {
                lightbox.classList.remove('hidden');
                lightbox.classList.add('flex');
                lightboxImg.src = img.src;
                setTimeout(() => {
                    lightbox.classList.remove('opacity-0');
                    lightboxImg.classList.remove('scale-95');
                    lightboxImg.classList.add('scale-100');
                }, 20);
            }
        });
    });

    const closeLightbox = () => {
        lightbox.classList.add('opacity-0');
        lightboxImg.classList.remove('scale-100');
        lightboxImg.classList.add('scale-95');
        setTimeout(() => {
            lightbox.classList.add('hidden');
            lightbox.classList.remove('flex');
            lightboxImg.src = '';
        }, 300);
    };

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
}