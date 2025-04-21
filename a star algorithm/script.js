const graphCanvas = document.getElementById('graphCanvas');
const ctx = graphCanvas.getContext('2d');
const startAStarButton = document.getElementById('startAStar');
const nextStepButton = document.getElementById('nextStep');
const autoPlayButton = document.getElementById('autoPlay');
const clearButton = document.getElementById('clear');
const goalVector = document.getElementById('goalVector');
const frontier = document.getElementById('frontier');
const estimatedCost = document.getElementById('estimatedCost');
const visiting = document.getElementById('visiting');
const toVisit = document.getElementById('toVisit');
const observation = document.getElementById('observation');
const reason = document.getElementById('reason');

// Add Clear Visited button functionality
const clearVisitedButton = document.getElementById('clearVisited');

// Graph representation
let graph = {};
let nextNodeId = 0;

// State variables
let startVertex = 0;
let goalVertex = 5;
let visited = new Set();
let queue = [];
let currentVertex = null;
let isAutoPlaying = false;
let animationFrameId = null;
let isGoalReached = false;
let gCosts = {}; // Store g costs for each node
let fCosts = {}; // Store f costs for each node

// Animation variables
let animationStartTime = null;
let animationDuration = 1000;
let animationStartX = null;
let animationStartY = null;
let animationEndX = null;
let animationEndY = null;

// Mouse state tracking
let isDragging = false;
let selectedNode = null;
let lastMouseX = 0;
let lastMouseY = 0;
let isAnimating = false;

// Initial canvas setup
function setupCanvas() {
    const container = graphCanvas.parentElement;
    graphCanvas.width = container.clientWidth - 30;
    graphCanvas.height = container.clientHeight - 30;
    ctx.scale(1, 1);
}

// Draw the graph
function drawGraph() {
    ctx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);

    // Draw edges with costs
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    for (const vertex in graph) {
        const { x, y, neighbors, costs } = graph[vertex];
        for (let i = 0; i < neighbors.length; i++) {
            const neighbor = neighbors[i];
            const cost = costs[i];
            const neighborNode = graph[neighbor];
            if (neighborNode) {
                // Draw edge
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(neighborNode.x, neighborNode.y);
                ctx.stroke();

                // Draw cost
                const midX = (x + neighborNode.x) / 2;
                const midY = (y + neighborNode.y) / 2;
                ctx.fillStyle = '#666';
                ctx.font = '12px Inter';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(cost.toString(), midX, midY - 10);
            }
        }
    }

    // Draw nodes
    for (const vertex in graph) {
        const { x, y } = graph[vertex];
        
        // Node circle
        ctx.fillStyle = visited.has(parseInt(vertex)) ? '#97a7c8' : '#1a202c';
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();

        // Highlight current vertex
        if (parseInt(vertex) === currentVertex) {
            ctx.strokeStyle = '#4A90E2';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y, 25, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw vertex label
        ctx.fillStyle = '#fff';
        ctx.font = '16px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(vertex, x, y);

        // Draw g(n) and h(n) values
        ctx.fillStyle = '#4A90E2';
        ctx.font = 'bold 12px Inter';
        ctx.fillText(`g:${gCosts[vertex] || 0}`, x, y + 20);
        ctx.fillText(`h:${graph[vertex].heuristic}`, x, y + 35);
        ctx.fillText(`f:${fCosts[vertex] || 0}`, x, y + 50);
    }

    // Highlight selected node for manual connections
    if (selectedNode !== null && graph[selectedNode]) {
        const { x, y } = graph[selectedNode];
        ctx.strokeStyle = '#4A90E2';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// Animation function
function animateTraversal(fromNode, toNode) {
    return new Promise(resolve => {
        isAnimating = true;
        animationStartTime = null;
        animationStartX = fromNode.x;
        animationStartY = fromNode.y;
        animationEndX = toNode.x;
        animationEndY = toNode.y;

        function animate(timestamp) {
            if (!animationStartTime) animationStartTime = timestamp;
            const progress = (timestamp - animationStartTime) / animationDuration;

            if (progress < 1) {
                drawGraph();
                
                const x = animationStartX + (animationEndX - animationStartX) * progress;
                const y = animationStartY + (animationEndY - animationStartY) * progress;
                
                ctx.strokeStyle = '#4A90E2';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(x, y, 25, 0, Math.PI * 2);
                ctx.stroke();
                
                animationFrameId = requestAnimationFrame(animate);
            } else {
                isAnimating = false;
                animationFrameId = null;
                resolve();
            }
        }
        
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        animationFrameId = requestAnimationFrame(animate);
    });
}

// Update information panel
function updateInfo() {
    goalVector.textContent = goalVertex;
    frontier.textContent = JSON.stringify(queue);
    estimatedCost.textContent = JSON.stringify(queue.map(v => fCosts[v]));
    visiting.textContent = currentVertex !== null ? currentVertex : 'undefined';
    toVisit.textContent = queue.length > 0 ? queue[0] : 'undefined';

    if (currentVertex !== null && graph[currentVertex]) {
        const unvisitedNeighbors = graph[currentVertex].neighbors.filter(n => !visited.has(n));
        const pathCosts = unvisitedNeighbors.map(n => {
            const edgeIndex = graph[currentVertex].neighbors.indexOf(n);
            return graph[currentVertex].costs[edgeIndex];
        });
        const heuristicCosts = unvisitedNeighbors.map(n => graph[n].heuristic);
        const gCostsForNeighbors = unvisitedNeighbors.map(n => gCosts[n] || Infinity);
        const fCostsForNeighbors = unvisitedNeighbors.map((n, i) => gCostsForNeighbors[i] + heuristicCosts[i]);

        let cheapestNode = 'none';
        if (unvisitedNeighbors.length > 0) {
            const minIndex = fCostsForNeighbors.indexOf(Math.min(...fCostsForNeighbors));
            cheapestNode = unvisitedNeighbors[minIndex];
        }

        observation.innerHTML = `
            <h2>Observation</h2>
            <p><strong>Currently visitable nodes:</strong><br>${unvisitedNeighbors.join(', ') || 'none'}</p>
            <p><strong>Path Cost g(n):</strong><br>${pathCosts.join(', ') || 'none'}</p>
            <p><strong>Heuristic Cost h(n):</strong><br>${heuristicCosts.join(', ') || 'none'}</p>
            <p><strong>Total Cost f(n):</strong><br>${fCostsForNeighbors.join(', ') || 'none'}</p>
            ${isGoalReached ? '<p><strong>Reached Goal.</strong></p>' : 
            `<p><strong>Hence Cheapest Node:</strong> ${cheapestNode}</p>`}
        `;
    } else {
        observation.innerHTML = `
            <h2>Observation</h2>
            <p><strong>Currently visitable nodes:</strong><br>none</p>
            <p><strong>Path Cost g(n):</strong><br>none</p>
            <p><strong>Heuristic Cost h(n):</strong><br>none</p>
            <p><strong>Total Cost f(n):</strong><br>none</p>
        `;
    }
}

// A* Search step
async function aStarStep() {
    if (isGoalReached || queue.length === 0 || isAnimating) {
        if (isAutoPlaying) {
            clearInterval(autoPlayInterval);
            isAutoPlaying = false;
        }
        return;
    }

    // If this is the first step, initialize start node
    if (currentVertex === null) {
        currentVertex = queue[0];
        visited.add(currentVertex);
        gCosts[currentVertex] = 0;
        fCosts[currentVertex] = graph[currentVertex].heuristic;
        updateInfo();
        drawGraph();
        return;
    }

    // Sort queue by f cost (g + h)
    queue.sort((a, b) => fCosts[a] - fCosts[b]);

    // Get the next vertex (node with lowest f cost)
    const nextVertex = queue.shift();

    // Animate transition between nodes
    if (graph[nextVertex]) {
        const fromNode = graph[currentVertex];
        const toNode = graph[nextVertex];
        await animateTraversal(fromNode, toNode);
    }

    // Update current vertex and mark as visited
    currentVertex = nextVertex;
    visited.add(currentVertex);

    // Check if we've reached the goal
    if (currentVertex === goalVertex) {
        isGoalReached = true;
        updateInfo();
        drawGraph();
        return;
    }

    // Add unvisited neighbors to queue with updated costs
    const neighbors = graph[currentVertex].neighbors;
    for (let i = 0; i < neighbors.length; i++) {
        const neighbor = neighbors[i];
        if (!visited.has(neighbor)) {
            const edgeCost = graph[currentVertex].costs[i];
            const newGCost = gCosts[currentVertex] + edgeCost;
            
            // Only update if we found a better path
            if (newGCost < (gCosts[neighbor] || Infinity)) {
                gCosts[neighbor] = newGCost;
                fCosts[neighbor] = newGCost + graph[neighbor].heuristic;
                
                if (!queue.includes(neighbor)) {
                    queue.push(neighbor);
                }
            }
        }
    }

    updateInfo();
    drawGraph();
}

// Event Listeners
startAStarButton.addEventListener('click', () => {
    clearAll();
    queue = [startVertex];
    currentVertex = null;
    visited.clear();
    isGoalReached = false;
    gCosts = {};
    fCosts = {};
    aStarStep();
});

nextStepButton.addEventListener('click', () => {
    if (!isAutoPlaying) {
        aStarStep();
    }
});

autoPlayButton.addEventListener('click', () => {
    if (!isAutoPlaying) {
        isAutoPlaying = true;
        autoPlayInterval = setInterval(aStarStep, 1000);
    } else {
        isAutoPlaying = false;
        clearInterval(autoPlayInterval);
    }
});

clearButton.addEventListener('click', clearAll);
clearVisitedButton.addEventListener('click', () => {
    visited.clear();
    currentVertex = null;
    isGoalReached = false;
    gCosts = {};
    fCosts = {};
    updateInfo();
    drawGraph();
});

// Graph manipulation functions
function addNode(x, y, heuristic) {
    const nodeId = nextNodeId++;
    graph[nodeId] = {
        x,
        y,
        neighbors: [],
        costs: [],
        heuristic: heuristic || Math.floor(Math.random() * 10)
    };
    return nodeId;
}

function addEdge(node1, node2, cost) {
    if (!graph[node1].neighbors.includes(node2)) {
        graph[node1].neighbors.push(node2);
        graph[node1].costs.push(cost || Math.floor(Math.random() * 10) + 1);
    }
    if (!graph[node2].neighbors.includes(node1)) {
        graph[node2].neighbors.push(node1);
        graph[node2].costs.push(cost || Math.floor(Math.random() * 10) + 1);
    }
}

function clearAll() {
    graph = {};
    nextNodeId = 0;
    visited.clear();
    queue = [];
    currentVertex = null;
    isGoalReached = false;
    gCosts = {};
    fCosts = {};
    if (isAutoPlaying) {
        clearInterval(autoPlayInterval);
        isAutoPlaying = false;
    }
    updateInfo();
    drawGraph();
}

// Mouse event handlers
graphCanvas.addEventListener('mousedown', (e) => {
    const rect = graphCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on a node
    for (const vertex in graph) {
        const node = graph[vertex];
        const dx = x - node.x;
        const dy = y - node.y;
        if (dx * dx + dy * dy <= 400) { // 20^2
            isDragging = true;
            selectedNode = parseInt(vertex);
            lastMouseX = x;
            lastMouseY = y;
            return;
        }
    }

    // If not clicking on a node, add a new node
    addNode(x, y);
    drawGraph();
});

graphCanvas.addEventListener('mousemove', (e) => {
    if (isDragging && selectedNode !== null) {
        const rect = graphCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        graph[selectedNode].x = x;
        graph[selectedNode].y = y;
        
        drawGraph();
    }
});

graphCanvas.addEventListener('mouseup', () => {
    isDragging = false;
    selectedNode = null;
});

// Initialize the graph
function initializeDefaultGraph() {
    clearAll();
    
    // Add nodes
    const node1 = addNode(100, 100, 10);
    const node2 = addNode(300, 100, 8);
    const node3 = addNode(500, 100, 6);
    const node4 = addNode(100, 300, 4);
    const node5 = addNode(300, 300, 2);
    const node6 = addNode(500, 300, 0);

    // Add edges with costs
    addEdge(node1, node2, 2);
    addEdge(node2, node3, 3);
    addEdge(node3, node6, 4);
    addEdge(node1, node4, 5);
    addEdge(node4, node5, 1);
    addEdge(node5, node6, 2);
    addEdge(node2, node5, 3);
    addEdge(node3, node5, 4);

    drawGraph();
}

// Initialize the canvas and graph
setupCanvas();
initializeDefaultGraph();

// Handle window resize
window.addEventListener('resize', () => {
    setupCanvas();
    drawGraph();
}); 