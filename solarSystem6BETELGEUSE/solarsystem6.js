// Declared Variables - CONSTANTS
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, antialias: true });
const updateInterval = 100; // Update every 100 milliseconds
const overlay = document.getElementById("overlay");
engine.setHardwareScalingLevel(1 / window.devicePixelRatio);
let stopUpdatingTarget = false;

// Declared Variables - LETs
let hasArrived = false; // Flag to track if the spaceship has arrived
let speedMultiplier = 1.0; // initial speed multiplier
let targetPosition = null;
let pickResult = null;
let currentLitPlanet = null;
let planetLight = null;
let intervalId = null;
let celestialBodies = []; // Define celestialBodies array
let lastPickedMesh = null;
let orbitMeshes = [];
let simulationSpeed = 1;
let spaceship = null;
let particleSystem = null;
let moons = [];
let cameraTargetPosition = null;

overlay.style.display = "block"; // Show the overlay

// Welcome Popup
window.addEventListener("load", function () {
    // Display the welcome popup
    const welcomePopup = document.getElementById("welcomePopup");
    const welcomeBtn = document.getElementById("welcomeBtn");
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
            progress += 1; // Increment progress
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
    "planet1": "HDE226868",
    "blackHoleModel": "Cygnus-X1"
};

// Load a model using the GLB URL
function loadModel(url, scene, scaling = 1) {
    return new Promise((resolve, reject) => {
        BABYLON.SceneLoader.ImportMesh("", url, "", scene, function (meshes) {
            if (meshes.length > 0) {
                let model = meshes[0];
                model.scaling = new BABYLON.Vector3(scaling, scaling, scaling);

                // Ensure the model is visible
                model.isVisible = true;

                resolve(model);
            } else {
                reject("No meshes found in the model");
            }
        }, null, function (scene, message, exception) {
            console.error("SceneLoader ImportMesh error:", message, exception);
            reject(exception || message);
        });
    });
}

function setupAccretionDiskEffect(scene, manualOffset = 4) {
    const star = celestialBodies.find(body => body.data.name === "HDE226868")?.mesh;
    const blackHole = celestialBodies.find(body => body.data.name === "Cygnus-X1")?.mesh;

    if (star && blackHole) {
        const particleSystem = new BABYLON.ParticleSystem("particles", 2000, scene);
        particleSystem.particleTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/flare.png", scene);
        particleSystem.addColorGradient(0.0, new BABYLON.Color4(0.2, 0.5, 1.0, 1.0));
        particleSystem.addColorGradient(0.7, new BABYLON.Color4(0.2, 0.5, 1.0, 1.0));
        particleSystem.addColorGradient(1.0, new BABYLON.Color4(1.0, 0.2, 0.0, 0.0));

        const discParticleSystem = new BABYLON.ParticleSystem("discParticles", 2000, scene);
        discParticleSystem.particleTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/flare.png", scene);
        let discEmitter = new BABYLON.CylinderParticleEmitter();
        discEmitter.radius = 4;
        discEmitter.height = 0.1;
        discParticleSystem.particleEmitterType = discEmitter;

        scene.registerBeforeRender(() => {
            let direction = blackHole.position.subtract(star.position).normalize();
            let trailOffset = direction.scale(manualOffset);
            let discOffset = direction.scale(manualOffset); // Adjust this offset if needed

            particleSystem.emitter = star.position.add(trailOffset);
            discParticleSystem.emitter = star.position.add(discOffset); // Update to move with the star

            particleSystem.direction1 = direction.scale(5);
            particleSystem.direction2 = direction.scale(5);
            star.renderingGroupId = 1;
        });

        setupParticleSystemProperties(particleSystem);
        setupDiscParticleSystemProperties(discParticleSystem);

        particleSystem.start();
        discParticleSystem.start();
    } else {
        console.error("Required celestial bodies are not loaded yet.");
    }
}

function setupParticleSystemProperties(particleSystem) {
    particleSystem.minSize = 0.25;
    particleSystem.maxSize = 0.6;
    particleSystem.minLifeTime = 2.0;
    particleSystem.maxLifeTime = 3.5;
    particleSystem.emitRate = 500;
    particleSystem.minEmitPower = 0.5;
    particleSystem.maxEmitPower = 1.0;
    particleSystem.renderingGroupId = 1;
}

function setupDiscParticleSystemProperties(discParticleSystem) {
    discParticleSystem.color1 = new BABYLON.Color4(0.5, 0.5, 1.0, 1.0);
    discParticleSystem.color2 = new BABYLON.Color4(0.5, 0.5, 1.0, 0.1);
    discParticleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0.0);
    discParticleSystem.minSize = 0.25;
    discParticleSystem.maxSize = 0.6;
    discParticleSystem.minLifeTime = 1.0;
    discParticleSystem.maxLifeTime = 2.0;
    discParticleSystem.emitRate = 2000;
    discParticleSystem.minEmitPower = 0;
    discParticleSystem.maxEmitPower = 0.5;
    discParticleSystem.updateSpeed = 0.01;
    discParticleSystem.renderingGroupId = 1;
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
// Event listener for right-click actions
canvas.addEventListener("pointerdown", function (evt) {
    if (evt.button === 2) { // Right mouse button
        // Capture the current camera position and direction
        const forwardVec = camera.getForwardRay().direction;
        cameraTargetPosition = camera.position.add(forwardVec.scale(camera.radius));
        
        // Set the target to the calculated position
        camera.setTarget(cameraTargetPosition);
        camera.lockedTarget = null; // Ensure locked target is detached
    }
});

    // Ensure camera rotation and panning sensitivity
    camera.inputs.attached.pointers.angularSensibilityX = 500;
    camera.inputs.attached.pointers.angularSensibilityY = 500;

    // Move the ship to the target position
    function moveToTarget(targetPos, arrivalCallback) {
        console.log("Registering moveShip");
        targetPosition = targetPos.clone(); // Clone to avoid modifying the original target position
        onArrivalCallback = arrivalCallback;
        scene.registerBeforeRender(moveShip);
    }

    // Move the ship to the target position
    function moveShip() {
        if (targetPosition) {
            const direction = targetPosition.subtract(spaceship.position).normalize();
            const baseSpeed = 0.4; // Base speed of the ship
            const adjustedSpeed = simulationSpeed > 1 ? baseSpeed * (1 + ((simulationSpeed - 1) / (9.1 - 1)) * (2.3 - 1)) : baseSpeed; // Adjust the speed only if simulation speed is above 1

            spaceship.moveWithCollisions(direction.scale(adjustedSpeed)); // Adjust the speed as needed

            // Use a precise distance check for arrival
            const arrivalThreshold = 0.5; // Threshold 
            if (BABYLON.Vector3.Distance(spaceship.position, targetPosition) < arrivalThreshold) {
                console.log("Arrived at targetPosition");
                scene.unregisterBeforeRender(moveShip); // Stop moving the ship
                targetPosition = null;
                hasArrived = true; // Set the flag to indicate arrival
                particleSystem.stop();

                // Trigger the onArrival callback immediately
                if (onArrivalCallback) {
                    console.log("Executing onArrivalCallback");
                    onArrivalCallback();
                    onArrivalCallback = null; // Clear the callback to avoid repeated calls
                }
            }
        }
    }

    // Handle arrival and trigger popup
    function onArrival() {
        if (lastPickedMesh) {
            const planetName = lastPickedMesh.name === "blackHoleModel" ? "Cygnus-X1" : meshNameToPlanetName[lastPickedMesh.name.replace(/\s+/g, '')] || lastPickedMesh.name;
            console.log("Arrived at:", planetName);

            // Trigger camera focus and show popup only if `lastPickedMesh` is set correctly
            if (lastPickedMesh) {
                console.log("Triggering camera focus and popup for:", planetName);
                camera.setTarget(lastPickedMesh.position);

                setTimeout(() => { // Delay to ensure smooth transition
                    console.log("Showing popup for:", planetName);
                    showPopup(lastPickedMesh);
                    // Do not immediately clear `lastPickedMesh` to avoid issues on repeated clicks
                    console.log("on arrival is used for:", planetName);
                }, 500); // Adjust delay as needed
            }
        } else {
            console.log("lastPickedMesh is null in onArrival");
        }
    }

    // Create and configure celestial bodies, stars, and planets
    const celestialData = [
        {
            name: "Cygnus-X1",
            texture: "N/A",
            size: 10,
            distance: 0,
            orbitSpeed: 0,
            rotationSpeed: 0.4, 
            moons: [],
            type: "blackhole", 
        },
        {
            name: "HDE226868",
            texture: "https://raw.githubusercontent.com/razvanpf/Images/main/bluestar.jpg",
            size: 4,
            distance: 25,
            orbitSpeed: 0.00005,
            rotationSpeed: 0.01,
            moons: [],
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

    // Load the black hole model
    const blackHoleModelUrl = "https://raw.githubusercontent.com/razvanpf/Images/main/newblackhole.glb";
    loadModel(blackHoleModelUrl, scene, 2).then(blackHoleModel => {
        blackHoleModel.name = "blackHoleModel"; // Ensure the model has a name
        blackHoleModel.position = new BABYLON.Vector3(0, 0, 0);
    
        // Ensure the black hole model is interactive
        blackHoleModel.renderingGroupId = 1; // Assign higher rendering group for black hole
        blackHoleModel.isPickable = true; // Ensure the model is pickable
        blackHoleModel.actionManager = new BABYLON.ActionManager(scene);
        blackHoleModel.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function () {
            blackHoleModel.renderOutline = true;
            blackHoleModel.outlineWidth = 0.1;
            blackHoleModel.outlineColor = BABYLON.Color3.White();
        }));
        blackHoleModel.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function () {
            blackHoleModel.renderOutline = false;
        }));
    
        blackHoleModel.getChildMeshes().forEach((childMesh) => {
            childMesh.renderingGroupId = 1;  // Ensure all child meshes also have the higher rendering group
            childMesh.isPickable = true;
            childMesh.actionManager = new BABYLON.ActionManager(scene);
            childMesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function () {
                childMesh.renderOutline = true;
                childMesh.outlineWidth = 0.1;
                childMesh.outlineColor = BABYLON.Color3.White();
            }));
            childMesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function () {
                childMesh.renderOutline = false;
            }));
        });
        celestialBodies.push({ mesh: blackHoleModel, data: celestialData[0], angle: 0 });
    
        console.log("Black hole model loaded and interactive:", blackHoleModel);
    }).catch(error => {
        console.error("Failed to load the black hole model:", error);
    });

    // Create celestial bodies
    celestialData.forEach((data, index) => {
        // Create planet
        if (data.name === "Cygnus-X1") {
            // Skip creating a sphere for Cygnus-X1 as we are loading a GLB model instead
            console.log("skipped creation of Cygnus X1")
            return;
        }
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
    });

    // Initialize angle property for celestial bodies
    celestialBodies.forEach((body) => {
        body.angle = 0;
    });

    // Animate celestial bodies
    scene.registerBeforeRender(function () {
        const deltaTime = engine.getDeltaTime() * 0.001; // Default to 16ms if not defined
    
        celestialBodies.forEach((body) => {
            const distance = body.data.distance;
            const angle = (Date.now() * body.data.orbitSpeed * speedMultiplier * simulationSpeed) % (2 * Math.PI);
            body.mesh.position.x = distance * Math.cos(angle);
            body.mesh.position.z = distance * Math.sin(angle);

            // Rotation around own axis
                body.mesh.rotation.y -= body.data.rotationSpeed * simulationSpeed * 0.01; // Counter-clockwise rotation
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
        console.log (listItem)
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

        // Update handleCanvasClick to call moveToTarget
        function handleCanvasClick(evt) {
            pickResult = scene.pick(evt.clientX, evt.clientY);
            if (pickResult.hit && pickResult.pickedMesh) {
                let pickedMesh = pickResult.pickedMesh;

                // Check if the picked mesh is a child of the black hole model
                let parentMesh = pickedMesh.parent;
                while (parentMesh) {
                    if (parentMesh.name === "blackHoleModel") {
                        pickedMesh = parentMesh;
                        break;
                    }
                    parentMesh = parentMesh.parent;
                }

                console.log("Picked mesh:", pickedMesh.name);
                console.log("Picked point:", pickResult.pickedPoint);

                targetPosition = pickResult.pickedPoint;
                spaceship.lookAt(targetPosition);
                particleSystem.start();

                // Detach the ship from the planet when a new target is selected
                detachShipFromPlanet(spaceship);

                // Reset the hasArrived flag
                hasArrived = false;

                // Check if the target is a planet, moon, sun, or black hole
                if (pickedMesh.name.startsWith("planet") || pickedMesh.name === "blackHoleModel") {
                    lastPickedMesh = pickedMesh; // Store the last picked mesh
                    console.log("Starting to move to target:", pickedMesh.name);
                    startUpdatingTargetPosition(pickedMesh);

                    // Call moveToTarget to move the ship towards the target
                    moveToTarget(targetPosition, onArrival);
                } else {
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
                        if (lastPickedMesh.name.startsWith("planet") || lastPickedMesh.name === "blackHoleModel") {
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
            "Cygnus-X1": {
                name: "Cygnus X-1",
                description: "Cygnus X-1 is a stellar-mass black hole, one of the most studied in the galaxy. It is part of a binary system with the blue supergiant star HDE226868. The intense gravitational pull of the black hole is drawing material from HDE226868, forming an accretion disk that emits powerful X-rays.",
                image: "https://raw.githubusercontent.com/razvanpf/Images/main/2D%20Solar%20System%20Textures/BlackHole2D.png",
                age: "5 million years",
                mass: "14.8 × 10^30 kg",
                atmosphere: "None",
                diameter: "60 km (Schwarzschild radius)",
                gravity: "300,000 m/s² (at event horizon)"
            },
            "HDE226868": {
                name: "HDE226868",
                description: "HDE226868 is a massive blue supergiant star known for its significant size and luminosity. It is a part of the binary system with the black hole Cygnus X-1. The star is notable for its intense radiation and powerful stellar winds. While some of its material is being pulled by the black hole, HDE226868 continues to shine brightly and dominates its region of space.",
                image: "https://raw.githubusercontent.com/razvanpf/Images/main/2D%20Solar%20System%20Textures/BlueStar2D.png",
                age: "5 million years",
                mass: "20 × 10^30 kg",
                atmosphere: "Hydrogen, Helium",
                diameter: "25 million km",
                gravity: "1,400 m/s²"
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

    Promise.all([
        loadModel(blackHoleModelUrl, scene, 2).then(model => {
            celestialBodies.push({ mesh: model, data: celestialData[0], angle: 0 });
            return model; // Return the model for further chaining
        }),
        new Promise(resolve => {
            celestialData.forEach((data, index) => {
                if (data.name === "Cygnus-X1") {
                    return; // Skip creating a sphere for Cygnus-X1
                }
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
                resolve();
            });
        })
    ]).then(() => {
        setupAccretionDiskEffect(scene); // Ensure this is called after models are loaded
    });

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
function startUpdatingTargetPosition(mesh) {
    if (intervalId) {
        clearInterval(intervalId);
    }
    intervalId = setInterval(() => {
        if (targetPosition) {
            targetPosition = mesh.position.clone();
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

// Screenshot //
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