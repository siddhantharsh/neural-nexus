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

// Graph representation
let graph = {};
let nextNodeId = 0;

// State variables
let startVertex = 0;
let goalVertex = 5;
let visited = new Set();
let stack = [];
let currentVertex = null;
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

class Graph {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.nodes = [];
        this.edges = [];
        this.nodeRadius = 25;
        this.selectedNode = null;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.initializeDefaultGraph();
        this.setupEventListeners();
    }

    initializeDefaultGraph() {
        // Create default nodes with positions
        const nodes = [
            { id: 0, x: 400, y: 100, h: 15 },  // Root node
            { id: 1, x: 250, y: 200, h: 16 },  // Left child of root
            { id: 2, x: 550, y: 200, h: 9 },   // Right child of root
            { id: 3, x: 175, y: 300, h: 20 },  // Left child of node 1
            { id: 4, x: 325, y: 300, h: 19 },  // Right child of node 1
            { id: 5, x: 475, y: 300, h: 0 },   // Left child of node 2
            { id: 6, x: 625, y: 300, h: 10 }   // Right child of node 2
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

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    handleMouseDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this.nodes.forEach(node => {
            const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
            if (distance < this.nodeRadius) {
                this.selectedNode = node;
                this.isDragging = true;
                this.dragStart = { x, y };
            }
        });
    }

    handleMouseMove(event) {
        if (!this.isDragging || !this.selectedNode) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const dx = x - this.dragStart.x;
        const dy = y - this.dragStart.y;

        this.selectedNode.x += dx;
        this.selectedNode.y += dy;

        this.dragStart = { x, y };
        this.draw();
    }

    handleMouseUp() {
        this.isDragging = false;
        this.selectedNode = null;
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw edges
        ctx.beginPath();
        ctx.strokeStyle = '#7795b5';
        ctx.lineWidth = 2;
        this.edges.forEach(edge => {
            const fromNode = this.nodes.find(n => n.id === edge.from);
            const toNode = this.nodes.find(n => n.id === edge.to);
            ctx.moveTo(fromNode.x, fromNode.y);
            ctx.lineTo(toNode.x, toNode.y);
        });
        ctx.stroke();

        // Draw nodes
        this.nodes.forEach(node => {
            // Node circle
            ctx.beginPath();
            ctx.fillStyle = '#C5D3E3';
            ctx.strokeStyle = '#7795b5';
            ctx.lineWidth = 3;
            ctx.arc(node.x, node.y, this.nodeRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Node text
            ctx.fillStyle = '#2d3748';
            ctx.font = '16px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.id.toString(), node.x, node.y);

            // Heuristic value
            ctx.font = '14px Inter';
            ctx.fillStyle = '#2d3748';
            ctx.fillText(`h:${node.h}`, node.x, node.y + this.nodeRadius + 20);
        });
    }
}

// Initialize the graph when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('graphCanvas');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const graph = new Graph(canvas);

    // Handle window resize
    window.addEventListener('resize', () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        graph.draw();
    });
});

// Initial canvas setup
function setupCanvas() {
    // Set canvas size based on container
    const container = graphCanvas.parentElement;
    graphCanvas.width = container.clientWidth - 30;  // Subtract padding
    graphCanvas.height = container.clientHeight - 30;
    
    // Set up initial scale
    ctx.scale(1, 1);
    
    // Set canvas background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, graphCanvas.width, graphCanvas.height);
    
    // Draw initial empty graph
    drawGraph();
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
            ctx.strokeStyle = '#ffffff';  // White highlight for current node
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
    }

    // Highlight selected node for manual connections
    if (selectedNode !== null && graph[selectedNode]) {
        const { x, y } = graph[selectedNode];
        ctx.strokeStyle = '#ffffff';  // White highlight for selected node
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
                
                ctx.strokeStyle = '#ffffff';  // White animation circle
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
    frontier.textContent = JSON.stringify(stack);
    visiting.textContent = currentVertex !== null ? currentVertex : 'undefined';
    document.getElementById('currentPath').textContent = currentPath.join(' -> ') || 'none';
}

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
        updateInfo();
        drawGraph();
        return;
    }

    // Get unvisited neighbors of current vertex
    const neighbors = graph[currentVertex].neighbors.filter(n => !visited.has(n));
    
    // Sort neighbors by x-coordinate to ensure left-to-right traversal
    neighbors.sort((a, b) => graph[a].x - graph[b].x);

    if (neighbors.length > 0) {
        // If there are unvisited neighbors, visit the leftmost one
        const nextVertex = neighbors[0];
        stack.push(currentVertex); // Push current vertex for backtracking
        
        // Animate transition to next vertex
        const fromNode = graph[currentVertex];
        const toNode = graph[nextVertex];
        await animateTraversal(fromNode, toNode);

        // Update current vertex and mark as visited
        currentVertex = nextVertex;
        visited.add(currentVertex);
        currentPath.push(currentVertex);

        // Check if we've visited all nodes and are at the rightmost leaf
        const allNodesVisited = Object.keys(graph).every(nodeId => visited.has(parseInt(nodeId)));
        const isRightmostLeaf = currentVertex === parseInt(Object.keys(graph).reduce((rightmost, nodeId) => {
            return graph[nodeId].x > graph[rightmost].x ? nodeId : rightmost;
        }));

        if (allNodesVisited && isRightmostLeaf) {
            isTraversalComplete = true;
        }
    } else {
        // If no unvisited neighbors, backtrack
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
    stack = [];
    currentVertex = null;
    isTraversalComplete = false;
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