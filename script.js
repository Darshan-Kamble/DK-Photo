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

// Basic scene, camera, renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.z = 5.5;

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xc9a84c, 3, 20);
pointLight.position.set(2, 3, 4);
scene.add(pointLight);

const fillLight = new THREE.PointLight(0x00e5ff, 1.5, 20);
fillLight.position.set(-3, -2, 2);
scene.add(fillLight);

// Flickering Camera Flash Effect
const flashLight = new THREE.PointLight(0xffffff, 0, 15);
flashLight.position.set(0, 1, 4); // Positioned right in front of the camera
scene.add(flashLight);

// Interactive hover light logic moved to the animate loop below

// Create a group to hold our loaded model
const cameraGroup = new THREE.Group();
scene.add(cameraGroup);

// Initialize the GLTF Loader
const loader = new THREE.GLTFLoader();

// Load the model
loader.load(
    'models/camera_with_tripod.glb',
    function (gltf) {
        const cameraModel = gltf.scene;
        
        // 1. Initial Scale & Rotation
        const initialBox = new THREE.Box3().setFromObject(cameraModel);
        const initialSize = initialBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(initialSize.x, initialSize.y, initialSize.z);
        
        // Force the model to be much larger (zoomed in)
        cameraModel.scale.set(8.0 / maxDim, 8.0 / maxDim, 8.0 / maxDim);
        
        // The model natively faces backwards; rotate it 180 degrees BEFORE measuring final bounds
        cameraModel.rotation.y = Math.PI;
        
        // Force Three.js to compute the new local matrices
        cameraModel.updateMatrixWorld(true);

        // 2. Measure exactly where it is now
        const finalBox = new THREE.Box3().setFromObject(cameraModel);
        const center = finalBox.getCenter(new THREE.Vector3());
        const finalSize = finalBox.getSize(new THREE.Vector3());

        // 3. Shift the center to exactly 0,0,0 
        cameraModel.position.x -= center.x;
        cameraModel.position.y -= center.y;
        cameraModel.position.z -= center.z;

        // 4. Shift downwards heavily so the camera body at the top of the tripod is in the center view
        cameraModel.position.y -= (finalSize.y * 0.4);

        cameraGroup.add(cameraModel);
        
        // Initial rotation
        cameraGroup.rotation.y = -Math.PI / 8;
        cameraGroup.rotation.x = Math.PI / 16;
    },
    function (xhr) {
        console.log((Math.round(xhr.loaded / xhr.total * 100)) + '% loaded'); 
    },
    function (error) {
        console.error('An error happened loading the model:', error);
    }
);

// Handle resize
window.addEventListener('resize', () => {
    if(!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

// Setup Mouse Interaction & Raycasting variables
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;
const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

const mouseNormalized = new THREE.Vector2(-1, -1);
const raycaster = new THREE.Raycaster();

document.addEventListener('mousemove', (event) => {
    // Keep subtle parallax relative to the window center
    mouseX = (event.clientX - windowHalfX) * 0.001;
    mouseY = (event.clientY - windowHalfY) * 0.001;
    
    // For 3D hit detection, we must calculate the exact bounds of the canvas container
    // Because the canvas is only 50% width on Desktop
    if (container) {
        const rect = container.getBoundingClientRect();
        
        // Maps the mouse position purely within the right-hand canvas area
        const xInside = event.clientX - rect.left;
        const yInside = event.clientY - rect.top;

        mouseNormalized.x = (xInside / rect.width) * 2 - 1;
        mouseNormalized.y = -(yInside / rect.height) * 2 + 1;
    }
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    targetX = mouseX * 0.5;
    targetY = mouseY * 0.5;
    
    // Target rotation based on scroll + subtle mouse parallax
    let targetRotationY = -Math.PI / 8 + (window.scrollY * 0.005) + targetX;
    let targetRotationX = Math.PI / 16 + targetY;
    
    // Smooth dampening
    cameraGroup.rotation.y += 0.05 * (targetRotationY - cameraGroup.rotation.y);
    cameraGroup.rotation.x += 0.05 * (targetRotationX - cameraGroup.rotation.x);
    
    // Interactive hover lighting
    if (cameraGroup.children.length > 0) {
        raycaster.setFromCamera(mouseNormalized, camera);
        const intersects = raycaster.intersectObject(cameraGroup, true);
        
        let targetIntensity = intersects.length > 0 ? 10 : 0;
        // Smoothly brighten or dim the light over the camera
        flashLight.intensity += (targetIntensity - flashLight.intensity) * 0.1;
    }

    renderer.render(scene, camera);
}
animate();

// --- GSAP ScrollTrigger ---
gsap.registerPlugin(ScrollTrigger);

// Hero elements animation
gsap.from("#hero h1", {
    y: 50,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
    delay: 0.2
});
gsap.from("#hero p", {
    y: 30,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
    delay: 0.4
});
// CTA button animation removed to fix visibility

// Animations for headers and service cards removed to ensure they are always clearly visible.

// --- Review Form Logic ---
const starRating = document.getElementById('star-rating');
const stars = starRating.querySelectorAll('.star-item');
let currentRating = 5;

updateStars(currentRating);

stars.forEach(star => {
    star.addEventListener('click', (e) => {
        // Find the actual <i> even if clicked on a path/svg child
        const targetIcon = e.target.closest('i');
        if(targetIcon) {
            currentRating = parseInt(targetIcon.getAttribute('data-value'));
            updateStars(currentRating);
        }
    });
});

function updateStars(rating) {
    stars.forEach(s => {
        const val = parseInt(s.getAttribute('data-value'));
        if (val <= rating) {
            s.classList.remove('text-gray-600');
            s.classList.add('text-accent', 'fill-accent');
        } else {
            s.classList.add('text-gray-600');
            s.classList.remove('text-accent', 'fill-accent');
            s.classList.remove('fill-currentColor');
        }
    });
}

const reviewForm = document.getElementById('review-form');
const reviewCarousel = document.getElementById('review-carousel');
const reviewerNameInput = document.getElementById('reviewer-name');
const reviewTextInput = document.getElementById('review-text');

reviewForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = reviewerNameInput.value.trim();
    const text = reviewTextInput.value.trim();
    
    if(!name || !text) return;

    // Generate stars HTML
    let starsHtml = '';
    for(let i=1; i<=5; i++) {
        if(i <= currentRating) {
            starsHtml += `<i data-lucide="star" class="fill-accent w-4 h-4 text-accent"></i>`;
        } else {
            starsHtml += `<i data-lucide="star" class="w-4 h-4 text-gray-600"></i>`;
        }
    }

    const newCard = document.createElement('div');
    newCard.className = 'review-card bg-[#1a1a1a] p-10 border border-gray-800 rounded opacity-0 translate-y-4 transition-all duration-500';
    newCard.innerHTML = `
        <div class="flex text-accent mb-4 gap-1">
            ${starsHtml}
        </div>
        <p class="text-gray-300 italic mb-6">"${text}"</p>
        <div class="font-bold text-white">- ${name}</div>
    `;

    reviewCarousel.appendChild(newCard);
    
    // Re-init lucide icons for new elements inside the carousel
    lucide.createIcons();

    // Reset form
    reviewForm.reset();
    currentRating = 5;
    updateStars(5);

    // Animate in
    setTimeout(() => {
        newCard.classList.remove('opacity-0', 'translate-y-4');
    }, 50);

    // Scroll to the end of carousel
    setTimeout(() => {
        reviewCarousel.scrollTo({
            left: reviewCarousel.scrollWidth,
            behavior: 'smooth'
        });
    }, 100);
});

// --- Lightbox Logic ---
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');
const portfolioItems = document.querySelectorAll('.portfolio-item');

if (lightbox && portfolioItems) {
    portfolioItems.forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            if (img) {
                // Remove hidden first so it switches to flex
                lightbox.classList.remove('hidden');
                lightbox.classList.add('flex');
                
                // Immediately set img src
                lightboxImg.src = img.src;
                
                // Small delay for CSS transition to trigger after display change
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
        
        // Wait for opacity transition before hiding completely
        setTimeout(() => {
            lightbox.classList.add('hidden');
            lightbox.classList.remove('flex');
            lightboxImg.src = '';
        }, 300);
    };

    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }
    
    lightbox.addEventListener('click', (e) => {
        // Only close if clicking the actual background container, not the image itself
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
}
