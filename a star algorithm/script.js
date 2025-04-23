const graphCanvas = document.getElementById('graphCanvas');
const ctx = graphCanvas.getContext('2d');
const startAStarButton = document.getElementById('startAStar');
const nextStepButton = document.getElementById('nextStep');
const autoPlayButton = document.getElementById('autoPlay');
const clearButton = document.getElementById('clear');
const clearVisitedButton = document.getElementById('clearVisited');

// Graph representation
let graph = {};
let nextNodeId = 0;

// State variables
let startVertex = 0;
let goalVertex = 5;
let visited = new Set();
let openSet = new Set();
let closedSet = new Set();
let gScore = {};
let fScore = {};
let cameFrom = {};
let currentVertex = null;
let isAutoPlaying = false;
let autoPlayInterval = null;
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
    const container = graphCanvas.parentElement;
    graphCanvas.width = container.clientWidth - 30;
    graphCanvas.height = container.clientHeight - 30;
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
                // Highlight path if it's part of the current path
                if (cameFrom[neighbor] === parseInt(vertex) || cameFrom[parseInt(vertex)] === neighbor) {
                    ctx.strokeStyle = '#4A90E2';
                    ctx.lineWidth = 3;
                } else {
                    ctx.strokeStyle = '#666';
                    ctx.lineWidth = 2;
                }
                ctx.stroke();
            }
        }
    }

    // Draw nodes
    for (const vertex in graph) {
        const { x, y } = graph[vertex];
        
        // Node circle
        if (parseInt(vertex) === goalVertex) {
            ctx.fillStyle = '#28a745'; // Green for goal
        } else if (parseInt(vertex) === startVertex) {
            ctx.fillStyle = '#007bff'; // Blue for start
        } else if (closedSet.has(parseInt(vertex))) {
            ctx.fillStyle = '#97a7c8'; // Grey for visited
        } else if (openSet.has(parseInt(vertex))) {
            ctx.fillStyle = '#ffc107'; // Yellow for open
        } else {
            ctx.fillStyle = '#1a202c'; // Default color
        }
        
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
        ctx.font = 'bold 14px Inter';
        ctx.fillText(`g:${gScore[vertex] || 0}`, x - 30, y - 20);
        ctx.fillText(`h:${graph[vertex].heuristic}`, x + 30, y - 20);
        ctx.fillText(`f:${(gScore[vertex] || 0) + graph[vertex].heuristic}`, x, y + 30);
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
    // Update Information Box
    document.getElementById('goalVector').textContent = goalVertex;
    document.getElementById('openSet').textContent = Array.from(openSet).join(', ') || 'empty';
    document.getElementById('closedSet').textContent = Array.from(closedSet).join(', ') || 'empty';
    document.getElementById('currentNode').textContent = currentVertex !== null ? currentVertex : 'undefined';

    // Find next node (node in openSet with lowest fScore)
    let nextNode = null;
    let lowestFScore = Infinity;
    
    // Only look at unvisited neighbors of current vertex and nodes in open set
    const candidates = new Set([...openSet]);
    if (currentVertex !== null) {
        const unvisitedNeighbors = graph[currentVertex].neighbors.filter(n => !closedSet.has(n));
        unvisitedNeighbors.forEach(n => candidates.add(n));
    }

    for (const node of candidates) {
        const score = fScore[node] || Infinity;
        if (score < lowestFScore) {
            lowestFScore = score;
            nextNode = node;
        }
    }

    document.getElementById('nextNode').textContent = nextNode !== null ? nextNode : 'undefined';

    // Update Observation Box
    const observationDiv = document.getElementById('observation');
    
    if (currentVertex === null) {
        observationDiv.innerHTML = `
            <h2>Observation</h2>
            <p><strong>Currently visitable nodes:</strong> undefined</p>
            <p><strong>Path Cost g(n):</strong> undefined</p>
            <p><strong>Heuristic Cost h(n):</strong> undefined</p>
            <p><strong>Total Cost f(n):</strong> undefined</p>
            <p><strong>Parent Node:</strong> undefined</p>
        `;
        return;
    }

    // Get unvisited neighbors of current vertex
    const unvisitedNeighbors = graph[currentVertex].neighbors.filter(n => !closedSet.has(n));
    
    // Calculate costs for each unvisited neighbor
    const costs = unvisitedNeighbors.map(neighbor => {
        const g = gScore[neighbor] || 0;
        const h = graph[neighbor].heuristic;
        const f = g + h;
        return { neighbor, g, h, f };
    });

    // Sort by f-score to show best options first
    costs.sort((a, b) => a.f - b.f);

    // Format the costs for display
    const pathCosts = costs.map(c => `${c.neighbor}(${c.g})`).join(', ');
    const heuristicCosts = costs.map(c => `${c.neighbor}(${c.h})`).join(', ');
    const totalCosts = costs.map(c => `${c.neighbor}(${c.f})`).join(', ');

    observationDiv.innerHTML = `
        <h2>Observation</h2>
        <p><strong>Currently visitable nodes:</strong> ${unvisitedNeighbors.join(', ') || 'none'}</p>
        <p><strong>Path Cost g(n):</strong> ${pathCosts || 'none'}</p>
        <p><strong>Heuristic Cost h(n):</strong> ${heuristicCosts || 'none'}</p>
        <p><strong>Total Cost f(n):</strong> ${totalCosts || 'none'}</p>
        <p><strong>Parent Node:</strong> ${cameFrom[currentVertex] !== undefined ? cameFrom[currentVertex] : 'none'}</p>
        ${isGoalReached ? '<p><strong>Goal Reached!</strong></p>' : 
        costs.length > 0 ? `<p><strong>Best Option:</strong> Node ${costs[0].neighbor} (f=${costs[0].f})</p>` : ''}
    `;
}

// Get edge cost between two nodes
function getEdgeCost(node1, node2) {
    const dx = graph[node1].x - graph[node2].x;
    const dy = graph[node1].y - graph[node2].y;
    // Scale down the edge cost but keep it higher than heuristic
    return Math.floor(Math.sqrt(dx * dx + dy * dy) / 30);
}

// A* Search step
async function aStarStep() {
    if (isGoalReached || isAnimating) {
        if (isAutoPlaying) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
            isAutoPlaying = false;
        }
        return;
    }

    // If this is the first step, ensure start node is properly initialized
    if (currentVertex === null) {
        currentVertex = startVertex;
        openSet.add(currentVertex);
        fScore[startVertex] = gScore[startVertex] + graph[startVertex].heuristic;
        updateInfo();
        drawGraph();
        return;
    }

    // Get all unvisited neighbors of current vertex
    const unvisitedNeighbors = graph[currentVertex].neighbors.filter(n => !closedSet.has(n));
    
    // First, check if goal is directly connected
    if (unvisitedNeighbors.includes(goalVertex)) {
        // Move directly to goal if it's a neighbor
        await animateTraversal(graph[currentVertex], graph[goalVertex]);
        closedSet.add(currentVertex);
        openSet.delete(currentVertex);
        currentVertex = goalVertex;
        isGoalReached = true;
        updateInfo();
        drawGraph();
        return;
    }

    // Calculate scores for all unvisited neighbors
    for (const neighbor of unvisitedNeighbors) {
        const tentativeGScore = gScore[currentVertex] + getEdgeCost(currentVertex, neighbor);
        
        if (!gScore[neighbor] || tentativeGScore < gScore[neighbor]) {
            cameFrom[neighbor] = currentVertex;
            gScore[neighbor] = tentativeGScore;
            fScore[neighbor] = tentativeGScore + graph[neighbor].heuristic;
            if (!openSet.has(neighbor)) {
                openSet.add(neighbor);
            }
        }
    }

    // Move current vertex to closed set
    closedSet.add(currentVertex);
    openSet.delete(currentVertex);

    // Find the next node with lowest f-score from open set
    let lowestF = Infinity;
    let nextNode = null;
    for (const node of openSet) {
        if (fScore[node] < lowestF) {
            lowestF = fScore[node];
            nextNode = node;
        }
    }

    if (nextNode !== null) {
        await animateTraversal(graph[currentVertex], graph[nextNode]);
        currentVertex = nextNode;
    }

    updateInfo();
    drawGraph();
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
                        graph[clickedNodeId].neighbors.push(selectedNode);
                        // Update g-scores for the new connection
                        updateGScores();
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
            heuristic = Math.floor(Math.sqrt(dx * dx + dy * dy) / 60);
        }
        graph[newNodeId] = {
            neighbors: [],
            heuristic: heuristic,
            x: mouseX,
            y: mouseY
        };
        // Calculate initial g-score based on distance from start
        if (graph[startVertex]) {
            const startNode = graph[startVertex];
            const dx = mouseX - startNode.x;
            const dy = mouseY - startNode.y;
            gScore[newNodeId] = Math.floor(Math.sqrt(dx * dx + dy * dy) / 30);
        } else {
            gScore[newNodeId] = 0;
        }
        // Calculate f-score
        fScore[newNodeId] = gScore[newNodeId] + heuristic;
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

// Reset algorithm state
function resetAlgorithm() {
    visited = new Set();
    openSet = new Set();
    closedSet = new Set();
    cameFrom = {};
    currentVertex = null;
    isGoalReached = false;
    isAutoPlaying = false;
    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
    }
    startVertex = parseInt(document.getElementById('startVertex').value);
    goalVertex = parseInt(document.getElementById('goalVertex').value);
}

// Update g-scores for all nodes based on current connections
function updateGScores() {
    // Reset g-scores
    gScore = {};
    gScore[startVertex] = 0;
    
    // Use a breadth-first approach to update g-scores from start vertex
    const queue = [startVertex];
    const visited = new Set([startVertex]);
    
    while (queue.length > 0) {
        const current = queue.shift();
        const neighbors = graph[current].neighbors;
        
        for (const neighbor of neighbors) {
            const tentativeGScore = gScore[current] + getEdgeCost(current, neighbor);
            if (!gScore[neighbor] || tentativeGScore < gScore[neighbor]) {
                gScore[neighbor] = tentativeGScore;
                fScore[neighbor] = tentativeGScore + graph[neighbor].heuristic;
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }
    }
}

// Clear visited nodes
function clearVisited() {
    visited = new Set();
    openSet = new Set();
    closedSet = new Set();
    cameFrom = {};
    currentVertex = null;
    isGoalReached = false;
    isAutoPlaying = false;
    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
    }
    // Recalculate g-scores and f-scores
    updateGScores();
    drawGraph();
    updateInfo();
}

// Clear everything
function clearAll() {
    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
    }
    graph = {};
    nextNodeId = 0;
    resetAlgorithm();
    drawGraph();
    updateInfo();
}

// Initialize default graph
function initializeDefaultGraph() {
    // Clear any existing graph
    graph = {};
    nextNodeId = 0;

    // Add nodes with positions and calculated heuristics
    const positions = [
        { x: 200, y: 100 }, // Node 0 (start)
        { x: 400, y: 100 }, // Node 1
        { x: 200, y: 300 }, // Node 2
        { x: 400, y: 300 }, // Node 3
        { x: 300, y: 200 }, // Node 4
        { x: 500, y: 200 }  // Node 5 (goal)
    ];

    // Add nodes
    positions.forEach((pos, index) => {
        const nodeId = addNode(pos.x, pos.y, 0);
        // Set initial g-value as scaled distance from start node
        const dx = pos.x - positions[0].x;
        const dy = pos.y - positions[0].y;
        const distanceFromStart = Math.floor(Math.sqrt(dx * dx + dy * dy) / 30); // Higher scaling for g-values
        gScore[nodeId] = index === 0 ? 0 : distanceFromStart;
    });

    // Add edges
    addEdge(0, 1);
    addEdge(0, 2);
    addEdge(1, 3);
    addEdge(1, 4);
    addEdge(2, 4);
    addEdge(3, 5);
    addEdge(4, 5);

    // Calculate heuristics based on goal position with lower scaling
    for (const nodeId in graph) {
        if (parseInt(nodeId) !== goalVertex) {
            const node = graph[nodeId];
            const dx = node.x - graph[goalVertex].x;
            const dy = node.y - graph[goalVertex].y;
            node.heuristic = Math.floor(Math.sqrt(dx * dx + dy * dy) / 60); // Lower scaling for h-values
        }
    }

    // Initialize f-scores
    for (const nodeId in graph) {
        const node = parseInt(nodeId);
        fScore[node] = gScore[node] + graph[node].heuristic;
    }
}

// Add node to graph
function addNode(x, y, heuristic) {
    const nodeId = nextNodeId++;
    // Calculate heuristic based on distance to goal if goal exists
    if (nodeId === goalVertex || !graph[goalVertex]) {
        graph[nodeId] = {
            x,
            y,
            heuristic,
            neighbors: []
        };
    } else {
        const goalNode = graph[goalVertex];
        const dx = x - goalNode.x;
        const dy = y - goalNode.y;
        const calculatedHeuristic = Math.floor(Math.sqrt(dx * dx + dy * dy) / 60); // Lower scaling for h-values
        graph[nodeId] = {
            x,
            y,
            heuristic: calculatedHeuristic,
            neighbors: []
        };
    }
    return nodeId;
}

// Add edge between nodes
function addEdge(node1, node2) {
    if (graph[node1] && graph[node2]) {
        graph[node1].neighbors.push(node2);
        graph[node2].neighbors.push(node1);
    }
}

// Initialize the application
function initialize() {
    setupCanvas();
    initializeDefaultGraph();
    drawGraph();
    updateInfo();

    // Add event listeners for buttons
    startAStarButton.addEventListener('click', () => {
        resetAlgorithm();
        // Don't reset g-scores, just add start vertex to open set
        openSet.add(startVertex);
        // Only initialize f-score for start vertex
        fScore[startVertex] = gScore[startVertex] + graph[startVertex].heuristic;
        currentVertex = startVertex;
        updateInfo();
        drawGraph();
    });

    nextStepButton.addEventListener('click', () => {
        if (!isAutoPlaying) {
            aStarStep();
        }
    });

    autoPlayButton.addEventListener('click', () => {
        isAutoPlaying = !isAutoPlaying;
        if (isAutoPlaying) {
            autoPlayInterval = setInterval(() => {
                if (!isGoalReached && openSet.size > 0) {
                    aStarStep();
                } else {
                    isAutoPlaying = false;
                    clearInterval(autoPlayInterval);
                    autoPlayInterval = null;
                }
            }, 1000);
        } else {
            if (autoPlayInterval) {
                clearInterval(autoPlayInterval);
                autoPlayInterval = null;
            }
        }
    });

    clearButton.addEventListener('click', clearAll);
    clearVisitedButton.addEventListener('click', clearVisited);
}

// Start the application
initialize(); 