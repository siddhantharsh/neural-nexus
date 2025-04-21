const graphCanvas = document.getElementById('graphCanvas');
const ctx = graphCanvas.getContext('2d');
const startDFSButton = document.getElementById('startDFS');
const nextStepButton = document.getElementById('nextStep');
const autoPlayButton = document.getElementById('autoPlay');
const clearButton = document.getElementById('clear');
const goalVector = document.getElementById('goalVector');
const frontier = document.getElementById('frontier');
const visiting = document.getElementById('visiting');
const toVisit = document.getElementById('toVisit');
const observation = document.getElementById('observation');
const reason = document.getElementById('reason');

// Add Clear Visited button functionality
const clearVisitedButton = document.getElementById('clearVisited');

// Add depth limit input reference
const depthLimitInput = document.getElementById('depthLimit');

// Graph representation with adjusted coordinates
let graph = {
    0: { x: 400, y: 80, neighbors: [1, 2] },
    1: { x: 250, y: 200, neighbors: [3, 4] },
    2: { x: 550, y: 200, neighbors: [5, 6] },
    3: { x: 150, y: 320, neighbors: [] },
    4: { x: 350, y: 320, neighbors: [] },
    5: { x: 450, y: 320, neighbors: [] },
    6: { x: 650, y: 320, neighbors: [] }
};
let nextNodeId = 7;

// State variables
let startVertex = 0;
let depthLimit = 3;  // Default depth limit
let visited = new Set();
let stack = [];
let currentVertex = null;
let currentDepth = 0;  // Track current depth
let depthMap = new Map();  // Track depth of each node
let isAutoPlaying = false;
let animationFrameId = null;
let isTraversalComplete = false;
let currentPath = [];

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
    
    // Center the graph
    const centerX = graphCanvas.width / 2;
    const offsetX = centerX - 400;  // 400 is the center x-coordinate in our graph
    
    // Adjust all node positions based on canvas center
    for (const nodeId in graph) {
        graph[nodeId].x += offsetX;
    }
    
    // Set canvas background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, graphCanvas.width, graphCanvas.height);
    
    // Draw initial graph
    drawGraph();
}

// Draw the graph
function drawGraph() {
    ctx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, graphCanvas.width, graphCanvas.height);

    // Draw edges
    ctx.strokeStyle = '#94A3B8';  // Lighter gray color for edges
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
        ctx.fillStyle = visited.has(parseInt(vertex)) ? '#B4C6FC' : '#1E293B';  // Light blue for visited, dark navy for unvisited
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);  // Back to original size
        ctx.fill();

        // Highlight current vertex
        if (parseInt(vertex) === currentVertex) {
            ctx.strokeStyle = '#60A5FA';  // Bright blue highlight
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, 30, 0, Math.PI * 2);  // Back to original highlight size
            ctx.stroke();
        }

        // Draw vertex label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Inter';  // Back to original font size
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(vertex, x, y);
    }

    // Highlight selected node for manual connections
    if (selectedNode !== null && graph[selectedNode]) {
        const { x, y } = graph[selectedNode];
        ctx.strokeStyle = '#60A5FA';  // Bright blue highlight
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, Math.PI * 2);  // Back to original highlight size
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
                
                ctx.strokeStyle = '#60A5FA';  // Bright blue highlight
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, y, 30, 0, Math.PI * 2);  // Slightly larger highlight circle
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
    frontier.textContent = JSON.stringify(stack);
    visiting.textContent = currentVertex !== null ? `${currentVertex} (depth: ${depthMap.get(currentVertex)})` : 'undefined';
    document.getElementById('currentPath').textContent = currentPath.join(' -> ') || 'none';
}

// Update depth limit when input changes
depthLimitInput.addEventListener('input', function() {
    depthLimit = parseInt(this.value);
});

// Depth First Search step
async function dfsStep() {
    if (isTraversalComplete || isAnimating) {
        if (isAutoPlaying) {
            clearInterval(autoPlayInterval);
            isAutoPlaying = false;
        }
        return;
    }

    // If this is the first step, initialize with start node
    if (currentVertex === null) {
        currentVertex = startVertex;
        stack.push(currentVertex);
        visited.add(currentVertex);
        currentPath = [currentVertex];
        depthMap.clear();
        depthMap.set(currentVertex, 0);  // Root node at depth 0
        currentDepth = 0;
        updateInfo();
        drawGraph();
        return;
    }

    // Get unvisited neighbors of current vertex
    const neighbors = graph[currentVertex].neighbors.filter(n => !visited.has(n));
    
    // Sort neighbors by x-coordinate to ensure left-to-right traversal
    neighbors.sort((a, b) => graph[a].x - graph[b].x);

    // Get current node's depth
    currentDepth = depthMap.get(currentVertex);

    if (neighbors.length > 0 && currentDepth < depthLimit) {
        // If there are unvisited neighbors and we haven't reached depth limit
        const nextVertex = neighbors[0];
        stack.push(currentVertex);
        
        // Animate transition to next vertex
        const fromNode = graph[currentVertex];
        const toNode = graph[nextVertex];
        await animateTraversal(fromNode, toNode);

        // Update current vertex and mark as visited
        currentVertex = nextVertex;
        visited.add(currentVertex);
        currentPath.push(currentVertex);
        depthMap.set(currentVertex, currentDepth + 1);  // Set depth for new node

    } else {
        // If no unvisited neighbors or at depth limit, backtrack
        if (stack.length === 0) {
            isTraversalComplete = true;
            updateInfo();
            drawGraph();
            return;
        }

        // Pop from stack to backtrack
        const parentVertex = stack.pop();
        
        // Animate transition back to parent
        const fromNode = graph[currentVertex];
        const toNode = graph[parentVertex];
        await animateTraversal(fromNode, toNode);

        // Update current vertex
        currentVertex = parentVertex;
        currentPath.push(currentVertex);
        currentDepth = depthMap.get(currentVertex);  // Update current depth
    }

    updateInfo();
    drawGraph();
}

// Event listeners
startDFSButton.addEventListener('click', () => {
    // Reset only traversal-related variables
    visited = new Set();
    stack = [];
    currentVertex = null;
    currentPath = [];
    isTraversalComplete = false;
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
    
    // Start DFS
    dfsStep();
});

nextStepButton.addEventListener('click', () => {
    if (!isAutoPlaying) {
        dfsStep();
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
      if (!isTraversalComplete) {
        dfsStep();
      } else {
        clearInterval(autoPlayInterval);
        isAutoPlaying = false;
      }
    }, 1500); // Run every 1.5 seconds
  }
});

// Update the clear function to use the new coordinates
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
    stack = [];
    currentVertex = null;
    isTraversalComplete = false;
    selectedNode = null;
    isDragging = false;
    isAnimating = false;
    
    // Reset the graph with new coordinates
    graph = {
        0: { x: 400, y: 80, neighbors: [1, 2] },
        1: { x: 250, y: 200, neighbors: [3, 4] },
        2: { x: 550, y: 200, neighbors: [5, 6] },
        3: { x: 150, y: 320, neighbors: [] },
        4: { x: 350, y: 320, neighbors: [] },
        5: { x: 450, y: 320, neighbors: [] },
        6: { x: 650, y: 320, neighbors: [] }
    };
    nextNodeId = 7;
    
    // Center the graph
    const centerX = graphCanvas.width / 2;
    const offsetX = centerX - 400;  // 400 is the center x-coordinate in our graph
    
    // Adjust all node positions based on canvas center
    for (const nodeId in graph) {
        graph[nodeId].x += offsetX;
    }
    
    // Update UI
    updateInfo();
    drawGraph();

    depthMap.clear();
    currentDepth = 0;
}

// Update clear button event listener
clearButton.addEventListener('click', clearAll);

// Add Clear Visited button functionality
clearVisitedButton.addEventListener('click', () => {
    // Reset only traversal-related variables
    visited = new Set();
    stack = [];
    currentVertex = null;
    currentPath = [];
    isTraversalComplete = false;
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

// Mouse event handlers
function setupEventListeners() {
    // Node creation and interaction
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
                    deleteNode(parseInt(nodeId));
                    drawGraph();
                    return;
                }
                if (e.button === 0) {
                    const clickedNodeId = parseInt(nodeId);
                    if (selectedNode === null) {
                        selectedNode = clickedNodeId;
                    } else if (selectedNode === clickedNodeId) {
                        selectedNode = null;
                    } else {
                        if (!graph[selectedNode].neighbors.includes(clickedNodeId)) {
                            graph[selectedNode].neighbors.push(clickedNodeId);
                            graph[clickedNodeId].neighbors.push(selectedNode);
                        }
                        selectedNode = null;
                    }
                    isDragging = true;
                    lastMouseX = mouseX;
                    lastMouseY = mouseY;
                    drawGraph();
                    return;
                }
            }
        }

        // Create new node if clicked on empty space
        if (e.button === 0) {
            const newNodeId = nextNodeId++;
            graph[newNodeId] = {
                neighbors: [],
                x: mouseX,
                y: mouseY
            };
            console.log('Created new node:', newNodeId); // Debug log
            drawGraph();
        }
    });

    // Node dragging
    graphCanvas.addEventListener('mousemove', (e) => {
        if (isDragging && selectedNode !== null) {
            const rect = graphCanvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            graph[selectedNode].x += mouseX - lastMouseX;
            graph[selectedNode].y += mouseY - lastMouseY;
            
            lastMouseX = mouseX;
            lastMouseY = mouseY;
            drawGraph();
        }
    });

    graphCanvas.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

// Initialize
setupCanvas();
setupEventListeners();
window.addEventListener('resize', setupCanvas);

// Toggle Theory Tab
function toggleTheory() {
  const theoryContent = document.querySelector('.theory-content');
  theoryContent.style.display = theoryContent.style.display === 'block' ? 'none' : 'block';
}

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