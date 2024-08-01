document.addEventListener("DOMContentLoaded", function() {
    const canvas = document.getElementById("renderCanvas");
    const engine = new BABYLON.Engine(canvas, true);

    const createScene = () => {
        const scene = new BABYLON.Scene(engine);

        // Camera setup
        const camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 0, -100), scene);
        camera.setTarget(BABYLON.Vector3.Zero());
        camera.attachControl(canvas, true);

        // Lock camera rotation
        camera.inputs.removeByType("FreeCameraMouseInput");

        // Manually handle mouse wheel for zooming
        const zoomSpeed = 5;
        const minZ = -20;
        const maxZ = -200;

        window.addEventListener("wheel", (event) => {
            const delta = event.deltaY < 0 ? zoomSpeed : -zoomSpeed;
            const newZ = camera.position.z + delta;
            if (newZ > minZ) {
                camera.position.z = minZ;
            } else if (newZ < maxZ) {
                camera.position.z = maxZ;
            } else {
                camera.position.z = newZ;
            }
        });

        // Adding background image
        const background = new BABYLON.Layer("background", "", scene);
        background.texture = new BABYLON.Texture("https://raw.githubusercontent.com/razvanpf/Images/main/2kmilkyway.jpg", scene);
        background.isBackground = true;

        const starData = [
            { 
                name: "Sun (Sol)", 
                texture: "https://raw.githubusercontent.com/razvanpf/Images/main/2ksun.jpg", 
                position: new BABYLON.Vector3(0, 0, 0), 
                size: 2, 
                color: new BABYLON.Color3(1, 1, 0), 
                system: "../solarSystem1SOL/solarsystem1.html",
                description: "The Sun, a G-type main-sequence star, dominates the central region of this solar system. This nearly perfect sphere of hot plasma exhibits internal convective motion, generating a magnetic field via a dynamo process.",
                type: "G-type Main-Sequence Star (G2V)",
                age: "4.6 billion years",
                planets: "8 planets, 200+ moons",
                dangerLevel: "Low",
                image: "https://raw.githubusercontent.com/razvanpf/Images/main/solarsystem.webp",
                rotationSpeed: 0.01, // Rotation speed in radians per frame
                distanceFromSun: "0" // Distance from the Sun
            },
            { 
                name: "Betelgeuse", 
                texture: "https://raw.githubusercontent.com/razvanpf/Images/main/2ksun.jpg", 
                position: new BABYLON.Vector3(15, 20, 0), 
                size: 3, 
                color: new BABYLON.Color3(1, 0, 0), 
                system: "",
                description: "Betelgeuse is a colossal red supergiant, roughly 700 times the size of Sol. This star is in the latter stages of its life and is expected to explode as a supernova within the next million years.",
                type: "Red Supergiant",
                age: "8-10 million years",
                planets: "Unknown",
                dangerLevel: "High",
                image: "https://raw.githubusercontent.com/razvanpf/Images/main/Betelgeuse.jpg",
                rotationSpeed: 0.005, // Rotation speed in radians per frame
                distanceFromSun: "642.5" // Distance from the Sun
            },
            { 
                name: "Proxima Centauri", 
                texture: "https://raw.githubusercontent.com/razvanpf/Images/main/bluestar.jpg", 
                position: new BABYLON.Vector3(-20, -10, 0), 
                size: 1, 
                color: new BABYLON.Color3(0, 1, 1), 
                system: "../solarSystem2PROXIMA/solarsystem2.html",
                description: "Proxima Centauri, the nearest known star to Sol, is a red dwarf with a low luminosity and frequent stellar flares. It harbors a known planet, Proxima Centauri b.",
                type: "Red Dwarf (M-type)",
                age: "4.85 billion years",
                planets: "1 known planet (Proxima Centauri b)",
                dangerLevel: "Medium",
                image: "https://raw.githubusercontent.com/razvanpf/Images/main/proximacentauri.jpeg",
                rotationSpeed: 0.02, // Rotation speed in radians per frame
                distanceFromSun: "4.24" // Distance from the Sun
            },
            { 
                name: "Cygnus X-1", 
                texture: "", 
                position: new BABYLON.Vector3(-15, 15, 0), 
                size: 1.5, 
                color: new BABYLON.Color3(0, 0, 0), 
                system: "../solarySystem4CYGNUS/solarsystem4.html",
                description: "Cygnus X-1 is a prominent X-ray source and a well-known black hole, part of a binary system with a blue supergiant companion star. It is one of the strongest X-ray emitters known.",
                type: "Black Hole",
                age: "Estimated to be millions of years",
                planets: "None",
                dangerLevel: "Extreme",
                image: "https://raw.githubusercontent.com/razvanpf/Images/main/cygnusX1.jpg",
                rotationSpeed: 0, // Black hole might not have a rotation speed
                distanceFromSun: "6070" // Distance from the Sun
            },
            { 
                name: "Sirius A & B", 
                texture: "https://raw.githubusercontent.com/razvanpf/Images/main/bluestar.jpg", 
                position: new BABYLON.Vector3(30, -15, 0), 
                size: 2, 
                color: new BABYLON.Color3(0, 0, 1), 
                system: "",
                description: "Sirius, the brightest star in the night sky, is a binary system consisting of Sirius A, a main-sequence star, and Sirius B, a white dwarf. It is located in the Canis Major constellation.",
                type: "Binary Star System (A1V, DA2)",
                age: "200-300 million years",
                planets: "Potential exoplanets under observation",
                dangerLevel: "Low",
                image: "https://raw.githubusercontent.com/razvanpf/Images/main/SiriusAB.jpg",
                rotationSpeed: 0.01, // Rotation speed in radians per frame
                distanceFromSun: "8.6" // Distance from the Sun
            },
            { 
                name: "Vega", 
                texture: "https://raw.githubusercontent.com/razvanpf/Images/main/2ksun.jpg", 
                position: new BABYLON.Vector3(-30, 25, 0), 
                size: 1, 
                color: new BABYLON.Color3(1, 1, 1), 
                system: "",
                description: "Vega, the brightest star in the Lyra constellation, is one of the most luminous stars in its neighborhood. It has been extensively studied and serves as a standard for calibrating astronomical brightness.",
                type: "Blue-White Main-Sequence Star (A0V)",
                age: "455 million years",
                planets: "Potential exoplanets under observation",
                dangerLevel: "Low",
                image: "https://raw.githubusercontent.com/razvanpf/Images/main/Vega.png",
                rotationSpeed: 0.015, // Rotation speed in radians per frame
                distanceFromSun: "25" // Distance from the Sun
            },
            { 
                name: "Kepler-47", 
                texture: "https://raw.githubusercontent.com/razvanpf/Images/main/2ksun.jpg", 
                position: new BABYLON.Vector3(10, -30, 0), 
                size: 1.2, 
                color: new BABYLON.Color3(0.65, 0.16, 0.16), 
                system: "../solarSystem3KEPLER/solarsystem3.html",
                description: "Kepler-47 is a binary star system located in the Cygnus constellation. It is notable for its multi-planet circumbinary system, with three known planets orbiting the binary stars.",
                type: "Binary Star System",
                age: "Unknown",
                planets: "3 known planets",
                dangerLevel: "Medium",
                image: "https://raw.githubusercontent.com/razvanpf/Images/main/Kepler47.jpg",
                rotationSpeed: 0.01, // Rotation speed in radians per frame
                distanceFromSun: "4900" // Distance from the Sun
            }
        ];

        function animateText(label, text) {
            label.text = ""; // Clear initial text
            let index = 0;
            const interval = setInterval(() => {
                if (index < text.length) {
                    label.text += text[index];
                    index++;
                } else {
                    clearInterval(interval);
                }
            }, 100); // Adjust the speed by changing the interval time
        }

        const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        starData.forEach(star => {
            const sphere = BABYLON.MeshBuilder.CreateSphere(star.name, { diameter: star.size }, scene);
            const material = new BABYLON.StandardMaterial(star.name + "Mat", scene);
            if (star.name === "Cygnus X-1") {
                material.diffuseColor = new BABYLON.Color3(0, 0, 0); // Black color for the black hole
            } else {
                material.emissiveTexture = new BABYLON.Texture(star.texture, scene);
                material.diffuseColor = star.color;
            }
            material.disableLighting = true;
            sphere.material = material;
            sphere.position = star.position;

            if (star.name === "Cygnus X-1") {
                // Add a simple distortion effect around the black hole
                const distortionLayer = new BABYLON.HighlightLayer("hl1", scene);
                distortionLayer.addMesh(sphere, BABYLON.Color3.White());
            } else {
                // Glow Layer for other stars
                const glowLayer = new BABYLON.GlowLayer("glow", scene);
                glowLayer.intensity = 1.5;
                glowLayer.addIncludedOnlyMesh(sphere);

                // Create sun rays for other stars
                function createSunRays(scene, sun, color) {
                    const sunRays = new BABYLON.VolumetricLightScatteringPostProcess('godrays', 1.0, scene.activeCamera, sun, 100, BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, false);
                    sunRays.exposure = 0.3;
                    sunRays.decay = 0.96815;
                    sunRays.weight = 0.58767;
                    sunRays.density = 0.926;
                    sunRays.renderingGroupId = 0;
                    sunRays.mesh.material.emissiveColor = color;
                }

                createSunRays(scene, sphere, star.color);
            }

            // Add hover effect for scaling the star
            sphere.actionManager = new BABYLON.ActionManager(scene); // Ensure this is set once per star

            sphere.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, () => {
                console.log(`Mouse over: ${star.name}`);
                sphere.scaling = new BABYLON.Vector3(1.5, 1.5, 1.5); // Scale up
                console.log(`Scaling up: ${star.name}`);
            }));

            sphere.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, () => {
                console.log(`Mouse out: ${star.name}`);
                sphere.scaling = new BABYLON.Vector3(1, 1, 1); // Scale down
                console.log(`Scaling down: ${star.name}`);
            }));

            // Add star labels
            const label = new BABYLON.GUI.TextBlock();
            label.text = star.name.toUpperCase();
            label.color = "white";
            label.fontSize = 18;
            label.fontFamily = "Poppins";
            label.fontWeight = "light";
            label.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            label.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;

            // Call the animateText function to animate the label text
            animateText(label, star.name);

            advancedTexture.addControl(label);
            label.linkWithMesh(sphere);
            label.linkOffsetX = 95;

            sphere.actionManager = new BABYLON.ActionManager(scene);
            sphere.actionManager.registerAction(
                new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
                    showSidebar(star); // Show the sidebar with star details
                })
            );
        });

        // Enable panning
        const PAN_BOUNDARY = 50;
        let isPanning = false;
        let startPoint = null;

        scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case BABYLON.PointerEventTypes.POINTERDOWN:
                    if (pointerInfo.event.button === 0) {
                        isPanning = true;
                        startPoint = { x: pointerInfo.event.clientX, y: pointerInfo.event.clientY };
                    }
                    break;
                case BABYLON.PointerEventTypes.POINTERUP:
                    isPanning = false;
                    startPoint = null;
                    break;
                case BABYLON.PointerEventTypes.POINTERMOVE:
                    if (isPanning && startPoint) {
                        const deltaX = pointerInfo.event.clientX - startPoint.x;
                        const deltaY = pointerInfo.event.clientY - startPoint.y;

                        const newPosX = camera.position.x - deltaX * 0.1;
                        const newPosY = camera.position.y + deltaY * 0.1;

                        if (Math.abs(newPosX) <= PAN_BOUNDARY) {
                            camera.position.x = newPosX;
                        }
                        if (Math.abs(newPosY) <= PAN_BOUNDARY) {
                            camera.position.y = newPosY;
                        }

                        startPoint = { x: pointerInfo.event.clientX, y: pointerInfo.event.clientY };
                    }
                    break;
            }
        });

        // Rotate stars
        scene.registerBeforeRender(() => {
            starData.forEach(star => {
                const mesh = scene.getMeshByName(star.name);
                if (mesh && star.rotationSpeed) {
                    mesh.rotation.y += star.rotationSpeed;
                }
            });
        });

// Create lines and tooltips for distances
const sun = scene.getMeshByName("Sun (Sol)");

starData.forEach(star => {
    if (star.name !== "Sun (Sol)") {
        const starMesh = scene.getMeshByName(star.name);
        const points = [sun.position, starMesh.position];
        const line = BABYLON.MeshBuilder.CreateLines(`line-${star.name}`, { points }, scene);
        line.color = BABYLON.Color3.White();

        const distance = star.distanceFromSun || "Unknown distance";

        // Create GUI for tooltips
        const tooltipTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        const tooltip = new BABYLON.GUI.TextBlock();
        tooltip.text = `${star.name.toUpperCase()} - ${distance.toUpperCase()} LIGHT YEARS`;
        tooltip.color = "white";
        tooltip.fontSize = 18;
        tooltip.fontFamily = "Poppins";
        tooltip.fontWeight = "light";
        tooltip.background = "black";
        tooltip.alpha = 0;
        tooltipTexture.addControl(tooltip);

        line.actionManager = new BABYLON.ActionManager(scene);

        line.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, (evt) => {
            console.log(`Mouse over line: ${star.name}`);
            tooltip.alpha = 1; // Show tooltip
        }));

        line.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, () => {
            console.log(`Mouse out line: ${star.name}`);
            tooltip.alpha = 0; // Hide tooltip
        }));

        scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case BABYLON.PointerEventTypes.POINTERMOVE:
                    if (tooltip.alpha === 1) {
                        const pointerX = pointerInfo.event.clientX;
                        const pointerY = pointerInfo.event.clientY;
                        tooltip.left = `${pointerX - canvas.width / 2 + 15}px`; // Offset tooltip to the right of the cursor
                        tooltip.top = `${pointerY - canvas.height / 2 + 35}px`;  // Offset tooltip below the cursor
                    }
                    break;
            }
        });
    }
});
        

        return scene;
    };

    const scene = createScene();

    engine.runRenderLoop(() => {
        scene.render();
    });

    window.addEventListener("resize", function() {
        engine.resize();
    });

// Function to animate text appearance with adjustable speed
function animateHTMLElementText(element, text, speed) {
    element.textContent = ""; // Clear initial text
    let index = 0;
    const interval = setInterval(() => {
        if (index < text.length) {
            element.textContent += text[index];
            index++;
        } else {
            clearInterval(interval);
        }
    }, speed);
}

// Function to show the sidebar with star details
function showSidebar(star) {
    const starNameElement = document.getElementById("star-name");
    const starImageElement = document.getElementById("star-image");
    const starDescriptionElement = document.getElementById("star-description");
    const starTypeElement = document.getElementById("star-type");
    const starAgeElement = document.getElementById("star-age");
    const starPlanetsMoonsElement = document.getElementById("star-planets-moons");
    const starDangerLevelElement = document.getElementById("star-danger-level");

    // Animate text appearance with different speeds
    animateHTMLElementText(starNameElement, star.name, 100);
    starImageElement.src = star.image;
    animateHTMLElementText(starDescriptionElement, star.description, 20);
    animateHTMLElementText(starTypeElement, star.type, 100);
    animateHTMLElementText(starAgeElement, star.age, 100);
    animateHTMLElementText(starPlanetsMoonsElement, star.planets, 100);
    animateHTMLElementText(starDangerLevelElement, star.dangerLevel, 100);

    document.getElementById("star-image").src = star.image;

    const visitButton = document.getElementById("visit-system-button");
    if (star.system) {
        visitButton.onclick = () => {
            window.location.href = star.system;
        };
    } else {
        visitButton.onclick = () => {
            alert("This system is not yet implemented.");
        };
    }

    document.getElementById("sidebar").style.left = "0"; // Show the sidebar
}

    // Function to hide the sidebar
    function hideSidebar() {
        document.getElementById("sidebar").style.left = "-350px"; // Hide the sidebar
    }

    // Close sidebar when clicking outside of it
    window.onclick = function(event) {
        if (event.target == document.getElementById("sidebar")) {
            hideSidebar();
        }
    };

    // Close sidebar when clicking the close button
    document.getElementById("close-sidebar-button").onclick = function() {
        hideSidebar();
    };
});