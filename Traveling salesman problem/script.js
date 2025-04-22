// Configuration
const populationSize = 100;
const tournamentSize = 5;
const mutationRate = 0.02;
const elitismCount = 2;
const maxGenerations = 1000;
const animationSpeed = 50; // milliseconds between generations

// Variables for map and visualization
let map;
let points = [];
let path = [];
let bestPath = [];
let isCalculating = false;
let currentGeneration = 0;
let bestDistance = Infinity;
let currentPopulation = null;

// Add these variables for step-by-step visualization
let currentStepPath = [];
let unvisitedPoints = [];
let currentPointIndex = -1;

// Add at the top with other variables
let actualSteps = 0;  // Track actual path steps

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const controlsDiv = document.querySelector('.controls');
    if (controlsDiv) {
        // Clear existing content
        controlsDiv.innerHTML = '';
        
        // Controls section
        const controlsHeader = document.createElement('h2');
        controlsHeader.textContent = 'Controls';
        controlsDiv.appendChild(controlsHeader);

        // Add point controls
        const addPoint = document.createElement('button');
        addPoint.id = 'addPoint';
        addPoint.textContent = 'Add Point';
        controlsDiv.appendChild(addPoint);

        const deleteLastPoint = document.createElement('button');
        deleteLastPoint.id = 'deleteLastPoint';
        deleteLastPoint.textContent = 'Delete Last Point';
        controlsDiv.appendChild(deleteLastPoint);

        const clearPoints = document.createElement('button');
        clearPoints.id = 'clearPoints';
        clearPoints.textContent = 'Clear Points';
        controlsDiv.appendChild(clearPoints);

        const randomPoints = document.createElement('button');
        randomPoints.id = 'randomPoints';
        randomPoints.textContent = 'Random Points';
        controlsDiv.appendChild(randomPoints);

        // Solve section
        const solveHeader = document.createElement('h2');
        solveHeader.textContent = 'Solve';
        controlsDiv.appendChild(solveHeader);

        const solve = document.createElement('button');
        solve.id = 'solve';
        solve.textContent = 'Solve';
        controlsDiv.appendChild(solve);

        const step = document.createElement('button');
        step.id = 'step';
        step.textContent = 'Step';
        controlsDiv.appendChild(step);

        const reset = document.createElement('button');
        reset.id = 'reset';
        reset.textContent = 'Reset';
        controlsDiv.appendChild(reset);

        // Statistics section
        const statsHeader = document.createElement('h2');
        statsHeader.textContent = 'Statistics';
        controlsDiv.appendChild(statsHeader);

        const stats = document.createElement('div');
        stats.className = 'statistics';
        stats.innerHTML = `
            <div>Points: <span id="pointCount">0</span></div>
            <div>Path Length: <span id="pathLength">0</span></div>
            <div>Steps: <span id="stepCount">0</span></div>
        `;
        controlsDiv.appendChild(stats);
    }
    init();
    
    // Add event listeners for control buttons
    document.getElementById('solve').addEventListener('click', () => {
        if (points.length >= 3) {
            startCalculation();
        } else {
            alert('Please add at least 3 points to calculate a route.');
        }
    });

    document.getElementById('step').addEventListener('click', performStep);
    document.getElementById('reset').addEventListener('click', resetCalculation);
    document.getElementById('deleteLastPoint').addEventListener('click', deleteLastPoint);
    document.getElementById('addPoint').addEventListener('click', () => {
        const bounds = map.getBounds();
        const center = map.getCenter();
        // Add point at the center of the current view
        addPoint(center);
    });
    document.getElementById('clearPoints').addEventListener('click', () => {
        if (!isCalculating) {
            points.forEach(point => point.marker.remove());
            points = [];
            resetCalculation();
        }
    });
    document.getElementById('randomPoints').addEventListener('click', () => {
        if (!isCalculating) {
            generateRandomPoints();
        }
    });
});

function startCalculation() {
    if (isCalculating) return;
    
    isCalculating = true;
    currentGeneration = 0;
    document.getElementById('solve').disabled = true;
    document.getElementById('step').disabled = true;
    document.getElementById('addPoint').disabled = true;
    document.getElementById('clearPoints').disabled = true;
    document.getElementById('randomPoints').disabled = true;
    document.getElementById('deleteLastPoint').disabled = true;
    
    currentPopulation = createInitialPopulation();
    bestDistance = Infinity;
    
    evolve();
}

function evolve() {
    if (!isCalculating) return;

    performOneGeneration();
    
    // Check if we have a complete valid path
    if (bestPath.length === points.length + 1) {  // +1 because path includes return to start
        isCalculating = false;
        document.getElementById('solve').disabled = false;
        document.getElementById('step').disabled = false;
        document.getElementById('addPoint').disabled = false;
        document.getElementById('clearPoints').disabled = false;
        document.getElementById('randomPoints').disabled = false;
        document.getElementById('deleteLastPoint').disabled = false;
        actualSteps = points.length;  // Set steps to number of points
        drawPath();
        updateStatistics();
        return;
    }

    if (currentGeneration < maxGenerations) {
        setTimeout(evolve, 1000 / animationSpeed);
    } else {
        isCalculating = false;
        document.getElementById('solve').disabled = false;
        document.getElementById('step').disabled = false;
        document.getElementById('addPoint').disabled = false;
        document.getElementById('clearPoints').disabled = false;
        document.getElementById('randomPoints').disabled = false;
        document.getElementById('deleteLastPoint').disabled = false;
        actualSteps = points.length;
        drawPath();
        updateStatistics();
    }
}

function performOneGeneration() {
    if (!currentPopulation) return;

    // Calculate fitness for each chromosome
    const fitnesses = currentPopulation.map(p => calculateFitness(p));
    const maxFitness = Math.max(...fitnesses);
    const bestIndex = fitnesses.indexOf(maxFitness);

    // Update best path if we found a better one
    if (1/maxFitness < bestDistance) {
        bestDistance = 1/maxFitness;
        bestPath = [...currentPopulation[bestIndex]];
        
        // Add the starting point to the end to complete the circuit
        if (bestPath.length > 0 && bestPath[0] !== bestPath[bestPath.length - 1]) {
            bestPath.push(bestPath[0]);
        }
    }

    // Create new population
    const newPopulation = [];

    // Elitism - keep best solutions
    const sortedIndices = fitnesses
        .map((f, i) => ({fitness: f, index: i}))
        .sort((a, b) => b.fitness - a.fitness)
        .map(item => item.index);
    
    for (let i = 0; i < elitismCount; i++) {
        newPopulation.push([...currentPopulation[sortedIndices[i]]]);
    }

    // Fill rest of population with crossover and mutation
    while (newPopulation.length < populationSize) {
        const parent1 = tournamentSelection(currentPopulation, fitnesses);
        const parent2 = tournamentSelection(currentPopulation, fitnesses);
        let child = orderCrossover(parent1, parent2);
        child = mutate(child);
        newPopulation.push(child);
    }

    currentPopulation = newPopulation;
    currentGeneration++;
}

// Initialize map and points array
function init() {
    // Initialize map with a world view first
    map = L.map('map', {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 18,
        worldCopyJump: true,
        maxBoundsViscosity: 1.0,
        language: 'en',  // Set language to English
        noWrap: false,
        maxBounds: [[-85, -Infinity], [85, Infinity]],  // Restrict to Mercator projection limits
        bounceAtZoomLimits: true,
        crs: L.CRS.EPSG3857  // Use spherical mercator projection
    });
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 18,
        minZoom: 2,
        noWrap: false,
        locale: 'en',
        lang: 'en',
        continuousWorld: true,
        bounds: [[-85.0511, -180], [85.0511, 180]],  // Mercator projection limits
        tileSize: 256
    }).addTo(map);

    // Add click handler for adding points
    map.on('click', (e) => {
        if (!isCalculating) {
            addPoint(e.latlng);
        }
    });

    // Initialize canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Animate to India after a short delay
    setTimeout(() => {
        map.flyTo([20.5937, 78.9629], 5, {
            duration: 2,
            easeLinearity: 0.5
        });
    }, 1000);
}

function resizeCanvas() {
    const canvas = document.getElementById('canvas');
    const mapContainer = document.getElementById('map');
    canvas.width = mapContainer.offsetWidth;
    canvas.height = mapContainer.offsetHeight;
    drawPath();
}

function generateRandomPoints() {
    if (!isCalculating) {
        console.log('Generating random points...');
        
        // Ensure map is initialized
        if (!map || !map.getBounds) {
            console.error('Map not properly initialized');
            return;
        }

        // Remove overlay if it exists
        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.remove();
        }

        // Clear existing points first
        points.forEach(point => point.marker.remove());
        points = [];
        resetCalculation();

        const bounds = map.getBounds();
        console.log('Map bounds:', bounds.toString());
        
        const numPoints = 5 + Math.floor(Math.random() * 6); // 5-10 points
        console.log('Will generate', numPoints, 'points');

        // Generate all points first
        const pointsToAdd = [];
        for (let i = 0; i < numPoints; i++) {
            const lat = bounds.getSouth() + Math.random() * (bounds.getNorth() - bounds.getSouth());
            const lng = bounds.getWest() + Math.random() * (bounds.getEast() - bounds.getWest());
            pointsToAdd.push(L.latLng(lat, lng));
        }

        // Add points with delay
        let i = 0;
        function addNextPoint() {
            if (i < pointsToAdd.length) {
                console.log('Adding point', i + 1, 'at', pointsToAdd[i].toString());
                addPoint(pointsToAdd[i]);
                i++;
                setTimeout(addNextPoint, 200);
            }
        }

        // Start adding points
        addNextPoint();
    }
}

function addPoint(latlng) {
    // Remove the overlay message when first point is added
    const overlay = document.getElementById('canvasOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }

    // Create a marker icon based on whether this is the first point or not
    const isFirstPoint = points.length === 0;
    const markerIcon = isFirstPoint ? 
        L.divIcon({
            className: 'home-marker',
            html: '<div class="home-marker-container"><div class="home-marker-icon"></div><div class="home-marker-pulse"></div></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        }) :
        L.divIcon({
            className: 'custom-marker',
            html: '<div class="marker-container"><div class="marker-point"></div><div class="marker-pulse"></div></div>',
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        });

    const marker = L.marker(latlng, {
        draggable: true,
        icon: markerIcon,
        interactive: true,
        bubblingMouseEvents: false,
        zIndexOffset: isFirstPoint ? 2000 : 1000  // Ensure home marker stays on top
    }).addTo(map);

    // Add marker drag handler
    marker.on('dragend', () => {
        if (!isCalculating) {
            updatePointPosition(marker);
            drawPath();
        }
    });

    points.push({
        marker: marker,
        latlng: latlng,
        isHome: isFirstPoint
    });

    // Update statistics
    updateStatistics();
}

function updatePointPosition(marker) {
    const point = points.find(p => p.marker === marker);
    if (point) {
        point.latlng = marker.getLatLng();
    }
}

function drawPath() {
    // Remove existing polylines and tooltips
    map.eachLayer((layer) => {
        if (layer instanceof L.Polyline || layer instanceof L.Tooltip) {
            map.removeLayer(layer);
        }
    });

    if (bestPath.length > 1) {
        const coordinates = bestPath.map(index => points[index].marker.getLatLng());
        
        // Draw path segments with tooltips
        for (let i = 0; i < coordinates.length - 1; i++) {
            const segmentCoords = [coordinates[i], coordinates[i + 1]];
            const polyline = L.polyline(segmentCoords, {
                color: '#4A90E2',
                weight: 3,
                opacity: 0.8,
                className: 'path-line'
            }).addTo(map);

            // Add distance tooltip with offset calculation
            const distance = calculateDistance(points[bestPath[i]], points[bestPath[i + 1]]);
            const p1 = map.latLngToContainerPoint(coordinates[i]);
            const p2 = map.latLngToContainerPoint(coordinates[i + 1]);
            const midPoint = L.latLng(
                (coordinates[i].lat + coordinates[i + 1].lat) / 2,
                (coordinates[i].lng + coordinates[i + 1].lng) / 2
            );
            
            // Calculate perpendicular offset
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            if (length > 0) {
                const offsetX = -dy * 20 / length; // 20 pixels perpendicular offset
                const offsetY = dx * 20 / length;
                const offsetPoint = map.containerPointToLatLng([
                    (p1.x + p2.x) / 2 + offsetX,
                    (p1.y + p2.y) / 2 + offsetY
                ]);
                
                L.tooltip({
                    permanent: true,
                    direction: 'center',
                    className: 'distance-tooltip',
                    offset: [0, 0]
                })
                .setLatLng(offsetPoint)
                .setContent(formatDistance(distance))
                .addTo(map);
            }
        }
    }
    updateStatistics();
}

// Convert latitude/longitude to canvas coordinates
function latLngToPoint(lat, lng) {
    const layerPoint = map.latLngToContainerPoint([lat, lng]);
    return {
        x: layerPoint.x,
        y: layerPoint.y,
        lat: lat,
        lng: lng
    };
}

// Draw points and path on canvas
function drawPoints() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw path
    if (path.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        
        const start = latLngToPoint(points[path[0]].lat, points[path[0]].lng);
        ctx.moveTo(start.x, start.y);
        
        for (let i = 1; i < path.length; i++) {
            const point = latLngToPoint(points[path[i]].lat, points[path[i]].lng);
            ctx.lineTo(point.x, point.y);
        }
        
        // Connect back to start
        ctx.lineTo(start.x, start.y);
        ctx.stroke();
    }

    // Draw points
    points.forEach((point, index) => {
        const pos = latLngToPoint(point.lat, point.lng);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw point index
        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.fillText(index + 1, pos.x + 8, pos.y + 4);
    });
}

// Calculate distance between two points using Haversine formula
function calculateDistance(point1, point2) {
    // Use Leaflet's built-in distance calculation (returns meters)
    return point1.latlng.distanceTo(point2.latlng);
}

function formatDistance(meters) {
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
}

function calculatePathLength(path) {
    if (!path || path.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 0; i < path.length - 1; i++) {
        totalDistance += calculateDistance(points[path[i]], points[path[i + 1]]);
    }
    
    // Add distance back to start if it's a complete circuit
    if (path.length > 2 && path[0] !== path[path.length - 1]) {
        totalDistance += calculateDistance(points[path[path.length - 1]], points[path[0]]);
    }
    
    return totalDistance;
}

function calculateFitness(path) {
    let totalDistance = 0;
    for (let i = 0; i < path.length - 1; i++) {
        totalDistance += calculateDistance(points[path[i]], points[path[i + 1]]);
    }
    // Add distance back to start
    totalDistance += calculateDistance(points[path[path.length - 1]], points[path[0]]);
    return 1 / totalDistance; // Higher fitness for shorter paths
}

function createInitialPopulation() {
    const population = [];
    for (let i = 0; i < populationSize; i++) {
        const chromosome = Array.from({length: points.length}, (_, i) => i);
        // Fisher-Yates shuffle
        for (let j = chromosome.length - 1; j > 0; j--) {
            const k = Math.floor(Math.random() * (j + 1));
            [chromosome[j], chromosome[k]] = [chromosome[k], chromosome[j]];
        }
        population.push(chromosome);
    }
    return population;
}

function tournamentSelection(population, fitnesses) {
    const selected = [];
    for (let i = 0; i < tournamentSize; i++) {
        const index = Math.floor(Math.random() * population.length);
        selected.push({
            index: index,
            fitness: fitnesses[index]
        });
    }
    return population[selected.reduce((prev, current) => 
        current.fitness > prev.fitness ? current : prev
    ).index];
}

function orderCrossover(parent1, parent2) {
    const size = parent1.length;
    const start = Math.floor(Math.random() * size);
    const end = start + Math.floor(Math.random() * (size - start));
    
    const child = new Array(size).fill(-1);
    // Copy substring from parent1
    for (let i = start; i <= end; i++) {
        child[i] = parent1[i];
    }
    
    // Fill remaining positions with parent2's genes
    let j = 0;
    for (let i = 0; i < size; i++) {
        if (i >= start && i <= end) continue;
        while (child.includes(parent2[j])) j++;
        child[i] = parent2[j];
        j++;
    }
    
    return child;
}

function mutate(chromosome) {
    if (Math.random() < mutationRate) {
        const i = Math.floor(Math.random() * chromosome.length);
        const j = Math.floor(Math.random() * chromosome.length);
        [chromosome[i], chromosome[j]] = [chromosome[j], chromosome[i]];
    }
    return chromosome;
}

function updateStatistics() {
    document.getElementById('pointCount').textContent = points.length;
    
    // Calculate and display path length
    const distance = calculatePathLength(bestPath);
    document.getElementById('pathLength').textContent = formatDistance(distance);
    
    // Update step count to show actual path steps instead of generations
    document.getElementById('stepCount').textContent = actualSteps;
}

function resetCalculation() {
    isCalculating = false;
    currentGeneration = 0;
    bestDistance = Infinity;
    currentPopulation = null;
    bestPath = [];
    currentStepPath = [];
    unvisitedPoints = [];
    currentPointIndex = -1;
    actualSteps = 0;  // Reset step count
    
    // Enable all buttons
    document.getElementById('solve').disabled = false;
    document.getElementById('step').disabled = false;
    document.getElementById('addPoint').disabled = false;
    document.getElementById('clearPoints').disabled = false;
    document.getElementById('randomPoints').disabled = false;
    document.getElementById('deleteLastPoint').disabled = false;
    
    // Clear the path
    map.eachLayer((layer) => {
        if (layer instanceof L.Polyline || layer instanceof L.Tooltip) {
            map.removeLayer(layer);
        }
    });
    
    updateStatistics();
}

function findNearestPoint(currentPoint, unvisitedPoints) {
    let minDistance = Infinity;
    let nearestIndex = -1;
    
    unvisitedPoints.forEach((pointIndex) => {
        const distance = calculateDistance(points[currentPoint], points[pointIndex]);
        if (distance < minDistance) {
            minDistance = distance;
            nearestIndex = pointIndex;
        }
    });
    
    return nearestIndex;
}

function performStep() {
    if (points.length < 3) {
        alert('Please add at least 3 points to step through the solution.');
        return;
    }

    // Initialize if this is the first step
    if (currentPointIndex === -1) {
        currentStepPath = [];
        unvisitedPoints = Array.from({length: points.length}, (_, i) => i);
        currentPointIndex = unvisitedPoints.shift(); // Start with first point
        currentStepPath.push(currentPointIndex);
        bestPath = currentStepPath;
        actualSteps = 0;  // Initialize step count to 0
        
        // Find and connect to the nearest point immediately
        const nearestIndex = findNearestPoint(currentPointIndex, unvisitedPoints);
        if (nearestIndex !== -1) {
            unvisitedPoints = unvisitedPoints.filter(i => i !== nearestIndex);
            currentStepPath.push(nearestIndex);
            currentPointIndex = nearestIndex;
            bestPath = currentStepPath;
            actualSteps++;  // Increment to 1 for the first step
        }
        
        drawStepPath();
        currentGeneration++;
        updateStatistics();
        return;
    }

    // Find nearest unvisited point
    const nearestIndex = findNearestPoint(currentPointIndex, unvisitedPoints);
    
    if (nearestIndex !== -1) {
        // Remove the found point from unvisited and add to path
        unvisitedPoints = unvisitedPoints.filter(i => i !== nearestIndex);
        currentStepPath.push(nearestIndex);
        currentPointIndex = nearestIndex;
        bestPath = currentStepPath;
        actualSteps++;  // Increment step count
        drawStepPath();
        currentGeneration++;
    } else if (currentStepPath.length === points.length) {
        // Complete the cycle by returning to the start
        currentStepPath.push(currentStepPath[0]);
        bestPath = currentStepPath;
        actualSteps++;  // Increment step count for returning to start
        drawStepPath();
        // Disable step button as we're done
        document.getElementById('step').disabled = true;
        currentGeneration++;
    }
    
    updateStatistics();
}

function drawStepPath() {
    // Remove existing polylines and tooltips
    map.eachLayer((layer) => {
        if (layer instanceof L.Polyline || layer instanceof L.Tooltip) {
            map.removeLayer(layer);
        }
    });

    if (currentStepPath.length > 1) {
        const coordinates = currentStepPath.map(index => points[index].marker.getLatLng());
        
        // Draw completed path segments with tooltips
        for (let i = 0; i < coordinates.length - 1; i++) {
            const segmentCoords = [coordinates[i], coordinates[i + 1]];
            const polyline = L.polyline(segmentCoords, {
                color: '#4A90E2',
                weight: 3,
                opacity: 0.8,
                className: 'step-line'
            }).addTo(map);

            // Add distance tooltip with offset calculation
            const distance = calculateDistance(points[currentStepPath[i]], points[currentStepPath[i + 1]]);
            const p1 = map.latLngToContainerPoint(coordinates[i]);
            const p2 = map.latLngToContainerPoint(coordinates[i + 1]);
            const midPoint = L.latLng(
                (coordinates[i].lat + coordinates[i + 1].lat) / 2,
                (coordinates[i].lng + coordinates[i + 1].lng) / 2
            );
            
            // Calculate perpendicular offset
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            if (length > 0) {
                const offsetX = -dy * 20 / length; // 20 pixels perpendicular offset
                const offsetY = dx * 20 / length;
                const offsetPoint = map.containerPointToLatLng([
                    (p1.x + p2.x) / 2 + offsetX,
                    (p1.y + p2.y) / 2 + offsetY
                ]);
                
                L.tooltip({
                    permanent: true,
                    direction: 'center',
                    className: 'distance-tooltip',
                    offset: [0, 0]
                })
                .setLatLng(offsetPoint)
                .setContent(formatDistance(distance))
                .addTo(map);
            }
        }
    }
    updateStatistics();
}

function deleteLastPoint() {
    if (points.length > 0 && !isCalculating) {
        // Remove the last marker from the map
        const lastPoint = points.pop();
        lastPoint.marker.remove();
        
        // Clear the path if it exists
        if (path.length > 0) {
            path.forEach(p => {
                if (p.line) p.line.remove();
                if (p.tooltip) p.tooltip.remove();
            });
            path = [];
        }
        
        // Reset the current path and update statistics
        bestPath = [];
        currentStepPath = [];
        unvisitedPoints = [];
        currentPointIndex = -1;
        updateStatistics();
    }
}

// Update the styles
const style = document.createElement('style');
style.textContent = `
    .custom-marker {
        display: block;
    }

    .marker-container {
        position: relative;
        width: 12px;
        height: 12px;
        transform: translate(-50%, -50%);
    }
    
    .marker-point {
        position: absolute;
        width: 12px;
        height: 12px;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        background: #3498db;  /* Updated to match GBFS demo blue */
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        animation: markerPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    
    .marker-pulse {
        position: absolute;
        width: 24px;
        height: 24px;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        background: rgba(52, 152, 219, 0.3);  /* Updated to match marker color */
        border-radius: 50%;
        z-index: 999;
        pointer-events: none;
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    .leaflet-marker-icon {
        margin: 0 !important;
        transform-origin: center !important;
    }

    /* Control panel styles */
    .controls {
        background: #1a1a1a;  /* Dark background */
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        padding: 20px;
        margin: 12px;
        animation: slideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        color: #ffffff;
    }

    .controls h2:first-of-type {
        margin-top: 0;
    }

    .controls h2 {
        color: #3498db;
        font-size: 16px;
        margin: 16px 0 12px;
        font-weight: 500;
        letter-spacing: 0.5px;
    }

    .controls button {
        background: #3498db;  /* GBFS demo blue */
        color: white;
        border: none;
        padding: 10px 18px;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
        margin: 6px 0;
        width: 100%;
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        letter-spacing: 0.3px;
    }

    .controls button:hover {
        background: #2980b9;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
    }

    .controls button:disabled {
        background: #2c3e50;
        color: rgba(255, 255, 255, 0.5);
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }

    .distance-tooltip {
        background: rgba(26, 26, 26, 0.9) !important;
        border: none !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
        padding: 4px 8px !important;
        font-size: 12px !important;
        color: #ffffff !important;
        border-radius: 4px !important;
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif !important;
    }

    .statistics {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        color: #ffffff;
        font-size: 14px;
    }

    @keyframes markerPop {
        0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
        }
        100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
    }
    
    @keyframes pulse {
        0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0.8;
        }
        50% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
        }
        100% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0.8;
        }
    }

    @keyframes slideIn {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Add function to check if path is complete
function isPathComplete(path) {
    if (!path || path.length < points.length) return false;
    
    // Check if all points are visited exactly once
    const visited = new Set(path);
    if (visited.size !== points.length) return false;
    
    // Check if the path forms a complete circuit
    const firstPoint = path[0];
    const lastPoint = path[path.length - 1];
    
    // The path should end where it started
    return firstPoint === lastPoint || calculateDistance(points[firstPoint], points[lastPoint]) < 1; // 1 meter threshold
} 