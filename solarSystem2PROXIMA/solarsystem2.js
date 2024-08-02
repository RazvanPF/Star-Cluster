// Declared Variables - CONSTANTS
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, antialias: true });
const updateInterval = 100; // Update every 100 milliseconds
const baseSpeed = 0.01;
const overlay = document.getElementById("overlay");
engine.setHardwareScalingLevel(1 / window.devicePixelRatio);
let stopUpdatingTarget = false;

// Declared Variables - LETs
let hasArrived = false; // Flag to track if the spaceship has arrived
let isPlaying = true;
let speedMultiplier = 1.0; // initial speed multiplier
let targetPosition = null;
let pickResult = null;
let currentLitPlanet = null;
let planetLight = null;
let intervalId = null;
let celestialBodies = []; // Define celestialBodies array
let alphaCentauriA; // Declare Alpha Centauri A globally
let baseTime = Date.now();
let lastPickedMesh = null;
let orbitMeshes = [];
let simulationSpeed = 1;
let spaceship = null;
let particleSystem = null;
let moons = [];

overlay.style.display = "block"; // Show the overlay

// Welcome Popup
window.addEventListener("load", function () {
    // Display the welcome popup
    const welcomePopup = document.getElementById("welcomePopup");
    const welcomeBtn = document.getElementById("welcomeBtn");
    const loadingBar = document.getElementById("loadingBar");
    const loadingText = document.getElementById("loadingText");

    welcomePopup.style.display = "block";

    // Apply blur to the background
    const mainContent = document.getElementById("renderCanvas");
    const sidebar = document.getElementById("sidebar");
    const cameraIcon = document.getElementById("cameraIcon");

    mainContent.style.filter = "blur(5px)";
    sidebar.style.filter = "blur(5px)";
    cameraIcon.style.filter = "blur(5px)";

    // Update progress bar gradually
    let progress = 0;
    const updateProgress = setInterval(() => {
        if (progress < 100) {
            progress += 2; // Increment progress
            loadingText.textContent = `Loading... ${progress}%`;
        }
        if (progress >= 100) {
            clearInterval(updateProgress);
            welcomeBtn.disabled = false;
        }
    }, 50); // Update every 50ms to ensure smooth transition

    // Close the popup and remove blur
    welcomeBtn.addEventListener("click", function () {
        welcomePopup.style.display = "none";
        mainContent.style.filter = "none";
        sidebar.style.filter = "none";
        cameraIcon.style.filter = "none";
        overlay.style.display = "none";

        // Expand the sidebar after 1 second
        setTimeout(() => {
            sidebar.classList.remove("collapsed");
        }, 500);
    });
});


const meshNameToPlanetName = {
    "planet0": "Alpha Centauri A",
    "planet1": "Alpha Centauri B",
    "planet2": "Proxima Centauri",
    "moon2_0": "Proxima Centauri B"
};

function updateSimulationSpeed(sliderValue) {
    // Map slider value (1 to 1000) to simulation speed (0.1 to 9.1)
    simulationSpeed = ((sliderValue - 1) / 999) * 9.0 + 0.1;
    updateSliderText(sliderValue);
}

const createScene = function () {
    const scene = new BABYLON.Scene(engine);

    // Enable collision detection
    scene.collisionsEnabled = true;

    // Camera
    const camera = new BABYLON.ArcRotateCamera("camera1", Math.PI, Math.PI / 3, 150, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.upperRadiusLimit = 500; // Increase the zoom-out limit
    camera.lowerRadiusLimit = 1; // Allow closer zoom
    camera.lowerBetaLimit = 0; // Allow camera to go below the scene
    camera.upperBetaLimit = Math.PI; // Allow full vertical rotation
    camera.checkCollisions = true; // Enable collision detection for camera

    // Set the initial camera position (adjust these values as needed)
    camera.alpha = Math.PI * 2; // Set the horizontal angle (facing the opposite side)
    camera.beta = Math.PI / 3; // Set the vertical angle (slightly lower)
    camera.radius = 350; // Set the zoom level (slightly more zoomed in)
    camera.setTarget(BABYLON.Vector3.Zero()); // Focus on the sun

    // Adjust panning sensitivity for right mouse drag
    camera.panningSensibility = 100; // Lower value makes dragging more sensitive

    // Event listeners for right-click actions
    canvas.addEventListener("pointerdown", function (evt) {
        if (evt.button === 2) { // Right mouse button
            // Detach the camera from any attached body
            camera.setTarget(new BABYLON.Vector3(0, 0, 0));
            camera.lockedTarget = null; // Ensure locked target is detached
        }
    });

    // Ensure camera rotation and panning sensitivity
    camera.inputs.attached.pointers.angularSensibilityX = 500;
    camera.inputs.attached.pointers.angularSensibilityY = 500;

    // Move the ship to the target position
    function moveToTarget(targetPos, arrivalCallback) {
        targetPosition = targetPos.clone(); // Clone to avoid modifying the original target position
        onArrivalCallback = arrivalCallback;
        scene.registerBeforeRender(moveShip);
    }

    // Move the ship to the target position 2
    function moveShip() {
        if (targetPosition) {
            const direction = targetPosition.subtract(spaceship.position).normalize();
            const baseSpeed = 0.4; // Base speed of the ship
            const adjustedSpeed = simulationSpeed > 1 ? baseSpeed * (1 + ((simulationSpeed - 1) / (9.1 - 1)) * (2.3 - 1)) : baseSpeed; // Adjust the speed only if simulation speed is above 1

            spaceship.moveWithCollisions(direction.scale(adjustedSpeed)); // Adjust the speed as needed

            // Use a precise distance check for arrival
            const arrivalThreshold = 0.5; //threshold 
            if (BABYLON.Vector3.Distance(spaceship.position, targetPosition) < arrivalThreshold) {
                scene.unregisterBeforeRender(moveShip); // Stop moving the ship
                targetPosition = null;
                hasArrived = true; // Set the flag to indicate arrival
                particleSystem.stop();

                // Trigger the onArrival callback immediately
                if (onArrivalCallback) {
                    onArrivalCallback();
                    onArrivalCallback = null; // Clear the callback to avoid repeated calls
                }
            }
        }
    }
        // Handle arrival and trigger popup
        function onArrival() {
            if (lastPickedMesh) {
                camera.setTarget(lastPickedMesh.position);
                showPopup(lastPickedMesh);
                lastPickedMesh = null; // Clear the last picked mesh after triggering the popup
            }
        }
    

    // Create and configure celestial bodies, stars, and planets
    const celestialData = [
        {
            name: "Alpha Centauri A",
            texture: "https://raw.githubusercontent.com/razvanpf/Images/main/2ksun.jpg",
            size: 10,
            distance: 0,
            orbitSpeed: 0,
            rotationSpeed: 0.4, 
            moons: [],
            type: "star",
        },
        {
            name: "Alpha Centauri B",
            texture: "https://raw.githubusercontent.com/razvanpf/Images/main/2ksun.jpg",
            size: 7,
            distance: 25,
            orbitSpeed: 0.0001,
            rotationSpeed: 0.4, 
            moons: [],
            type: "star",
        },
        {
            name: "Proxima Centauri",
            texture: "https://raw.githubusercontent.com/razvanpf/Images/main/redsun3D.png",
            size: 1,
            distance: 50,
            orbitSpeed: 0.00005,
            rotationSpeed: 0.01,
            moons: [
                { name: "Proxima Centauri B", size: 0.25, distance: 5, orbitSpeed: 0.2, rotationSpeed: 0.4, texture: "https://raw.githubusercontent.com/razvanpf/Images/main/proximaB.png", type: "planet" }
            ],
            type: "star",
        }
    ];

        // Create sun rays
        function createSunRays(scene, sun) {
        const sunRays = new BABYLON.VolumetricLightScatteringPostProcess('godrays', 1.0, scene.activeCamera, sun, 100, BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, false);
        sunRays.exposure = 0.3;
        sunRays.decay = 0.96815;
        sunRays.weight = 0.58767;
        sunRays.density = 0.926;
        sunRays.renderingGroupId = 0; // Ensure the rendering group ID is 0
    }

    const createRings = (scene) => {
        celestialData.forEach((data, index) => {
            let orbit;
            // Create regular circular orbit for other planets
            orbit = BABYLON.MeshBuilder.CreateTorus(`orbit${index}`, { diameter: data.distance * 2, thickness: 0.05, tessellation: 128 }, scene);
            const orbitMaterial = new BABYLON.StandardMaterial(`orbitMaterial${index}`, scene);
            orbitMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
            orbitMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
            orbitMaterial.alpha = 0.5; // Set the opacity to 50%
            orbit.material = orbitMaterial;
            orbitMeshes.push(orbit); // Store the orbit mesh
            
            // Check for moons and create rings for them
            if (data.moons && data.moons.length > 0) {
                data.moons.forEach((moonData, moonIndex) => {
                    const moonOrbit = BABYLON.MeshBuilder.CreateTorus(`orbit${index}_moon${moonIndex}`, { diameter: moonData.distance * 2, thickness: 0.03, tessellation: 128 }, scene);
                    const moonOrbitMaterial = new BABYLON.StandardMaterial(`orbitMaterial${index}_moon${moonIndex}`, scene);
                    moonOrbitMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 1); // Different color for moon orbits
                    moonOrbitMaterial.emissiveColor = new BABYLON.Color3(0.7, 0.7, 1);
                    moonOrbitMaterial.alpha = 0.5; // Set the opacity to 50%
                    moonOrbit.material = moonOrbitMaterial;
                    
                    // Parent the moon's orbit to the planet mesh
                    const parentPlanet = celestialBodies.find(body => body.data.name === data.name).mesh;
                    moonOrbit.parent = parentPlanet; // Parent the moon orbit to the planet
    
                    orbitMeshes.push(moonOrbit); // Store the moon orbit mesh
                });
            }
        });
    };

    // Create the 3D path for an inclined and eccentric orbit
    function createOrbitPath(distance, eccentricity, inclination, scene) {
        const points = [];
        const numPoints = 128;
        for (let i = 0; i <= numPoints; i++) {
            const angle = 2 * Math.PI * (i / numPoints);
            const r = distance * (1 - eccentricity ** 2) / (1 + eccentricity * Math.cos(angle));
            const x = r * Math.cos(angle);
            const y = r * Math.sin(angle) * Math.sin(BABYLON.Tools.ToRadians(inclination));
            const z = r * Math.sin(angle) * Math.cos(BABYLON.Tools.ToRadians(inclination));
            points.push(new BABYLON.Vector3(x, y, z));
        }
        return new BABYLON.Path3D(points);
    }

    // Create celestial bodies
    celestialData.forEach((data, index) => {
        // Create planet
        const planet = BABYLON.MeshBuilder.CreateSphere(`planet${index}`, { diameter: data.size * 2 }, scene);
        const planetMaterial = new BABYLON.StandardMaterial(`planetMaterial${index}`, scene);
        planetMaterial.diffuseTexture = new BABYLON.Texture(data.texture, scene);
        planet.material = planetMaterial;
        planetMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        planet.position = new BABYLON.Vector3(data.distance, 0, 0);
    
        // Set initial position of the planet
        planet.position = new BABYLON.Vector3(data.distance, 0, 0);
        data.visited = false; // Ensure the visited flag is set during initialization
        celestialBodies.push({ mesh: planet, data, angle: 0 });
    
        // Flip the planet upside down
        planet.rotation.x = Math.PI; // Flipping the planet
    
        // Add outline on hover for planets
        planet.actionManager = new BABYLON.ActionManager(scene);
        planet.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function () {
            planet.renderOutline = true;
            planet.outlineWidth = 0.1;
            planet.outlineColor = BABYLON.Color3.White();
        }));
        planet.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function () {
            planet.renderOutline = false;
        }));
    
        if (data.type === "star") {
            // Apply emissive texture and disable lighting
            planetMaterial.emissiveTexture = new BABYLON.Texture(data.texture, scene);
            planetMaterial.disableLighting = true;
            planet.material = planetMaterial;
            planetMaterial.backFaceCulling = false; // Ensure that the material is rendered from both sides
            planetMaterial.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE; // Set transparency mode to opaque

            // Adjust the color for Proxima Centauri
            if (data.name === "Proxima Centauri") {
                console.log("Made proxima RED")
                planetMaterial.emissiveColor = new BABYLON.Color3(1, 0, 0); // Red color for Proxima Centauri
            }
    
            // Glow Layer
            const glowLayer = new BABYLON.GlowLayer("glow", scene);
            glowLayer.intensity = 1.5; // Adjust intensity as needed
            glowLayer.addIncludedOnlyMesh(planet);
    
            // Create sun rays
            createSunRays(scene, planet);
    
            // Create a point light at the star's position
            const starLight = new BABYLON.PointLight(`${data.name}Light`, planet.position, scene);
            starLight.intensity = 2; // Set the intensity of the light
        }
    
    // Create moons
    data.moons.forEach((moonData, moonIndex) => {
        const moon = BABYLON.MeshBuilder.CreateSphere(`moon${index}_${moonIndex}`, { diameter: moonData.size * 2 }, scene);
        const moonMaterial = new BABYLON.StandardMaterial(`moonMaterial${index}_${moonIndex}`, scene);
        moonMaterial.diffuseTexture = new BABYLON.Texture(moonData.texture, scene);
        moon.material = moonMaterial;
        moonMaterial.specularColor = new BABYLON.Color3(0, 0, 0); // Reduce reflectivity
        moon.position = new BABYLON.Vector3(planet.position.x + moonData.distance, 0, planet.position.z);
        moonData.visited = false; // Ensure the visited flag is set for moons
        moons.push({ mesh: moon, data: moonData, parent: planet, angle: Math.random() * Math.PI * 2 }); // Initialize with random angle

        // Set initial position of the moon
        moon.position = new BABYLON.Vector3(
            planet.position.x + moonData.distance * Math.cos(moon.angle),
            0,
            planet.position.z + moonData.distance * Math.sin(moon.angle)
        );

        // Add outline on hover for moons
        moon.actionManager = new BABYLON.ActionManager(scene);
        moon.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function () {
            moon.renderOutline = true;
            moon.outlineWidth = 0.1;
            moon.outlineColor = BABYLON.Color3.White();
        }));
        moon.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function () {
            moon.renderOutline = false;
            }));
        });
});

    // Initialize angle property for celestial bodies and moons
    celestialBodies.forEach((body) => {
        body.angle = 0;
    });

    // Animate planets and moons
    scene.registerBeforeRender(function () {
        const deltaTime = engine.getDeltaTime() * 0.001; // Default to 16ms if not defined
    
        celestialBodies.forEach((body) => {
            if (body.data.name === "Ceres" || body.data.name === "Pluto" || body.data.name === "Haumea" || body.data.name === "Makemake" || body.data.name === "Eris") {
                const distance = body.data.distance;
                const inclination = BABYLON.Tools.ToRadians(body.data.inclination);
                const eccentricity = body.data.eccentricity;
                const angle = (Date.now() * body.data.orbitSpeed * speedMultiplier * simulationSpeed) % (2 * Math.PI);
                const r = distance * (1 - eccentricity ** 2) / (1 + eccentricity * Math.cos(angle));
                body.mesh.position.x = r * Math.cos(angle);
                body.mesh.position.y = r * Math.sin(angle) * Math.sin(inclination);
                body.mesh.position.z = r * Math.sin(angle) * Math.cos(inclination);
            } else {
                const distance = body.data.distance;
                const angle = (Date.now() * body.data.orbitSpeed * speedMultiplier * simulationSpeed) % (2 * Math.PI);
                body.mesh.position.x = distance * Math.cos(angle);
                body.mesh.position.z = distance * Math.sin(angle);
            }
    
            // Rotation around own axis
            if (body.data.name === "Venus") {
                body.mesh.rotation.y += body.data.rotationSpeed * simulationSpeed * 0.01; // Clockwise rotation
            } else if (body.data.name === "Uranus") {
                body.mesh.rotation.z += body.data.rotationSpeed * simulationSpeed * 0.01; // Rolling rotation
            } else {
                body.mesh.rotation.y -= body.data.rotationSpeed * simulationSpeed * 0.01; // Counter-clockwise rotation
            }
        });
    
        // Animate moons around their planets
        moons.forEach((moon) => {
            const distance = moon.data.distance;
            
            // Check if the moon is Triton to reverse its orbit direction
            if (moon.data.name === "Triton") {
                moon.angle -= moon.data.orbitSpeed * simulationSpeed * deltaTime; // Reverse direction for Triton
            } else {
                moon.angle += moon.data.orbitSpeed * simulationSpeed * deltaTime; // Normal direction for other moons
            }
        
            // Update moon position
            moon.mesh.position.x = moon.parent.position.x + distance * Math.cos(moon.angle);
            moon.mesh.position.z = moon.parent.position.z + distance * Math.sin(moon.angle);
            moon.mesh.position.y = moon.parent.position.y; // Keep the moon on the same horizontal plane
        
            // Rotation around own axis
            moon.mesh.rotation.y -= moon.data.rotationSpeed * simulationSpeed * 0.01; // Counter-clockwise rotation
        
            // Ensure specific moons always face the parent planet (tidal locking)
            const tidallyLockedMoons = ["Moon", "Oberon", "Miranda", "Triton", "Titania", "Charon"];
            if (tidallyLockedMoons.includes(moon.data.name)) {
                moon.mesh.lookAt(moon.parent.position);
            } else {
                // Normal rotation for other moons
                moon.mesh.rotation.y -= moon.data.rotationSpeed * simulationSpeed * 0.01; // Counter-clockwise rotation
            }
        });
    });

    // Initialize sidebar
    function initializeSidebar() {
        const sidebar = document.getElementById("sidebar");
        const discoveryList = document.getElementById("discoveryList");
    
        // Check if discoveryList exists
        if (!discoveryList) {
            console.error("The element with id 'discoveryList' does not exist in the DOM.");
            return;
        }
    
        // Loop through all celestial bodies
        celestialData.forEach(body => {
            const planetName = meshNameToPlanetName[body.name.replace(/\s+/g, '')] || body.name;
            addListItem(planetName, discoveryList);
    
            // Loop through moons if they exist
            if (body.moons && body.moons.length > 0) {
                body.moons.forEach(moon => {
                    const moonName = moon.name;
                    addListItem(moonName, discoveryList);
                });
            }
        });
    }
    
    // Helper function to add a list item to the sidebar
    function addListItem(name, parentElement) {
        const listItem = document.createElement("li");
        listItem.id = `sidebar-${name.replace(/\s+/g, '-')}`;
        listItem.className = "undiscovered";
        listItem.innerHTML = `
            <span>Undiscovered Body</span>
            <i class="fa fa-check-circle" style="display: none; color: green;"></i>
        `;
        parentElement.appendChild(listItem);
    }

    // Spaceship
    BABYLON.SceneLoader.ImportMesh("", "https://models.babylonjs.com/", "ufo.glb", scene, function (meshes) {
        spaceship = meshes[0];
        spaceship.scaling = new BABYLON.Vector3(1, 1, 1); // Slightly bigger
        spaceship.position = new BABYLON.Vector3(0, -15, 0);
        // Set the initial position of the spaceship
        const initialX = 15; // Move it to the left of the sun
        const initialY = 0;    // Align with the orbit plane
        const initialZ = 0;    // Same plane as the orbit rings
        spaceship.checkCollisions = true; // Enable collision detection for the spaceship
        spaceship.ellipsoid = new BABYLON.Vector3(1, 1, 1);
        spaceship.ellipsoidOffset = new BABYLON.Vector3(0, 1, 0);

        spaceship.position = new BABYLON.Vector3(initialX, initialY, initialZ);

        // Fiery Trail
        particleSystem = new BABYLON.ParticleSystem("particles", 2000, scene);
        particleSystem.particleTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/flare.png", scene);
        particleSystem.emitter = spaceship;
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.5, 0, -0.5);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.5, 0, 0.5);

        particleSystem.color1 = new BABYLON.Color4(1, 0.5, 0, 1.0);
        particleSystem.color2 = new BABYLON.Color4(1, 0, 0, 1.0);
        particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0.0);

        particleSystem.minSize = 0.1;
        particleSystem.maxSize = 0.5;

        particleSystem.minLifeTime = 0.3;
        particleSystem.maxLifeTime = 1.5;

        particleSystem.emitRate = 500;

        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

        particleSystem.gravity = new BABYLON.Vector3(0, 0, 0);

        particleSystem.direction1 = new BABYLON.Vector3(-1, -1, -1);
        particleSystem.direction2 = new BABYLON.Vector3(1, -1, 1);

        particleSystem.minAngularSpeed = 0;
        particleSystem.maxAngularSpeed = Math.PI;

        particleSystem.minEmitPower = 1;
        particleSystem.maxEmitPower = 3;
        particleSystem.updateSpeed = 0.005;

        particleSystem.start();

        // Apply emissive material to spaceship and child meshes
        spaceship.getChildMeshes().forEach(mesh => {
            // Adjust the material
            const shipMaterial = new BABYLON.StandardMaterial("shipMaterial", scene);
            shipMaterial.emissiveColor = new BABYLON.Color3(0, 0, 1); // Emissive color to make it stand out
            mesh.material = shipMaterial;

            // Apply outline
            mesh.renderOutline = true;
            mesh.outlineWidth = 0.1;
            mesh.outlineColor = BABYLON.Color3.Blue(); // Set the outline color to blue
        });

        // Event listener for canvas click
        let isDragging = false;
        let mouseDown = false;
        let lastPickedMesh = null; // Store the last picked mesh

        canvas.addEventListener("mousedown", function (evt) {
            mouseDown = true;
            isDragging = false;
        });

        canvas.addEventListener("mousemove", function (evt) {
            if (mouseDown) {
                isDragging = true;
            }
        });

        canvas.addEventListener("mouseup", function (evt) {
            mouseDown = false;
            if (!isDragging) {
                handleCanvasClick(evt);
            }
            isDragging = false;
        });

        function handleCanvasClick(evt) {
            pickResult = scene.pick(evt.clientX, evt.clientY);
            if (pickResult.hit && pickResult.pickedMesh) {
                console.log("Picked mesh:", pickResult.pickedMesh.name);
                console.log("Picked point:", pickResult.pickedPoint);
        
                targetPosition = pickResult.pickedPoint;
                spaceship.lookAt(targetPosition);
                particleSystem.start();
        
                // Detach the ship from the planet when a new target is selected
                detachShipFromPlanet(spaceship);
        
                // Reset the hasArrived flag
                hasArrived = false;
        
                // Check if the target is a planet, moon, sun, or Voyager
                if (pickResult.pickedMesh.name.startsWith("planet") || pickResult.pickedMesh.name.startsWith("moon") || pickResult.pickedMesh.name === "AlphaCentauriA" || pickResult.pickedMesh.name === "AlphaCentauriB" || pickResult.pickedMesh.name === "ProximaCentauri") {
                    lastPickedMesh = pickResult.pickedMesh; // Store the last picked mesh
                    startUpdatingTargetPosition(pickResult.pickedMesh);
                } else {
                    lastPickedMesh = null; // Clear last picked mesh for unrecognized bodies
                    stopUpdatingTargetPosition();
                }
            }
        }

        // Click event that ensures that handleCanvasClick is only called if there was no dragging
        canvas.addEventListener("click", function (evt) {
            if (!isDragging) {
                handleCanvasClick(evt);
            }
        });

// Attach ship to planet function
function attachShipToPlanet(ship, planet) {
    ship.parent = planet;
    ship.position = BABYLON.Vector3.Zero();

    // Ensure planet.data exists
    const planetData = celestialBodies.find(body => body.mesh === planet)?.data;
    if (planetData) {
        planetData.visited = true; // Mark the planet as visited

        const planetName = meshNameToPlanetName[planet.name] || planet.name;
        updateSidebar(planetName);
    }
}

        // Detach ship function
        function detachShipFromPlanet(ship) {
            if (ship.parent) {
                const worldMatrix = ship.getWorldMatrix();
                const worldPosition = BABYLON.Vector3.TransformCoordinates(BABYLON.Vector3.Zero(), worldMatrix);
                ship.parent = null;
                ship.position = worldPosition;
            }
        }

        // Handle spaceship movement and camera focus
        scene.registerBeforeRender(function () {
            if (targetPosition) {
                const direction = targetPosition.subtract(spaceship.position).normalize();
                const baseSpeed = 0.4; // Base speed of the ship
                const adjustedSpeed = simulationSpeed > 1 ? baseSpeed * (1 + ((simulationSpeed - 1) / (9.1 - 1)) * (2.3 - 1)) : baseSpeed; // Adjust the speed only if simulation speed is above 1

                spaceship.moveWithCollisions(direction.scale(adjustedSpeed)); // speed adjustment

                // Use a precise distance check for arrival
                const arrivalThreshold = 0.5; // threshold
                if (BABYLON.Vector3.Distance(spaceship.position, targetPosition) < arrivalThreshold && !hasArrived) {
                    scene.unregisterBeforeRender(moveShip); // Stop moving the ship
                    targetPosition = null;
                    hasArrived = true; // Set the flag to indicate arrival
                    if (particleSystem) {
                        particleSystem.stop();
                    }
                    if (lastPickedMesh) {
                        if (lastPickedMesh.name.startsWith("planet") || lastPickedMesh.name.startsWith("moon") || lastPickedMesh.name === "AlphaCentauriA" || lastPickedMesh.name === "Voyager") {
                            attachShipToPlanet(spaceship, lastPickedMesh);
                            setTimeout(() => {
                                camera.setTarget(lastPickedMesh.position); // Set camera focus to the target
                                lightUpPlanet(lastPickedMesh); // Light up the target
                                showPopup(lastPickedMesh);
                            }, 1000); // Add a delay before focusing on the target
                        }
                    }
                }
            }
        });
    });

    // Background
    scene.clearColor = new BABYLON.Color3(0, 0, 0);

    // Twinkling Stars
    const starParticles = new BABYLON.ParticleSystem("stars", 5000, scene);
    starParticles.particleTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/flare.png", scene);
    starParticles.emitter = new BABYLON.Vector3(0, 0, 0);

    // Define the boundaries of the scene
    const innerBoundary = 400; // Distance from the center where stars should not spawn
    const outerBoundary = 500; // Distance from the center where stars can spawn

    // Custom particle emitter function to control particle positions
    starParticles.startPositionFunction = function (worldMatrix, positionToUpdate) {
        let distanceFromCenter;
        do {
            // Random position within the outer boundaries
            positionToUpdate.x = Math.random() * 2 * outerBoundary - outerBoundary;
            positionToUpdate.y = Math.random() * 2 * outerBoundary - outerBoundary;
            positionToUpdate.z = Math.random() * 2 * outerBoundary - outerBoundary;

            // Calculate distance from the center of the scene
            distanceFromCenter = Math.sqrt(
                positionToUpdate.x * positionToUpdate.x +
                positionToUpdate.y * positionToUpdate.y +
                positionToUpdate.z * positionToUpdate.z
            );
        } while (distanceFromCenter < innerBoundary || distanceFromCenter > outerBoundary); // Ensure the position is within the specified range
    };

    starParticles.color1 = new BABYLON.Color4(4, 4, 4, 1.0);
    starParticles.color2 = new BABYLON.Color4(3.4, 3.4, 4, 1.0);
    starParticles.colorDead = new BABYLON.Color4(0, 0, 0, 0.0);

    starParticles.minSize = 0.1;
    starParticles.maxSize = 0.5;

    starParticles.minLifeTime = Number.MAX_SAFE_INTEGER; // Infinite life time
    starParticles.maxLifeTime = Number.MAX_SAFE_INTEGER;

    starParticles.emitRate = 10000;

    starParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

    starParticles.gravity = new BABYLON.Vector3(0, 0, 0);

    starParticles.direction1 = new BABYLON.Vector3(0, 0, 0);
    starParticles.direction2 = new BABYLON.Vector3(0, 0, 0);

    starParticles.updateSpeed = 0.005;

    starParticles.start();

    // Lighting up planets on visit
    function lightUpPlanet(planet) {
        if (currentLitPlanet && planetLight) {
            planetLight.dispose();
            planetLight = null;
        }

        // Create a new hemispheric light for the visited planet
        planetLight = new BABYLON.HemisphericLight(`planetLight_${planet.name}`, new BABYLON.Vector3(0, 1, 0), scene);
        planetLight.intensity = 1.5;
        planetLight.parent = planet;

        // Ensure the light affects the visited planet
        planetLight.includedOnlyMeshes = [planet];

        // Update the current lit planet
        currentLitPlanet = planet;
    }

    // Mark a celestial body as discovered in the sidebar
    function markAsDiscovered(name) {
        const listItem = document.getElementById(`sidebar-${name.replace(/\s+/g, '-')}`);
        if (listItem) {
            listItem.classList.remove("undiscovered");
            listItem.classList.add("discovered");
            listItem.querySelector("span").textContent = name;

            // Add checkmark span if it doesn't exist
            if (!listItem.querySelector(".checkmark")) {
                const checkmarkSpan = document.createElement("span");
                checkmarkSpan.classList.add("checkmark");
                checkmarkSpan.textContent = " ✔";
                listItem.appendChild(checkmarkSpan);
            }
        } else {
            console.error("List item not found for:", name);
        }
    }

    // Update the sidebar
    function updateSidebar(discoveredBodyName = null) {
        if (discoveredBodyName) {
            markAsDiscovered(discoveredBodyName);
        }
    }

    function showPopup(mesh) {
        const popup = document.getElementById("popup");
        popup.style.display = "block";
    
        const planetDescriptions = {
            "Alpha Centauri A": {
                name: "Alpha Centauri A",
                description: "Alpha Centauri A is the largest and brightest star in the Alpha Centauri star system. It is a yellow star that provides a familiar glow, similar to many other stars in the universe.",
                image: "https://raw.githubusercontent.com/razvanpf/Images/main/AlphaCentauriA.png",
                age: "4.85 billion years", 
                mass: "1.1 × 10^30 kg",
                atmosphere: "Hydrogen, Helium",
                diameter: "1.223 million km",
                gravity: "209 m/s²"
            },
            "Alpha Centauri B": {
                name: "Alpha Centauri B",
                description: "Alpha Centauri B is a smaller, orange-hued companion to Alpha Centauri A. Together, they form a spectacular binary star system, captivating astronomers and stargazers alike.",
                image: "https://raw.githubusercontent.com/razvanpf/Images/main/AlphaCentauriB.png",
                age: "4.85 billion years",
                mass: "0.907 × 10^30 kg",
                atmosphere: "Hydrogen, Helium",
                diameter: "0.863 million km",
                gravity: "153 m/s²"
            },
            "Proxima Centauri": {
                name: "Proxima Centauri",
                description: "Proxima Centauri is the closest known star to the Alpha Centauri star system. This red dwarf star is much cooler and dimmer than many others but holds the promise of nearby worlds.",
                image: "https://raw.githubusercontent.com/razvanpf/Images/main/ProximaCentauri.png",
                age: "4.85 billion years",
                mass: "0.123 × 10^30 kg",
                atmosphere: "Hydrogen, Helium",
                diameter: "0.2 million km",
                gravity: "24.8 m/s²"
            },
            "Proxima Centauri B": {
                name: "Proxima Centauri B",
                description: "Proxima Centauri B is an exoplanet orbiting within the habitable zone of Proxima Centauri. Its potential for liquid water and Earth-like conditions make it a fascinating target for the search for extraterrestrial life.",
                image: "https://raw.githubusercontent.com/razvanpf/Images/main/ProximaCentauriB.png",
                age: "4.85 billion years",
                mass: "1.27 × 10^25 kg",
                atmosphere: "Carbon Dioxide, Nitrogen",
                diameter: "12,742 km",
                gravity: "11.2 m/s²"
            }
        };
    
        const planetName = meshNameToPlanetName[mesh.name.replace(/\s+/g, '')] || mesh.name;
        const planetInfo = planetDescriptions[planetName] || {};
        markAsDiscovered(planetName); // Mark the planet as discovered in the sidebar
    
        const info = `
        <div style="text-align: center;">
            <h1>You discovered</h1>
            <h2>${planetInfo.name || mesh.name}</h2>
            <img src="${planetInfo.image || ''}" class="popup-image" id="popup-image" alt="${planetInfo.name || mesh.name}" style="width: auto; height: auto;">
            <p>${planetInfo.description || ''}</p>
            Age: ${planetInfo.age || 'N/A'}<br>
            Mass: ${planetInfo.mass || 'N/A'}<br>
            Atmosphere: ${planetInfo.atmosphere || 'N/A'}<br>
            Diameter: ${planetInfo.diameter || 'N/A'}<br>
            Gravity: ${planetInfo.gravity || 'N/A'}<br>
            <button id="continueBtn" style="background-color: transparent; color: white; padding: 10px 20px; border: 2px solid blue; border-radius: 5px; cursor: pointer; margin-top: 20px;">
                Continue exploration
            </button>
        </div>
    `;
    popup.innerHTML = info;

    document.getElementById("continueBtn").addEventListener("click", function () {
        popup.style.display = "none";
    });
}

    // Prevent default right-click context menu
    window.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });

    // Disable right-click drag behavior
    const disableRightClickDrag = () => {
        canvas.oncontextmenu = (e) => {
            e.preventDefault();
        };
    };
    // Right click events
    const onRightMouseDown = (event) => {
        if (event.button === 2) { // Right mouse button
            event.preventDefault();
        }
    };

    const onRightMouseUp = (event) => {
        if (event.button === 2) { // Right mouse button
            event.preventDefault();
        }
    };

    const onRightMouseMove = (event) => {
        if (event.button === 2) { // Right mouse button
            event.preventDefault();
        }
    };

    // Add event listeners to disable right-click drag
    canvas.addEventListener("mousedown", onRightMouseDown);
    canvas.addEventListener("mouseup", onRightMouseUp);
    canvas.addEventListener("mousemove", onRightMouseMove);

    // Sidebar
    document.getElementById('toggleSidebarBtn').addEventListener('click', function () {
        const sidebar = document.getElementById('sidebar');
        if (sidebar.classList.contains('collapsed')) {
            sidebar.classList.remove('collapsed');
            this.innerHTML = '&lt;';  // Change to collapse icon
        } else {
            sidebar.classList.add('collapsed');
            this.innerHTML = '&gt;';  // Change to expand icon
        }
    });

    initializeSidebar();
    createRings(scene);

    return scene;
};

// Handle window resize
window.addEventListener("resize", () => {
    engine.resize();
});

function animateCameraToTarget(camera, target, onComplete) {
    const animation = new BABYLON.Animation("cameraAnimation", "position", 60, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    const keys = [
        { frame: 0, value: camera.position },
        { frame: 60, value: target }
    ];
    animation.setKeys(keys);
    camera.animations.push(animation);
    scene.beginAnimation(camera, 0, 60, false, 1, onComplete);
}

// Main code to create and render the scene
const scene = createScene();

// Consider the simulation speed in render loop
let lastTime = performance.now();

engine.runRenderLoop(() => {
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) * 0.001 * simulationSpeed; // Adjust speed based on simulationSpeed
    lastTime = currentTime;

    // Pass deltaTime to the scene
    scene.deltaTime = deltaTime;

    scene.render();
});

    // Start updating target position
    function startUpdatingTargetPosition(planet) {
        if (intervalId) {
            clearInterval(intervalId);
        }
        intervalId = setInterval(() => {
            if (targetPosition) {
                targetPosition = planet.position.clone();
            }
        }, updateInterval);
        hasArrived = false; // Reset the flag when starting to update target position
    }
    
    // Stop updating target position
    function stopUpdatingTargetPosition() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

// Update slider text
function updateSliderText(sliderValue) {
    const speedFactor = ((sliderValue - 1) / 999) * 9.0 + 0.1; // This formula...My god...
    const speedText = speedFactor.toFixed(1) + "x"; // Format to 1 decimal place
    document.getElementById("speedDisplay").innerText = speedText;
}

//Screenshot//
const camera = scene.activeCamera; // Or however you reference your camera
const cameraIcon = document.getElementById('cameraIcon');

// Hide UI elements during screenshot
function hideUIElements() {
    document.getElementById('versionText').style.display = 'none';
    document.getElementById('sidebar').style.display = 'none';
    document.getElementById('returnToClusterButton').style.display = 'none';
    cameraIcon.style.pointerEvents = 'none'; // Disable interactions
    cameraIcon.style.opacity = '0.5'; // Visually indicate it's disabled
}

// Show UI elements after screenshot
function showUIElements() {
    document.getElementById('versionText').style.display = 'block';
    document.getElementById('sidebar').style.display = 'block';
    document.getElementById('returnToClusterButton').style.display = 'block';
    cameraIcon.style.pointerEvents = 'auto'; // Enable interactions
    cameraIcon.style.opacity = '1'; // Reset opacity
}

// Function to take a screenshot
function takeScreenshot() {
    hideUIElements();

    setTimeout(() => {
        BABYLON.Tools.CreateScreenshotUsingRenderTarget(engine, camera, { precision: 1.0 }, function (data) {
            // Create a temporary link element
            const link = document.createElement('a');
            link.href = data;
            link.download = 'screenshot.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showUIElements();
        });
    }, 100);
}

// Add event listener to the camera icon
document.getElementById('cameraIcon').addEventListener('click', takeScreenshot);

// Show the welcome popup and hide the controls initially
window.onload = () => {
    const welcomePopup = document.getElementById('welcomePopup');
    const welcomeBtn = document.getElementById('welcomeBtn');

    welcomePopup.style.display = 'flex';

    welcomeBtn.addEventListener('click', function () {
        welcomePopup.style.display = 'none';
    });
};

// Star Cluster return icon

document.getElementById('returnToClusterButton').addEventListener('click', function() {
    document.getElementById('returnPopup').style.display = 'block';
});

document.getElementById('confirmReturn').addEventListener('click', function() {
    window.location.href = 'https://razvanpf.github.io/Star-Cluster/'; // Redirect to the root or index.html
});

document.getElementById('cancelReturn').addEventListener('click', function() {
    document.getElementById('returnPopup').style.display = 'none';
});