const graphCanvas = document.getElementById('graphCanvas');
const ctx = graphCanvas.getContext('2d');
const startGBFSButton = document.getElementById('startGBFS');
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
    // Set canvas size based on container
    const container = graphCanvas.parentElement;
    graphCanvas.width = container.clientWidth - 30;  // Subtract padding
    graphCanvas.height = container.clientHeight - 30;
    
    // Set up initial scale
    ctx.scale(1, 1);
}

// Draw the graph
function drawGraph() {
    ctx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);

    // Draw edges
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    for (const vertex in graph) {
        const { x, y, neighbors } = graph[vertex];
        for (const neighbor of neighbors) {
            const neighborNode = graph[neighbor];
            if (neighborNode) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(neighborNode.x, neighborNode.y);
                ctx.stroke();
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

        // Draw heuristic value with better visibility
        ctx.fillStyle = '#4A90E2';
        ctx.font = 'bold 14px Inter';
        ctx.fillText(`h:${graph[vertex].heuristic}`, x, y + 30);
    }

    // Highlight selected node for manual connections
    if (selectedNode !== null && graph[selectedNode]) {
        const { x, y } = graph[selectedNode];
        ctx.strokeStyle = '#4A90E2';  // Changed to blue
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
                
                // Draw animation circle
                const x = animationStartX + (animationEndX - animationStartX) * progress;
                const y = animationStartY + (animationEndY - animationStartY) * progress;
                
                ctx.strokeStyle = '#4A90E2';  // Changed to a visible shade of blue
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
    estimatedCost.textContent = JSON.stringify(queue.map(v => graph[v].heuristic));
    visiting.textContent = currentVertex !== null ? currentVertex : 'undefined';
    toVisit.textContent = queue.length > 0 ? queue[0] : 'undefined';

    // Update observation with current state
    if (currentVertex !== null && graph[currentVertex]) {
        const unvisitedNeighbors = graph[currentVertex].neighbors.filter(n => !visited.has(n));
        const pathCosts = unvisitedNeighbors.map(() => Math.floor(Math.random() * 10) + 1);
        const heuristicCosts = unvisitedNeighbors.map(n => graph[n].heuristic);
        const totalCosts = unvisitedNeighbors.map((_, i) => pathCosts[i] + heuristicCosts[i]);

        let cheapestNode = 'none';
        if (unvisitedNeighbors.length > 0) {
            const minIndex = totalCosts.indexOf(Math.min(...totalCosts));
            cheapestNode = unvisitedNeighbors[minIndex];
        }

        observation.innerHTML = `
            <h2>Observation</h2>
            <p><strong>Currently visitable nodes:</strong><br>${unvisitedNeighbors.join(', ') || 'none'}</p>
            <p><strong>Path Cost g(n):</strong><br>${pathCosts.join(', ') || 'none'}</p>
            <p><strong>Estimated Cost h(n):</strong><br>${heuristicCosts.join(', ') || 'none'}</p>
            <p><strong>Total Cost f(n):</strong><br>${totalCosts.join(', ') || 'none'}</p>
            ${isGoalReached ? '<p><strong>Reached Goal.</strong></p>' : 
            `<p><strong>Hence Cheapest Node:</strong> ${cheapestNode}</p>`}
        `;
    } else {
        observation.innerHTML = `
            <h2>Observation</h2>
            <p><strong>Currently visitable nodes:</strong><br>none</p>
            <p><strong>Path Cost g(n):</strong><br>none</p>
            <p><strong>Estimated Cost h(n):</strong><br>none</p>
            <p><strong>Total Cost f(n):</strong><br>none</p>
        `;
    }
}

// Greedy Best-First Search step
async function gbfsStep() {
    if (isGoalReached || queue.length === 0 || isAnimating) {
        if (isAutoPlaying) {
            clearInterval(autoPlayInterval);
            isAutoPlaying = false;
        }
        return;
    }

    // If this is the first step, highlight start node
    if (currentVertex === null) {
        currentVertex = queue[0];
        visited.add(currentVertex);
        updateInfo();
        drawGraph();
        return;
    }

    // Sort queue by heuristic value
    queue.sort((a, b) => {
        if (!graph[a] || !graph[b]) return 0;
        return graph[a].heuristic - graph[b].heuristic;
    });

    // Get the next vertex (node with lowest heuristic)
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

    // Get unvisited neighbors of current vertex
    const neighbors = graph[currentVertex].neighbors;
    for (const neighbor of neighbors) {
        if (!visited.has(neighbor) && !queue.includes(neighbor)) {
            if (graph[goalVertex]) {
                const goalNode = graph[goalVertex];
                const node = graph[neighbor];
                const dx = node.x - goalNode.x;
                const dy = node.y - goalNode.y;
                graph[neighbor].heuristic = Math.floor(Math.sqrt(dx * dx + dy * dy) / 50);
            }
            queue.push(neighbor);
        }
    }
    
    updateInfo();
    drawGraph();
}

// Event listeners
startGBFSButton.addEventListener('click', () => {
    startVertex = parseInt(document.getElementById('startVertex').value);
    goalVertex = parseInt(document.getElementById('goalVertex').value);
    
    // Validate vertices exist
    if (!graph[startVertex] || !graph[goalVertex]) {
        alert('Start or goal vertex does not exist!');
        return;
    }
    
    // Recalculate heuristics for all nodes based on goal
    const goalNode = graph[goalVertex];
    for (const nodeId in graph) {
        const node = graph[nodeId];
        const dx = node.x - goalNode.x;
        const dy = node.y - goalNode.y;
        node.heuristic = Math.floor(Math.sqrt(dx * dx + dy * dy) / 50);
    }
    
    // Reset state
    visited = new Set();
    queue = [startVertex];
    currentVertex = null;
    isGoalReached = false;
    
    // Start GBFS
    updateInfo();
    drawGraph();
    gbfsStep();
});

nextStepButton.addEventListener('click', () => {
  if (!isGoalReached) {
    gbfsStep();
  }
});

let autoPlayInterval;
autoPlayButton.addEventListener('click', () => {
  if (isAutoPlaying) {
    clearInterval(autoPlayInterval);
    isAutoPlaying = false;
  } else {
    isAutoPlaying = true;
    autoPlayInterval = setInterval(() => {
      if (!isGoalReached) {
        gbfsStep();
      } else {
        clearInterval(autoPlayInterval);
        isAutoPlaying = false;
      }
    }, 1500); // Run every 1.5 seconds
  }
});

// Clear function
function clearAll() {
    // Cancel any ongoing animation
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    // Clear any running interval
    if (isAutoPlaying) {
        clearInterval(autoPlayInterval);
        isAutoPlaying = false;
    }

    // Reset all state variables
    visited = new Set();
    queue = [];
    currentVertex = null;
    isGoalReached = false;
    selectedNode = null;
    isDragging = false;
    isAnimating = false;
    
    // Clear the graph
    graph = {};
    nextNodeId = 0;
    
    // Clear the canvas
    ctx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
    
    // Update UI
    updateInfo();
    drawGraph();
}

// Update clear button event listener
clearButton.addEventListener('click', clearAll);

// Add Clear Visited button functionality
clearVisitedButton.addEventListener('click', () => {
    // Reset traversal state but keep the graph
    visited = new Set();
    queue = [];
    currentVertex = null;
    isGoalReached = false;
    isAnimating = false;
    
    // Cancel any ongoing animation
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    // Clear any running interval
    if (isAutoPlaying) {
        clearInterval(autoPlayInterval);
        isAutoPlaying = false;
    }
    
    // Update UI
    updateInfo();
    drawGraph();
});

// Create a default 3-level graph
function createDefaultGraph() {
    // Clear existing graph
    graph = {};
    nextNodeId = 0;
    
    // Calculate canvas center and spacing
    const centerX = graphCanvas.width / 2;
    const startY = 80;
    const levelSpacing = 120;
    const horizontalSpacing = 150;
    const level3Spacing = 100;  // Smaller spacing for level 3 nodes
    
    // Level 1 (Root)
    const root = addNode(centerX, startY, 15);  // Node 0
    
    // Level 2
    const level2Left = addNode(centerX - horizontalSpacing, startY + levelSpacing, 16);   // Node 1
    const level2Right = addNode(centerX + horizontalSpacing, startY + levelSpacing, 9);    // Node 2
    
    // Level 3
    const level3_1 = addNode(centerX - horizontalSpacing - level3Spacing, startY + levelSpacing * 2, 20);  // Node 3
    const level3_2 = addNode(centerX - horizontalSpacing + level3Spacing, startY + levelSpacing * 2, 10);  // Node 4
    const level3_3 = addNode(centerX + horizontalSpacing - level3Spacing, startY + levelSpacing * 2, 0);   // Node 5 (goal)
    const level3_4 = addNode(centerX + horizontalSpacing + level3Spacing, startY + levelSpacing * 2, 8);   // Node 6
    
    // Connect nodes
    addEdge(root, level2Left);
    addEdge(root, level2Right);
    addEdge(level2Left, level3_1);
    addEdge(level2Left, level3_2);
    addEdge(level2Right, level3_3);
    addEdge(level2Right, level3_4);
    
    // Set start and goal vertices
    startVertex = root;
    goalVertex = level3_3;  // Node with heuristic 0
    
    // Update UI
    drawGraph();
    updateInfo();
}

// Add a node to the graph
function addNode(x, y, heuristic) {
    const nodeId = nextNodeId++;
    graph[nodeId] = {
        x: x,
        y: y,
        heuristic: heuristic,
        neighbors: []
    };
    return nodeId;
}

// Add an edge between two nodes
function addEdge(node1, node2) {
    if (graph[node1] && graph[node2]) {
        graph[node1].neighbors.push(node2);
        graph[node2].neighbors.push(node1);
    }
}

// Initialize the graph
function initializeGraph() {
    setupCanvas();
    createDefaultGraph();
    drawGraph();
    updateInfo();
}

// Add event listeners
window.addEventListener('load', initializeGraph);
window.addEventListener('resize', () => {
    setupCanvas();
    drawGraph();
});

// Toggle Theory Tab
function toggleTheory() {
  const theoryContent = document.querySelector('.theory-content');
  theoryContent.style.display = theoryContent.style.display === 'block' ? 'none' : 'block';
}

// Mouse event handlers
graphCanvas.addEventListener('mousedown', (e) => {
    const rect = graphCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if clicked on existing node
    for (const nodeId in graph) {
        const node = graph[nodeId];
        const dx = mouseX - node.x;
        const dy = mouseY - node.y;
        if (dx * dx + dy * dy < 400) { // 20px radius squared
            if (e.ctrlKey) {
                // Delete node if Ctrl is pressed
                deleteNode(parseInt(nodeId));
                drawGraph();
                return;
            }
            // Left click to highlight/select node
            if (e.button === 0) {  // Left mouse button
                const clickedNodeId = parseInt(nodeId);
                if (selectedNode === null) {
                    // First node selection
                    selectedNode = clickedNodeId;
                } else if (selectedNode === clickedNodeId) {
                    // Deselect if clicking the same node
                    selectedNode = null;
                } else {
                    // Connect nodes if clicking a different node
                    if (!graph[selectedNode].neighbors.includes(clickedNodeId)) {
                        graph[selectedNode].neighbors.push(clickedNodeId);
                    }
                    selectedNode = null;
                }
                drawGraph();
            }
            isDragging = true;
            lastMouseX = mouseX;
            lastMouseY = mouseY;
            return;
        }
    }

    // Create new node if not clicking existing node
    if (!isDragging && !isAnimating) {
        const newNodeId = nextNodeId++;
        // Calculate heuristic based on distance to goal if goal exists
        let heuristic = Math.floor(Math.random() * 10);
        if (graph[goalVertex]) {
            const goalNode = graph[goalVertex];
            const dx = mouseX - goalNode.x;
            const dy = mouseY - goalNode.y;
            heuristic = Math.floor(Math.sqrt(dx * dx + dy * dy) / 50); // Scale down the distance
        }
        graph[newNodeId] = {
            neighbors: [],
            heuristic: heuristic,
            x: mouseX,
            y: mouseY
        };
        drawGraph();
    }
});

graphCanvas.addEventListener('mousemove', (e) => {
    if (isDragging && !isAnimating) {
        const rect = graphCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Update node position
        if (selectedNode !== null) {
            graph[selectedNode].x += mouseX - lastMouseX;
            graph[selectedNode].y += mouseY - lastMouseY;
            drawGraph();
        }
        
        lastMouseX = mouseX;
        lastMouseY = mouseY;
    }
});

graphCanvas.addEventListener('mouseup', () => {
    isDragging = false;
});

// Delete node function
function deleteNode(nodeId) {
    // Remove the node
    delete graph[nodeId];
    
    // Remove any edges pointing to this node
    for (const id in graph) {
        graph[id].neighbors = graph[id].neighbors.filter(n => n !== nodeId);
    }
    
    // Clear selection if deleted node was selected
    if (selectedNode === nodeId) {
        selectedNode = null;
    }
}

// Calculate heuristic (Manhattan distance to goal)
function calculateHeuristic(node, goalNode) {
    if (!node || !goalNode) return 0;
    const dx = Math.abs(node.x - goalNode.x);
    const dy = Math.abs(node.y - goalNode.y);
    return Math.floor(Math.sqrt(dx * dx + dy * dy) / 20); // Scale down for better visualization
}

// Update heuristic values for all nodes
function updateHeuristics() {
    const goalNode = graph[goalVertex];
    if (!goalNode) return;
    
    for (const vertex in graph) {
        graph[vertex].heuristic = calculateHeuristic(graph[vertex], goalNode);
    }
}

// Add node with heuristic
function addNode(x, y) {
    const nodeId = nextNodeId++;
    graph[nodeId] = {
        x,
        y,
        neighbors: [],
        heuristic: 0
    };
    updateHeuristics(); // Update heuristics when adding a node
    return nodeId;
}

// Update goal vertex and recalculate heuristics
goalVertexInput.addEventListener('change', () => {
    goalVertex = parseInt(goalVertexInput.value);
    updateHeuristics();
    updateInfo();
    drawGraph();
});

// Initialize default graph
function initializeDefaultGraph() {
    // Create default nodes with positions - adjusted for better centering
    const nodes = [
        { id: 0, x: 350, y: 80, h: 6 },    // Root node - moved up and centered
        { id: 1, x: 200, y: 200, h: 6 },   // Left child of root
        { id: 2, x: 500, y: 200, h: 3 },   // Right child of root
        { id: 3, x: 125, y: 320, h: 8 },   // Left child of node 1
        { id: 4, x: 275, y: 320, h: 4 },   // Right child of node 1
        { id: 5, x: 425, y: 320, h: 0 },   // Left child of node 2
        { id: 6, x: 575, y: 320, h: 10 }   // Right child of node 2
    ];

    // Create edges between nodes
    const edges = [
        { from: 0, to: 1 },
        { from: 0, to: 2 },
        { from: 1, to: 3 },
        { from: 1, to: 4 },
        { from: 2, to: 5 },
        { from: 2, to: 6 }
    ];

    this.nodes = nodes;
    this.edges = edges;
    this.draw();
}