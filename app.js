var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

var controls = new THREE.OrbitControls(camera, renderer.domElement);
camera.position.set(120, 55, -20);
controls.update();

var sunlight = new THREE.DirectionalLight(0xffffff, 1);
sunlight.position.set(100, 200, 100);
sunlight.castShadow = true;
sunlight.shadow.mapSize.width = 2048;
sunlight.shadow.mapSize.height = 2048;
scene.add(sunlight);

var ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

var dracoLoader = new THREE.DRACOLoader();
dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');

var gltfLoader = new THREE.GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

var model, ground, ground2;

document.getElementById('loading-screen').style.display = 'block';

gltfLoader.load('assets/everest2.glb', function(gltf) {
    model = gltf.scene;

    model.traverse(function(node) {
        if (node.isMesh) {
            ground = new THREE.Mesh(node.geometry, new THREE.MeshStandardMaterial({
                color: 0xffffff,
                side: THREE.DoubleSide,
                vertexColors: true,
                transparent: true,
                opacity: 0.8
            }));
            ground.rotation.x = Math.PI;
            applyGradient(ground);

            scene.add(ground);

            ground2 = ground.clone();
            ground2.material = ground.material.clone();
            ground2.material.color.set(0x000000);
            ground2.material.wireframe = true;
            ground2.material.opacity = 0.5;
            scene.add(ground2);
        }
    });

    model.position.set(0, 0, 0);
    document.getElementById('loading-screen').style.display = 'none';

}, undefined, function(error) {
    console.error(error);
});

var c1 = 0.8;
var c2 = 0.4;

function applyGradient(mesh) {
    var geometry = mesh.geometry;
    var colors = [];

    var position = geometry.attributes.position;
    var minHeight = Infinity;
    var maxHeight = -Infinity;

    for (let i = 0; i < position.count; i++) {
        let y = position.getY(i);
        if (y > maxHeight) maxHeight = y;
        if (y < minHeight) minHeight = y;
    }

    for (let i = 0; i < position.count; i++) {
        let y = position.getY(i);
        let normalizedY = (y - minHeight) / (maxHeight - minHeight);

        let color = new THREE.Color().setHSL(c1 - c2 * normalizedY, 1, 0.5);
        colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
}



var gui = new dat.GUI();
var settings = {
    wireframeOpacity: 0.5,
    fillOpacity: 0.8,
    color1: 0.8,
    color2: 0.4,
    showMarkers: true,
    rotationSpeed: 0.01,
    backgroundColor: "#000000"
};
gui.add(settings, 'showMarkers').name('Show Markers')
gui.addColor(settings, 'backgroundColor').name('Background').onChange(function(value) {
    scene.background = new THREE.Color(value); 
});

gui.add(settings, 'wireframeOpacity', 0, 1).name('Wireframe Opacity').onChange(function(value) {
    ground2.material.opacity = value;
});

gui.add(settings, 'fillOpacity', 0, 1).name('Fill Opacity').onChange(function(value) {
    ground.material.opacity = value;
});
gui.add(settings, 'color1', 0, 1).name('Color Gradient 1').onChange(function(value) {
    c1 = value;
    applyGradient(ground);
});
gui.add(settings, 'color2', 0, 1).name('Color Gradient 1').onChange(function(value) {
    c2 = value;
    applyGradient(ground);
});
gui.add(settings, 'rotationSpeed', 0, 0.05).name('Rotation speed').onChange(function(value) {
    rotationSpeed = value;
});





var positions = {
    basecamp: { x: 80, y: 8, z: -4 },
    camp1: { x: 70, y: 10, z: -10 },
    camp2: { x: 55, y: 13, z: -18 },
    camp3: { x: 43, y: 20, z: -28 },
    camp4: { x: 30, y: 27, z: -19 },
    summit: { x: 39, y: 35, z: -3 }
};

var markers = [
    createHTMLMarker(positions.basecamp, 'Base Camp - 5,364m', 'popup-basecamp'),
    createHTMLMarker(positions.camp1, 'Camp 1 - 6,065m', 'popup-camp1'),
    createHTMLMarker(positions.camp2, 'Camp 2 - 6,400m', 'popup-camp2'),
    createHTMLMarker(positions.camp3, 'Camp 3 - 7,162m', 'popup-camp3'),
    createHTMLMarker(positions.camp4, 'Camp 4 - 7,925m', 'popup-camp4'),
    createHTMLMarker(positions.summit, 'Summit - 8,848m', 'popup-summit')
];

function createHTMLMarker(position, label, popupId) {
    var markerDiv = document.createElement('div');
    markerDiv.className = 'html-marker';
    markerDiv.innerHTML = `<div class="marker-content hidden">${label}</div>`; 
    document.body.appendChild(markerDiv);
    markerDiv.style.display = 'block';
    return { markerDiv: markerDiv, position: new THREE.Vector3(position.x, position.y, position.z), popupId: popupId };
}

markers.forEach(function(markerObj) {
    markerObj.markerDiv.addEventListener('click', function() {
        rotationSpeed = 0;
        centerCameraOnMarker(markerObj.position);
        showPopup(markerObj.popupId);  
    });
});


function onMouseMove(event) {
    var mouseX = event.clientX;
    var mouseY = event.clientY;

    markers.forEach(function(markerObj) {
        var markerContent = markerObj.markerDiv.querySelector('.marker-content');
        var rect = markerObj.markerDiv.getBoundingClientRect();
        
        if (mouseX > rect.left && mouseX < rect.right && mouseY > rect.top && mouseY < rect.bottom) {
            markerContent.classList.remove('hidden'); 
        } else {
            markerContent.classList.add('hidden');  
        }
    });
}

function updateHTMLMarkers() {
    markers.forEach(function(markerObj) 
    {
        var vector = markerObj.position.clone();
        
        vector.applyAxisAngle(new THREE.Vector3(0, 1, 0), scene.rotation.y);

        vector.project(camera);

        var x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        var y = (1 - vector.y * 0.5 - 0.5) * window.innerHeight;

        markerObj.markerDiv.style.left = `${x}px`;
        markerObj.markerDiv.style.top = `${y}px`;

        if (vector.z < -1 || vector.z > 1 || !settings.showMarkers) {
            markerObj.markerDiv.style.display = 'none';
        } else {
            markerObj.markerDiv.style.display = 'block';
        }
    });
}


window.addEventListener('mousemove', onMouseMove, false);

function centerCameraOnMarker(markerPosition) {
    var adjustedPosition = markerPosition.clone();

    adjustedPosition.applyAxisAngle(new THREE.Vector3(0, 1, 0), scene.rotation.y);

    gsap.to(camera.position, {
        duration: 1.5,
        x: adjustedPosition.x + 20,
        y: adjustedPosition.y + 20, 
        z: adjustedPosition.z + 20, 
        ease: "power2.inOut"
    });

    controls.target.set(adjustedPosition.x, adjustedPosition.y, adjustedPosition.z);
    controls.update();
}


function showPopup(popupId) {
    var allPopups = document.querySelectorAll('.popup');
    allPopups.forEach(function(popup) {
        popup.style.transform = 'translateX(-100%)'; 
    });

    var popup = document.getElementById(popupId);
    popup.style.transform = 'translateX(0)';
}

function hidePopup(popupId) {
    var popup = document.getElementById(popupId);
    popup.style.transform = 'translateX(-100%)'; 
}


window.onload = function() {
    var popup = document.getElementById('popup');
    popup.style.transform = 'translateX(-100%)';  
};

var gr1 = 0;
var gr2 = 0;
var rotationSpeed = 0;

function animate() {
    requestAnimationFrame(animate);
    scene.rotation.y += rotationSpeed;
    updateHTMLMarkers();

    controls.update();
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', function() {
    var width = window.innerWidth;
    var height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

