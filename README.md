# Star Cluster with multiple solar systems simulated

![screenshot (5)](https://github.com/user-attachments/assets/63a99269-5832-4d18-a51a-3dd08ced2aa7)


Welcome to the Star Cluster project! This simulation uses Babylon.js to render a 3D representation of our solar system and other known solar systems complete with planets, moons, asteroids, and dynamic events. Users can explore the systems by firstly choosing a desired star system to visit and then navigating the spaceship and interacting with celestial bodies.

## Features

- **Interactive Solar System**: Navigate through a realistic solar system with planets, moons, and other celestial bodies.
- **Dynamic Events**: Experience dynamic solar flares and comets passing by, with realistic effects and animations.
- **Planetary Information Popups**: Click on planets and moons to discover detailed information about each celestial body, including age, mass, atmosphere, diameter, and gravity.
- **Asteroid Belts**: View and animate two asteroid belts—between Mars and Jupiter and the Kuiper Belt beyond Neptune.
- **Artificial Satellites**: Launch and animate satellites orbiting Earth.
- **Voyager Probe**: Locate and interact with the Voyager spacecraft, featuring a unique lens flare effect.
- **Lens Flare Effects**: Dwarf planets and Voyager feature blinking lights to simulate lens flare effects.
- **Adjustable Simulation Speed**: Use the slider to adjust the simulation speed for a faster or slower exploration experience.
- **Collision Detection**: Enabled collision detection for realistic interactions between objects.
- **Sidebar Discovery List**: Track discovered celestial bodies in the sidebar, automatically updated as you explore.
- **Comprehensive UI Controls**: Interactive UI for speed adjustment, simulation controls, and navigation.
- **Background with Twinkling Stars**: Immerse yourself in a starry background with a realistic twinkling effect.
- **Sun Rays and Glow Effects**: Experience enhanced visuals with glow layers and volumetric light scattering effects around the sun.
- **Planetary Orbits**: View planetary orbits and toggle their visibility for a clear understanding of each planet's path.
- **Welcome Popup**: Initial overlay and welcome popup with navigation instructions for new users.
- **Screenshot**: Screenshot functionality that hides the UI elements and allows you to save a snapshot of the system from your desired angle and position.

### Content structure and files:

Root Directory
-index.html - The main HTML file for the Star-Cluster project.
-starcluster.css - CSS file containing styles for the project.
-starcluster.js - JavaScript file containing the core functionality of the project.

Directories
Each directory represents a different solar system simulation based on their names:
-solarSystem1SOL - Contains files related to the simulation of our Solar System (SOL).
-solarSystem2PROXIMA - Contains files for the simulation of the Proxima Centauri solar system.
-solarSystem3KEPLER - Contains files for simulations based on the Kepler space observatory's findings.
-solarSystem4CYGNUS - Contains files related to the Cygnus-X1 System
-solarSystem5SIRIUS - Contains files for the simulation of the Sirius star system.

Each of these directories would typically contain their own HTML, CSS, and JavaScript files, or possibly additional assets like textures and models, depending on how the simulations are structured and rendered. If there are specific aspects or details you're setting up within these directories, it would be helpful to structure them similarly, with each system encapsulated within its own folder.

### Additions

After creating a new solar system, say for example for an existing star (e.g Vega) , simply go into "starcluster.js" and locate "starData" array, here, locate "Vega" star and under "System" property , add the path to your new solar system index.html file (/NewSystemFolder/NewSystemindex.html). If system property is left empty, a JS message that the system is not yet implemented will be thrown when trying to visit it.

NOTE**: Most complete solar system is SOL which itself is in BETA. The rest of the solar systems are in an ALPHA state and are missing some features that Sol has, currently being developed. Check the version status at the top right corner of the screen when inside any solar system to see versioning.

IMPORTANT NOTE: This is a hobby project not a commercial one. All textures and assets are from free online sources, I do not recommend using them for any type of commercial use and are serving as placeholder for actual licensed assets. For any commercial use, please make sure you use your own assets with valid commercial licenses!!

This project is open source, so feel free to use the code as you see fit. If you create anything awesome with it, I would love to see your work! Email me at razvan.p.faraon@gmail.com . Thank you!
