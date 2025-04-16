class Node {
    constructor(value = null, depth, isMax = true) {
        this.value = value;
        this.depth = depth;
        this.isMax = isMax;
        this.children = [];
        this.alpha = -Infinity;
        this.beta = Infinity;
        this.pruned = false;
        this.x = 0;
        this.y = 0;
        this.radius = 25;
        this.evaluated = false;
        this.parent = null;
    }

    setPruned() {
        this.pruned = true;
        for (const child of this.children) {
            child.setPruned();
        }
    }

    minimax() {
        if (this.step === 0) {
            this.childSearchDone = false;
            this.currentChildSearch = 0;
            if (this.children.length === 0) {
                if (this.parent !== null) {
                    this.parent.return = this.value;
                }
                if (this.parent === null) {
                    return this.parent;
                }
                return this.parent.minimax();
            }
            if (this.isMax) {
                this.value = -Infinity;
            } else {
                this.value = Infinity;
            }
            this.step += 1;
        }
        if (this.step === 1) {
            if (this.currentChildSearch === this.children.length) {
                if (this.parent !== null) {
                    this.parent.return = this.value;
                }
                if (this.parent === null) {
                    return this.parent;
                }
                return this.parent.minimax();
            }
            if (this.childSearchDone) {
                for (let i = this.currentChildSearch; i < this.children.length; i++) {
                    this.children[i].setPruned();
                }
                this.currentChildSearch = this.children.length;
                return this;
            }
            const child = this.children[this.currentChildSearch];
            child.alpha = this.alpha;
            child.beta = this.beta;
            this.step += 1;
            return child;
        } else if (this.step === 2) {
            const childValue = this.return;
            if (this.isMax) {
                this.value = Math.max(this.value, childValue);
                this.alpha = Math.max(this.alpha, childValue);
            } else {
                this.value = Math.min(this.value, childValue);
                this.beta = Math.min(this.beta, childValue);
            }
            if (this.beta <= this.alpha) {
                this.childSearchDone = true;
            }
            this.currentChildSearch += 1;
            this.step -= 1;
            return this;
        }
    }
}

class AlphaBetaTree {
    constructor(depth, branchingFactor, canvasWidth, canvasHeight) {
        this.depth = depth;
        this.branchingFactor = branchingFactor;
        this.root = null;
        this.selectedNode = null;
        this.currentNode = null;
        this.pruneCount = 0;
        this.nodeSpacing = 60;
        this.levelHeight = 80;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.isAnimating = false;
        this.animationStartTime = null;
        this.animationDuration = 1000;
        this.animationStartX = null;
        this.animationStartY = null;
        this.animationEndX = null;
        this.animationEndY = null;
    }

    generateTree() {
        const generateChildren = (node, depth) => {
            if (depth >= this.depth) {
                node.value = Math.floor(Math.random() * 20) - 10; // Random value between -10 and 10
                return;
            }

            for (let i = 0; i < this.branchingFactor; i++) {
                const child = new Node(null, depth + 1, !node.isMax);
                child.parent = node;
                node.children.push(child);
                generateChildren(child, depth + 1);
            }
        };

        this.root = new Node(null, 0, true);
        generateChildren(this.root, 0);
        this.calculateNodePositions();
    }

    addChild(node) {
        if (!node) return;
        node.value = null;
        const child = new Node(null, node.depth + 1, !node.isMax);
        child.parent = node;
        node.children.push(child);
        this.calculateNodePositions();
        return child;
    }

    deleteNode(node) {
        if (!node || node === this.root) return;
        
        // Remove node from parent's children
        const parent = node.parent;
        const index = parent.children.indexOf(node);
        if (index !== -1) {
            parent.children.splice(index, 1);
        }
        
        // If parent has no children left, set a default value
        if (parent.children.length === 0) {
            parent.value = 0;
        }
        
        this.calculateNodePositions();
    }

    setNodeValue(node, value) {
        if (!node) return;
        node.value = value;
    }

    findNodeAtPosition(x, y) {
        const findNodeRecursive = (node) => {
            const dist = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2));
            if (dist <= node.radius) {
                return node;
            }
            for (const child of node.children) {
                const found = findNodeRecursive(child);
                if (found) return found;
            }
            return null;
        };
        return this.root ? findNodeRecursive(this.root) : null;
    }

    calculateNodePositions() {
        const calculateWidth = (depth) => {
            if (depth === this.depth) return this.nodeSpacing;
            return this.branchingFactor * calculateWidth(depth + 1);
        };

        const calculatePositionsRecursive = (node, x, y, width) => {
            node.x = x;
            node.y = y;

            if (node.children.length > 0) {
                const childWidth = width / this.branchingFactor;
                const startX = x - (width / 2) + (childWidth / 2);

                node.children.forEach((child, index) => {
                    const childX = startX + (index * childWidth);
                    calculatePositionsRecursive(child, childX, y + this.levelHeight, childWidth);
                });
            }
        };

        const totalWidth = calculateWidth(0);
        calculatePositionsRecursive(this.root, this.canvasWidth / 2, 50, totalWidth);
    }

    alphaBeta(node = this.root, depth = this.depth, alpha = -Infinity, beta = Infinity, isMax = true) {
        this.currentNode = node;
        
        if (depth === 0 || node.children.length === 0) {
            return node.value;
        }

        if (isMax) {
            let maxEval = -Infinity;
            for (let child of node.children) {
                const evaluation = this.alphaBeta(child, depth - 1, alpha, beta, false);
                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) {
                    child.pruned = true;
                    this.pruneCount++;
                    break;
                }
            }
            node.value = maxEval;
            return maxEval;
        } else {
            let minEval = Infinity;
            for (let child of node.children) {
                const evaluation = this.alphaBeta(child, depth - 1, alpha, beta, true);
                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) {
                    child.pruned = true;
                    this.pruneCount++;
                    break;
                }
            }
            node.value = minEval;
            return minEval;
        }
    }

    async animateTraversal(fromNode, toNode) {
        return new Promise(resolve => {
            this.isAnimating = true;
            this.animationStartTime = null;
            this.animationStartX = fromNode.x;
            this.animationStartY = fromNode.y;
            this.animationEndX = toNode.x;
            this.animationEndY = toNode.y;

            const animate = (timestamp) => {
                if (!this.animationStartTime) this.animationStartTime = timestamp;
                const progress = (timestamp - this.animationStartTime) / this.animationDuration;

                if (progress < 1) {
                    this.draw(ctx);
                    
                    // Draw animation circle
                    const x = this.animationStartX + (this.animationEndX - this.animationStartX) * progress;
                    const y = this.animationStartY + (this.animationEndY - this.animationStartY) * progress;
                    
                    ctx.strokeStyle = '#4A90E2';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(x, y, 25, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    requestAnimationFrame(animate);
                } else {
                    this.isAnimating = false;
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }

    draw(ctx) {
        if (!this.root) return;

        const drawNode = (node) => {
            // Draw edges to children
            node.children.forEach(child => {
                ctx.beginPath();
                ctx.strokeStyle = child.pruned ? '#95a5a6' : '#2d3748';
                ctx.lineWidth = 2;
                if (child.pruned) {
                    ctx.setLineDash([5, 5]);
                } else {
                    ctx.setLineDash([]);
                }
                ctx.moveTo(node.x, node.y);
                ctx.lineTo(child.x, child.y);
                ctx.stroke();
                
                drawNode(child);
            });

            // Draw node circle
            ctx.beginPath();
            ctx.setLineDash([]);
            ctx.fillStyle = node.pruned ? '#95a5a6' : (node.isMax ? '#4a90e2' : '#e24a4a');
            ctx.strokeStyle = '#2d3748';
            ctx.lineWidth = 2;
            ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Draw value
            if (node.value !== null) {
                ctx.fillStyle = 'white';
                ctx.font = '16px Press Start 2P';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(node.value.toString(), node.x, node.y);
            }

            // Draw alpha-beta values
            if (node.evaluated) {
                ctx.font = '12px Inter';
                ctx.fillStyle = '#2d3748';
                
                let alphaText = 'α: ' + (node.alpha === -Infinity ? '-∞' : node.alpha);
                let betaText = 'β: ' + (node.beta === Infinity ? '∞' : node.beta);
                
                ctx.fillText(alphaText, node.x, node.y - node.radius - 15);
                ctx.fillText(betaText, node.x, node.y - node.radius - 5);
            }

            // Highlight current node
            if (node === this.currentNode) {
                ctx.beginPath();
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 4;
                ctx.arc(node.x, node.y, node.radius + 5, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Highlight selected node
            if (node === this.selectedNode) {
                ctx.beginPath();
                ctx.strokeStyle = '#ff6b6b';
                ctx.lineWidth = 3;
                ctx.arc(node.x, node.y, node.radius + 3, 0, Math.PI * 2);
                ctx.stroke();
            }
        };

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        drawNode(this.root);
    }
}

class AlphaBetaVisualization {
    constructor() {
        this.tree = null;
        this.canvas = document.getElementById('treeCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.animationSpeed = 1000;
        this.isAutoPlaying = false;
        this.setupEventListeners();
    }

    init() {
        const depth = parseInt(document.getElementById('treeDepth').value);
        const branchingFactor = parseInt(document.getElementById('branchingFactor').value);
        const isMaxFirst = document.getElementById('playerType').value === 'max';

        this.tree = new AlphaBetaTree(depth, branchingFactor, this.canvas.width, this.canvas.height);
        this.tree.generateTree();
        this.tree.root.isMax = isMaxFirst;
        this.draw();
        this.updateUI();
    }

    setupEventListeners() {
        document.getElementById('startAlphaBeta').addEventListener('click', () => this.init());
        document.getElementById('nextStep').addEventListener('click', () => this.step());
        document.getElementById('autoPlay').addEventListener('click', () => this.toggleAutoPlay());
        document.getElementById('clear').addEventListener('click', () => this.clear());
        document.getElementById('resetTree').addEventListener('click', () => this.init());

        // Make canvas responsive
        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        if (this.tree) {
            this.tree.canvasWidth = this.canvas.width;
            this.tree.canvasHeight = this.canvas.height;
            this.tree.calculateNodePositions();
            this.tree.draw(this.ctx);
        }
    }

    step() {
        if (!this.tree || !this.tree.currentNode) {
            this.tree.currentNode = this.tree.root;
        }
        
        // Perform one step of alpha-beta pruning
        // This is a simplified version - you'll need to implement the actual stepping logic
        this.tree.alphaBeta(this.tree.currentNode);
        
        this.draw();
        this.updateUI();
    }

    toggleAutoPlay() {
        this.isAutoPlaying = !this.isAutoPlaying;
        const button = document.getElementById('autoPlay');
        button.textContent = this.isAutoPlaying ? 'Stop' : 'Autoplay';

        if (this.isAutoPlaying) {
            this.autoPlay();
        }
    }

    autoPlay() {
        if (!this.isAutoPlaying) return;
        
        this.step();
        
        if (this.tree.currentNode) {
            setTimeout(() => this.autoPlay(), this.animationSpeed);
        } else {
            this.isAutoPlaying = false;
            document.getElementById('autoPlay').textContent = 'Autoplay';
        }
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.tree = null;
        this.updateUI();
    }

    draw() {
        if (this.tree) {
            this.tree.draw(this.ctx);
        }
    }

    updateUI() {
        if (!this.tree || !this.tree.currentNode) {
            document.getElementById('currentPlayer').textContent = 'undefined';
            document.getElementById('alphaValue').textContent = '-∞';
            document.getElementById('betaValue').textContent = '+∞';
            document.getElementById('pruneCount').textContent = '0';
            document.getElementById('selectedNode').textContent = 'None';
            document.getElementById('nodeValueDisplay').textContent = 'undefined';
            document.getElementById('nodeType').textContent = 'undefined';
            document.getElementById('pruningStatus').textContent = 'No pruning';
            document.getElementById('decision').textContent = 'undefined';
            return;
        }

        const current = this.tree.currentNode;
        document.getElementById('currentPlayer').textContent = current.isMax ? 'Maximizer' : 'Minimizer';
        document.getElementById('alphaValue').textContent = current.alpha === -Infinity ? '-∞' : current.alpha;
        document.getElementById('betaValue').textContent = current.beta === Infinity ? '+∞' : current.beta;
        document.getElementById('pruneCount').textContent = this.tree.pruneCount;

        if (this.tree.selectedNode) {
            document.getElementById('selectedNode').textContent = `Depth ${this.tree.selectedNode.depth}`;
            document.getElementById('nodeValueDisplay').textContent = this.tree.selectedNode.value ?? 'Not set';
            document.getElementById('nodeType').textContent = this.tree.selectedNode.isMax ? 'Maximizer' : 'Minimizer';
            document.getElementById('pruningStatus').textContent = this.tree.selectedNode.pruned ? 'Pruned' : 'No pruning';
        }

        document.getElementById('decision').textContent = this.tree.root.value ?? 'undefined';
    }
}

// Initialize visualization when the page loads
window.addEventListener('load', () => {
    const visualization = new AlphaBetaVisualization();
    visualization.init();
});

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('treeCanvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }

    const ctx = canvas.getContext('2d');
    
    // Get UI elements
    const treeDepthInput = document.getElementById('treeDepth');
    const branchingFactorInput = document.getElementById('branchingFactor');
    const playerTypeSelect = document.getElementById('playerType');
    const nodeValueInput = document.getElementById('nodeValue');
    const setNodeValueBtn = document.getElementById('setNodeValue');
    const stepBtn = document.getElementById('step');
    const autoPlayBtn = document.getElementById('autoPlay');
    const resetBtn = document.getElementById('reset');

    let tree = null;
    let animationFrameId = null;

    function resizeCanvas() {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        if (tree) {
            tree.canvasWidth = canvas.width;
            tree.canvasHeight = canvas.height;
            tree.calculateNodePositions();
            tree.draw(ctx);
        }
    }

    function updateInfo() {
        if (!tree || !tree.currentNode) {
            document.getElementById('currentPlayer').textContent = 'undefined';
            document.getElementById('alphaValue').textContent = '-∞';
            document.getElementById('betaValue').textContent = '+∞';
            document.getElementById('pruneCount').textContent = '0';
            document.getElementById('selectedNode').textContent = 'None';
            document.getElementById('nodeValueDisplay').textContent = 'undefined';
            document.getElementById('nodeType').textContent = 'undefined';
            document.getElementById('pruningStatus').textContent = 'No pruning';
            document.getElementById('decision').textContent = 'undefined';
            return;
        }

        const current = tree.currentNode;
        document.getElementById('currentPlayer').textContent = current.isMax ? 'Maximizer' : 'Minimizer';
        document.getElementById('alphaValue').textContent = current.alpha === -Infinity ? '-∞' : current.alpha;
        document.getElementById('betaValue').textContent = current.beta === Infinity ? '+∞' : current.beta;
        document.getElementById('pruneCount').textContent = tree.pruneCount;

        if (tree.selectedNode) {
            document.getElementById('selectedNode').textContent = `Depth ${tree.selectedNode.depth}`;
            document.getElementById('nodeValueDisplay').textContent = tree.selectedNode.value ?? 'Not set';
            document.getElementById('nodeType').textContent = tree.selectedNode.isMax ? 'Maximizer' : 'Minimizer';
            document.getElementById('pruningStatus').textContent = tree.selectedNode.pruned ? 'Pruned' : 'No pruning';
        }

        document.getElementById('decision').textContent = tree.root.value ?? 'undefined';
    }

    function initializeTree() {
        const depth = parseInt(treeDepthInput.value) || 3;
        const branching = parseInt(branchingFactorInput.value) || 2;
        
        tree = new AlphaBetaTree(depth, branching, canvas.width, canvas.height);
        tree.generateTree();
        tree.root.isMax = playerTypeSelect.value === 'max';
        
        // Reset state
        tree.currentNode = null;
        tree.selectedNode = null;
        tree.pruneCount = 0;
        
        updateInfo();
        tree.draw(ctx);
    }

    function animate() {
        if (tree) {
            tree.draw(ctx);
        }
        animationFrameId = requestAnimationFrame(animate);
    }

    // Event Listeners
    canvas.addEventListener('click', (e) => {
        if (!tree) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const clickedNode = tree.findNodeAtPosition(x, y);
        if (clickedNode) {
            tree.selectedNode = clickedNode;
            updateInfo();
        }
    });

    setNodeValueBtn.addEventListener('click', () => {
        if (!tree || !tree.selectedNode) return;
        
        const value = parseInt(nodeValueInput.value);
        if (!isNaN(value)) {
            tree.selectedNode.value = value;
            tree.draw(ctx);
            updateInfo();
        }
    });

    stepBtn.addEventListener('click', () => {
        if (!tree) return;
        if (!tree.currentNode) {
            tree.currentNode = tree.root;
        }
        // Implement step logic here
        updateInfo();
    });

    autoPlayBtn.addEventListener('click', () => {
        if (!tree) return;
        // Implement autoplay logic here
    });

    resetBtn.addEventListener('click', initializeTree);

    // Initial setup
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    initializeTree();
    animate();
});