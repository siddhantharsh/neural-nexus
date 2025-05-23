import { setSelectedNode } from "./controls_manager.js";
import { onResize } from "./helpers.js";
import { Node, resetAlgorithmStats } from "./node.js";

export function NodeManager(canvasID) {
    this.canvas = document.getElementById(canvasID);
    this.ctx = this.canvas.getContext("2d");
    this.nodes = [];
    this.selected = null;
    this.bottomLayerCount = null;
    this.currentNode = null
    this.highlightRadius = null;
    this.targetHighlightRadius = null;
    this.animatingHighlight = false;
    this.highlightPos = null;

    window.addEventListener("resize", this.draw.bind(this));
    canvas.addEventListener("mousedown", this.onMouseClick.bind(this));
    
    document.getElementById("run").addEventListener("click", this.run.bind(this));
    document.getElementById("step").addEventListener("click", this.step.bind(this));
    document.getElementById("reset").addEventListener("click", this.reset.bind(this));

    document.getElementById("addChild").addEventListener("click", this.addChild.bind(this));
    document.getElementById("deleteNode").addEventListener("click", this.deleteNode.bind(this));
    document.getElementById("setValue").addEventListener("click", this.setValue.bind(this));
}

NodeManager.prototype.reset = function() {
    if (this.selected != -1) {
        return;
    };
    this.selected = null;
    this.currentNode = null;
    for (const nodeLayer of this.nodes) {
        for (const node of nodeLayer) {
            node.pruned = false;
            node.step = 0;
            node.alpha = null;
            node.beta = null;
            if (node.children.length != 0) {
                node.value = null;
            };
        };
    };
    resetAlgorithmStats();
    setSelectedNode(this.selected, this.selected == this.nodes[0][0]);
    this.draw();
};

NodeManager.prototype.step = function() {
    let prevNode = this.currentNode;
    if (this.currentNode != null) {
        this.currentNode = this.currentNode.minimax();
    } else if (this.selected != -1) {
        this.selected = -1;
        setSelectedNode(this.selected, this.selected == this.nodes[0][0]);
        this.nodes[0][0].alpha = Number.NEGATIVE_INFINITY;
        this.nodes[0][0].beta = Number.POSITIVE_INFINITY;
        this.currentNode = this.nodes[0][0]
    }
    // Animate highlight if node changed
    if (this.currentNode !== prevNode) {
        this.animateHighlightMove(prevNode, this.currentNode);
    } else {
        this.draw();
    }
}

NodeManager.prototype.animateHighlightMove = function(prevNode, currNode) {
    if (!prevNode || !currNode) {
        this.draw();
        return;
    }
    this.animatingHighlight = true;
    this.highlightPos = [...prevNode.pos];
    this.targetHighlightPos = [...currNode.pos];
    const duration = 350; // ms
    const start = performance.now();
    const animate = (now) => {
        let elapsed = now - start;
        let t = Math.min(1, elapsed / duration);
        // Ease in-out
        let eased = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
        this.highlightPos[0] = prevNode.pos[0] + (currNode.pos[0] - prevNode.pos[0]) * eased;
        this.highlightPos[1] = prevNode.pos[1] + (currNode.pos[1] - prevNode.pos[1]) * eased;
        this.draw(true);
        if (t < 1) {
            requestAnimationFrame(animate);
        } else {
            this.highlightPos = [...currNode.pos];
            this.animatingHighlight = false;
            this.draw();
        }
    };
    requestAnimationFrame(animate);
}

NodeManager.prototype.run = function() {
    if (this.selected != -1) {
        this.selected = -1;
        setSelectedNode(this.selected, this.selected == this.nodes[0][0]);
        this.nodes[0][0].alpha = Number.NEGATIVE_INFINITY;
        this.nodes[0][0].beta = Number.POSITIVE_INFINITY;
        this.currentNode = this.nodes[0][0]
    };
    while (this.currentNode != null) {
        this.currentNode = this.currentNode.minimax();
    };
    this.draw();
};

NodeManager.prototype.setValue = function() {
    var value = document.getElementById("staticValue").value;
    if(isNaN(value) || value == "") {
        value = 0;
    } else {
        value = Number.parseInt(value);
        value = Math.min(99, Math.max(-99, value));
    }
    this.selected.value = value;
    document.getElementById("staticValue").value = value;
    this.draw();
}

NodeManager.prototype.addChild = function() {
    if (this.selected == null) {
        return;
    };
    this.selected.value = null;
    var newNode = new Node();
    newNode.layer = this.selected.layer + 1;
    newNode.max = !this.selected.max;
    newNode.parent = this.selected;
    newNode.scale = 0.1; // Start small for pop-in
    this.selected.children.push(newNode);
    if (newNode.layer == this.nodes.length) {
        this.nodes.push([]);
    };
    this.nodes[newNode.layer].push(newNode);
    this.bottomLayerCount = null;
    setSelectedNode(this.selected, this.selected == this.nodes[0][0]);
    this.animateNodePopIn(newNode);
};

NodeManager.prototype.animateNodePopIn = function(node) {
    const duration = 300;
    const start = performance.now();
    const animate = (now) => {
        let elapsed = now - start;
        let t = Math.min(1, elapsed / duration);
        // Ease out
        let eased = 1 - Math.pow(1 - t, 2);
        node.scale = 0.1 + (1 - 0.1) * eased;
        this.draw();
        if (t < 1) {
            requestAnimationFrame(animate);
        } else {
            node.scale = 1;
            this.draw();
        }
    };
    requestAnimationFrame(animate);
}

NodeManager.prototype.deleteNode = function() {
    if (this.selected == null || this.selected.layer == 0) {
        return;
    };
    const nodeToDelete = this.selected;
    this.animateNodePopOut(nodeToDelete);
};

NodeManager.prototype.animateNodePopOut = function(node) {
    const duration = 300;
    const startScale = node.scale !== undefined ? node.scale : 1;
    const start = performance.now();
    const animate = (now) => {
        let elapsed = now - start;
        let t = Math.min(1, elapsed / duration);
        // Ease in
        let eased = Math.pow(1 - t, 2);
        node.scale = startScale * eased;
        this.draw();
        if (t < 1) {
            requestAnimationFrame(animate);
        } else {
            // Actually remove the node after animation
            this._deleteNodeNow(node);
        }
    };
    requestAnimationFrame(animate);
}

NodeManager.prototype._deleteNodeNow = function(nodeToDelete) {
    var nodeStack = [nodeToDelete];
    while (nodeStack.length != 0) {
        var node = nodeStack.pop();
        for (var i = 0; i < this.nodes[node.layer].length; i++) {
            if (this.nodes[node.layer][i] == node) {
                this.nodes[node.layer].splice(i, 1);
                break;
            };
        };
        for (const child of node.children.slice().reverse()) {
            nodeStack.push(child);
        };
    };
    for (var i = this.nodes.length - 1; i >= 0; i--) {
        if (this.nodes[i].length == 0) {
            this.nodes.splice(i, 1);
        };
    };
    var done = false;
    for (const node of this.nodes[nodeToDelete.layer - 1]) {
        for (var i = 0; i < node.children.length; i++) {
            if (node.children[i] == nodeToDelete) {
                node.children.splice(i, 1);
                if (node.children.length == 0) {
                    node.value = 0;
                };
                done = true;
                break;
            };
        };
        if (done) {
            break;
        };
    };
    this.selected = null;
    setSelectedNode(this.selected, this.selected == this.nodes[0][0]);
    this.bottomLayerCount = null;
    this.draw();
};

NodeManager.prototype.onMouseClick = function(event) {
    if (this.selected == -1) {
        return;
    };
    this.selected = null;
    // Calculate hit area based on node radius
    const hitAreaMultiplier = 1.5; // This gives us a 50% larger hit area than the visible node
    
    for (const nodeLayer of this.nodes) {
        for (const node of nodeLayer) {
            var dist = Math.sqrt(Math.pow(event.offsetX - node.pos[0], 2) + Math.pow(event.offsetY - node.pos[1], 2));
            if (dist <= Node.radius * hitAreaMultiplier) {  // Use proportional hit area
                this.selected = node;
                break;
            };
        };
        if (this.selected != null) {
            break;
        };
    };
    setSelectedNode(this.selected, this.selected == this.nodes[0][0]);
    this.draw();
};

NodeManager.prototype.setNodeRadius = function() {
    if (this.bottomLayerCount == null) {
        this.bottomLayerCount = 0;
        var nodeStack = [this.nodes[0][0]];
        while (nodeStack.length != 0) {
            var node = nodeStack.pop();
            if (node.children.length == 0) {
                this.bottomLayerCount += 1;
            } else {
                for (const child of node.children.slice().reverse()) {
                    nodeStack.push(child);
                };
            };
        };
    };
    var xDiam = this.canvas.width / (0.5 + 1.5 * this.bottomLayerCount);
    var yDiam = this.canvas.height / (1 + 2 * this.nodes.length);
    Node.radius = Math.min(xDiam, yDiam) / 2;
};

NodeManager.prototype.setNodePositions = function() {
    var xOffset = (this.canvas.width - Node.radius * (1 + 3 * this.bottomLayerCount)) / 2;
    var yOffset = (this.canvas.height - Node.radius * (1 + 4 * this.nodes.length)) / 2;
    var count = 2;
    var nodeStack = [this.nodes[0][0]];
    while (nodeStack.length != 0) {
        var node = nodeStack.pop();
        if (node.children.length == 0) {
            node.pos[0] = xOffset + count * Node.radius;
            node.pos[1] = yOffset + (2 + 4 * node.layer) * Node.radius;
            count += 3;
        } else {
            for (const child of node.children.slice().reverse()) {
                nodeStack.push(child);
            };
        };
    };
    for (const nodeLayer of this.nodes.slice(0, -1).reverse()) {
        for (const node of nodeLayer) {
            if (node.children.length != 0) {
                node.pos[0] = (node.children[0].pos[0] + node.children[node.children.length - 1].pos[0]) / 2;
                node.pos[1] = yOffset + (2 + 4 * node.layer) * Node.radius;
            };
        };
    };
};

NodeManager.prototype.draw = function(animating) {
    onResize();
    this.setNodeRadius();
    this.setNodePositions();
    this.nodes[0][0].draw(this.ctx);
    
    var highlight = this.selected;
    if (this.currentNode != null) {
        highlight = this.currentNode;
    };
    if (highlight != null && highlight != -1) {
        this.ctx.lineWidth = Math.max(1, parseInt(Node.radius / 10));
        this.ctx.strokeStyle = "#0000ff";
        this.ctx.beginPath();
        let pos = (this.animatingHighlight && this.highlightPos) ? this.highlightPos : highlight.pos;
        this.ctx.arc(pos[0], pos[1], Node.radius, 0, 2 * Math.PI);
        this.ctx.stroke();
    };
};