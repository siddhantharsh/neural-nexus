// Initialize Raphael paper
let paper;
let nodes = {};
let edges = {};
let nodeCounter = 0;

// State variables
let visited = new Set();
let stack = [];
let currentVertex = null;
let currentDepth = 0;
let depthMap = new Map();
let isAutoPlaying = false;
let animationTimeout = null;
let isTraversalComplete = false;
let selectedNode = null;
let isConnecting = false;
let connectionStart = null;

// Node styles
const nodeStyles = {
    normal: {
        fill: '#1E293B',
        stroke: 'none',
        'font-size': '16px',
        'font-weight': 'bold',
        'font-family': 'Inter'
    },
    visited: {
        fill: '#B4C6FC',
        stroke: 'none'
    },
    current: {
        fill: '#60A5FA',
        stroke: 'none'
    }
};

// Edge styles
const edgeStyles = {
    normal: {
        stroke: '#94A3B8',
        'stroke-width': 2
    },
    path: {
        stroke: '#60A5FA',
        'stroke-width': 3
    }
};

// Initialize the visualization
function init() {
    paper = Raphael('draw_area');
    setupEventListeners();
    createDefaultGraph();
}

// Create default graph
function createDefaultGraph() {
    const defaultGraph = {
        0: { x: 400, y: 80, neighbors: [1, 2] },
        1: { x: 250, y: 200, neighbors: [3, 4] },
        2: { x: 550, y: 200, neighbors: [5, 6] },
        3: { x: 150, y: 320, neighbors: [] },
        4: { x: 350, y: 320, neighbors: [] },
        5: { x: 450, y: 320, neighbors: [] },
        6: { x: 650, y: 320, neighbors: [] }
    };

    // Create nodes
    for (const [id, data] of Object.entries(defaultGraph)) {
        createNode(data.x, data.y, id);
    }

    // Create edges
    for (const [id, data] of Object.entries(defaultGraph)) {
        for (const neighborId of data.neighbors) {
            createEdge(id, neighborId);
        }
    }
}

// Create a new node
function createNode(x, y, id = null) {
    const nodeId = id || nodeCounter++;
    const node = paper.circle(x, y, 25);
    const text = paper.text(x, y, nodeId.toString());
    
    node.attr(nodeStyles.normal);
    text.attr({
        fill: '#ffffff',
        'font-size': '16px',
        'font-weight': 'bold',
        'font-family': 'Inter'
    });

    nodes[nodeId] = {
        element: node,
        text: text,
        x: x,
        y: y,
        neighbors: []
    };

    // Make node draggable
    node.drag(
        function(dx, dy) {
            this.attr({ cx: this.data('x') + dx, cy: this.data('y') + dy });
            this.data('x', this.data('x') + dx);
            this.data('y', this.data('y') + dy);
            text.attr({ x: this.data('x'), y: this.data('y') });
            updateEdges(nodeId);
        },
        function() {
            this.data('x', this.attr('cx'));
            this.data('y', this.attr('cy'));
        }
    );

    return nodeId;
}

// Create an edge between two nodes
function createEdge(fromId, toId) {
    if (!nodes[fromId] || !nodes[toId]) return;
    
    const fromNode = nodes[fromId];
    const toNode = nodes[toId];
    
    const edge = paper.path([
        'M', fromNode.x, fromNode.y,
        'L', toNode.x, toNode.y
    ]).attr(edgeStyles.normal);
    
    edges[`${fromId}-${toId}`] = edge;
    
    // Update neighbors
    if (!fromNode.neighbors.includes(toId)) {
        fromNode.neighbors.push(toId);
    }
    if (!toNode.neighbors.includes(fromId)) {
        toNode.neighbors.push(fromId);
    }
}

// Update edges connected to a node
function updateEdges(nodeId) {
    const node = nodes[nodeId];
    for (const neighborId of node.neighbors) {
        const edgeId = `${nodeId}-${neighborId}`;
        const reverseEdgeId = `${neighborId}-${nodeId}`;
        
        if (edges[edgeId]) {
            edges[edgeId].attr({
                path: [
                    'M', node.x, node.y,
                    'L', nodes[neighborId].x, nodes[neighborId].y
                ]
            });
        }
        if (edges[reverseEdgeId]) {
            edges[reverseEdgeId].attr({
                path: [
                    'M', nodes[neighborId].x, nodes[neighborId].y,
                    'L', node.x, node.y
                ]
            });
        }
    }
}

// DFS step function
async function dfsStep() {
    if (isTraversalComplete || isAutoPlaying) return;

    if (currentVertex === null) {
        // Start DFS
        const startVertex = parseInt(document.getElementById('startVertex').value);
        if (!nodes[startVertex]) {
            updateObservation('Start vertex does not exist!');
            return;
        }
        
        currentVertex = startVertex;
        stack = [startVertex];
        visited.clear();
        depthMap.clear();
        depthMap.set(startVertex, 0);
        currentDepth = 0;
        isTraversalComplete = false;
        
        updateNodeStyle(currentVertex, 'current');
        updateStats();
        updateObservation(`Starting DFS from vertex ${startVertex}`);
        return;
    }

    if (stack.length === 0) {
        isTraversalComplete = true;
        updateObservation('DFS traversal complete!');
        return;
    }

    currentVertex = stack.pop();
    currentDepth = depthMap.get(currentVertex);
    const depthLimit = parseInt(document.getElementById('depthLimit').value);

    if (!visited.has(currentVertex)) {
        visited.add(currentVertex);
        updateNodeStyle(currentVertex, 'visited');
        
        if (currentDepth < depthLimit) {
            const unvisitedNeighbors = nodes[currentVertex].neighbors
                .filter(n => !visited.has(n))
                .reverse(); // Reverse to maintain DFS order
            
            for (const neighbor of unvisitedNeighbors) {
                if (!visited.has(neighbor)) {
                    stack.push(neighbor);
                    depthMap.set(neighbor, currentDepth + 1);
                }
            }
        }
    }

    updateNodeStyle(currentVertex, 'current');
    updateStats();
    updateObservation(`Visiting vertex ${currentVertex} at depth ${currentDepth}`);
}

// Update node style
function updateNodeStyle(nodeId, style) {
    const node = nodes[nodeId];
    if (!node) return;

    node.element.attr(nodeStyles[style]);
}

// Update statistics
function updateStats() {
    document.getElementById('frontier').textContent = JSON.stringify(stack);
    document.getElementById('currentNode').textContent = currentVertex;
    document.getElementById('currentDepth').textContent = currentDepth;
    document.getElementById('visitedCount').textContent = visited.size;
}

// Update observation text
function updateObservation(text) {
    document.getElementById('observation-text').textContent = text;
}

// Clear the graph
function clearGraph() {
    paper.clear();
    nodes = {};
    edges = {};
    nodeCounter = 0;
    visited.clear();
    stack = [];
    currentVertex = null;
    currentDepth = 0;
    depthMap.clear();
    isTraversalComplete = false;
    updateStats();
    updateObservation('Graph cleared');
}

// Setup event listeners
function setupEventListeners() {
    // Algorithm controls
    document.getElementById('startDFS').addEventListener('click', () => {
        clearGraph();
        createDefaultGraph();
        currentVertex = null;
        dfsStep();
    });

    document.getElementById('nextStep').addEventListener('click', dfsStep);

    document.getElementById('autoPlay').addEventListener('click', function() {
        isAutoPlaying = !isAutoPlaying;
        this.textContent = isAutoPlaying ? 'Stop' : 'Autoplay';
        if (isAutoPlaying) {
            function autoStep() {
                if (isAutoPlaying && !isTraversalComplete) {
                    dfsStep();
                    setTimeout(autoStep, 1000);
                }
            }
            autoStep();
        }
    });

    document.getElementById('clear').addEventListener('click', clearGraph);

    // Tool buttons
    document.getElementById('addNode').addEventListener('click', function() {
        this.classList.toggle('active');
        if (this.classList.contains('active')) {
            document.getElementById('connectNodes').classList.remove('active');
            document.getElementById('deleteNode').classList.remove('active');
            isConnecting = false;
            selectedNode = null;
        }
    });

    document.getElementById('connectNodes').addEventListener('click', function() {
        this.classList.toggle('active');
        if (this.classList.contains('active')) {
            document.getElementById('addNode').classList.remove('active');
            document.getElementById('deleteNode').classList.remove('active');
            isConnecting = true;
            selectedNode = null;
        }
    });

    document.getElementById('deleteNode').addEventListener('click', function() {
        this.classList.toggle('active');
        if (this.classList.contains('active')) {
            document.getElementById('addNode').classList.remove('active');
            document.getElementById('connectNodes').classList.remove('active');
            isConnecting = false;
            selectedNode = null;
        }
    });

    // Canvas click handler
    paper.canvas.addEventListener('click', function(e) {
        const rect = paper.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (document.getElementById('addNode').classList.contains('active')) {
            createNode(x, y);
        } else if (document.getElementById('connectNodes').classList.contains('active')) {
            const clickedNode = findNodeAtPosition(x, y);
            if (clickedNode !== null) {
                if (selectedNode === null) {
                    selectedNode = clickedNode;
                } else if (selectedNode !== clickedNode) {
                    createEdge(selectedNode, clickedNode);
                    selectedNode = null;
                }
            }
        } else if (document.getElementById('deleteNode').classList.contains('active')) {
            const nodeToDelete = findNodeAtPosition(x, y);
            if (nodeToDelete !== null) {
                deleteNode(nodeToDelete);
            }
        }
    });
}

// Find node at position
function findNodeAtPosition(x, y) {
    for (const [id, node] of Object.entries(nodes)) {
        const dx = node.x - x;
        const dy = node.y - y;
        if (Math.sqrt(dx * dx + dy * dy) <= 25) {
            return id;
        }
    }
    return null;
}

// Delete a node
function deleteNode(nodeId) {
    const node = nodes[nodeId];
    if (!node) return;

    // Remove edges
    for (const neighborId of node.neighbors) {
        const edgeId = `${nodeId}-${neighborId}`;
        const reverseEdgeId = `${neighborId}-${nodeId}`;
        
        if (edges[edgeId]) {
            edges[edgeId].remove();
            delete edges[edgeId];
        }
        if (edges[reverseEdgeId]) {
            edges[reverseEdgeId].remove();
            delete edges[reverseEdgeId];
        }
        
        // Update neighbor's neighbors list
        const neighbor = nodes[neighborId];
        neighbor.neighbors = neighbor.neighbors.filter(n => n !== nodeId);
    }

    // Remove node
    node.element.remove();
    node.text.remove();
    delete nodes[nodeId];
}

// Initialize when the page loads
window.addEventListener('load', init); 