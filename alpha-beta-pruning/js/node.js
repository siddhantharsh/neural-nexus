let stepCounter = 0;
let nodesEvaluated = 0;
let nodesPruned = 0;
let totalNodes = 0;

function updateStepInfo(description) {
    const stepInfo = document.getElementById('stepInfo');
    const currentStep = document.getElementById('currentStep');
    const stepDescription = document.getElementById('stepDescription');
    const algorithmStats = document.getElementById('algorithmStats');
    const nodesEvaluatedSpan = document.getElementById('nodesEvaluated');
    const nodesPrunedSpan = document.getElementById('nodesPruned');
    const efficiencyGainSpan = document.getElementById('efficiencyGain');

    stepCounter++;
    currentStep.textContent = stepCounter;
    stepDescription.textContent = description;
    
    if (algorithmStats.style.display === 'none') {
        algorithmStats.style.display = 'block';
    }
    
    nodesEvaluatedSpan.textContent = nodesEvaluated;
    nodesPrunedSpan.textContent = nodesPruned;
    
    // Calculate efficiency gain
    if (totalNodes > 0) {
        const efficiencyGain = ((nodesPruned / totalNodes) * 100).toFixed(1);
        efficiencyGainSpan.textContent = efficiencyGain + '%';
    }
}

export function resetAlgorithmStats() {
    stepCounter = 0;
    nodesEvaluated = 0;
    nodesPruned = 0;
    totalNodes = 0;
    
    // Reset UI
    document.getElementById('currentStep').textContent = '0';
    document.getElementById('stepDescription').textContent = 'Click \'Run\' or \'Step\' to start the algorithm';
    document.getElementById('algorithmStats').style.display = 'none';
    document.getElementById('stepInfo').classList.remove('running', 'completed');
}

export function Node() {
    this.pos = [0, 0];
    this.children = [];
    this.value = 0;
    this.pruned = false;
    this.step = 0;
    this.scale = 1; // For animation
};

Node.prototype.setPruned = function() {
    this.pruned = true;
    for (const child of this.children) {
        child.setPruned();
    };
};

// Modified so algorithm can be stepped through
Node.prototype.minimax = function() {
    if (this.step == 0) {
        this.childSearchDone = false;
        this.currentChildSearch = 0;
        if (this.children.length == 0) {
            nodesEvaluated++;
            updateStepInfo(`Evaluating leaf node with value: ${this.value}`);
            if (this.parent != null) {
                this.parent.return = this.value;
                return this.parent.minimax();
            };
            document.getElementById('stepInfo').classList.add('completed');
            return null;
        };
        if (this.max) {
            this.value = Number.NEGATIVE_INFINITY;
            updateStepInfo(`Starting MAX node evaluation with initial value: -∞`);
        } else {
            this.value = Number.POSITIVE_INFINITY;
            updateStepInfo(`Starting MIN node evaluation with initial value: ∞`);
        };
        this.step += 1;
        document.getElementById('stepInfo').classList.add('running');
    };
    if (this.step == 1) {
        if (this.currentChildSearch == this.children.length) {
            updateStepInfo(`Completed node evaluation with final value: ${this.value}`);
            if (this.parent != null) {
                this.parent.return = this.value;
                return this.parent.minimax();
            };
            document.getElementById('stepInfo').classList.remove('running');
            document.getElementById('stepInfo').classList.add('completed');
            return null;
        };
        if (this.childSearchDone) {
            for (var i = this.currentChildSearch; i < this.children.length; i++) {
                this.children[i].setPruned();
                nodesPruned++;
            };
            updateStepInfo(`Pruning remaining branches - cutoff detected`);
            this.currentChildSearch = this.children.length;
            return this;
        };
        var child = this.children[this.currentChildSearch];
        child.alpha = this.alpha;
        child.beta = this.beta;
        totalNodes++;
        this.step += 1;
        updateStepInfo(`Exploring child ${this.currentChildSearch + 1}/${this.children.length}`);
        return child;
    } else if (this.step == 2) {
        var childValue = this.return;
        if (this.max) {
            this.value = Math.max(this.value, childValue);
            this.alpha = Math.max(this.alpha, childValue);
            updateStepInfo(`Updated MAX node - new value: ${this.value}, α: ${this.alpha}`);
        } else {
            this.value = Math.min(this.value, childValue);
            this.beta = Math.min(this.beta, childValue);
            updateStepInfo(`Updated MIN node - new value: ${this.value}, β: ${this.beta}`);
        };
        if (this.beta <= this.alpha) {
            this.childSearchDone = true;
            updateStepInfo(`Pruning opportunity detected: β(${this.beta}) ≤ α(${this.alpha})`);
        };
        this.currentChildSearch += 1;
        this.step -= 1;
        return this;
    };
    return null;
};

Node.prototype.draw = function(ctx) {
    // Draw edges first
    for (const node of this.children) {
        ctx.lineWidth = 2;
        if (node.pruned) {
            ctx.strokeStyle = "#94A3B8";  // Light gray for pruned edges
        } else {
            ctx.strokeStyle = "#94A3B8";  // Same light gray for consistency
        };
        ctx.beginPath();
        ctx.moveTo(this.pos[0], this.pos[1] + Node.radius - 1);
        ctx.lineTo(node.pos[0], node.pos[1] - Node.radius + 1);
        ctx.stroke();
        node.draw(ctx);
    };

    // Draw node circle with scale
    ctx.save();
    let scale = this.scale !== undefined ? this.scale : 1;
    ctx.translate(this.pos[0], this.pos[1]);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.arc(0, 0, Node.radius, 0, 2 * Math.PI);
    
    if (this.pruned) {
        ctx.fillStyle = "#B4C6FC";  // Light blue for pruned nodes
    } else {
        if (this.max) {
            ctx.fillStyle = "#1E293B";  // Dark navy for max nodes
        } else {
            ctx.fillStyle = "#7795b5";  // Blue-gray for min nodes
        }
    }
    ctx.fill();

    // Draw node value
    ctx.font = "bold 16px Inter";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";  // White text
    if (this.value != null && this.value != Number.POSITIVE_INFINITY && this.value != Number.NEGATIVE_INFINITY) {
        ctx.fillText(this.value.toString(), 0, 0);
    }

    // Draw alpha-beta values if node has children
    if (this.children.length > 0) {
        ctx.font = "bold 14px Inter";
        ctx.fillStyle = "#60A5FA";  // Bright blue for alpha-beta values

        var alphaText = "α: ";
        if (this.alpha == Number.POSITIVE_INFINITY) {
            alphaText += "∞";
        } else if (this.alpha == Number.NEGATIVE_INFINITY) {
            alphaText += "-∞";
        } else if (this.alpha == null) {
            alphaText = "";
        } else {
            alphaText += this.alpha;
        }
        ctx.fillText(alphaText, 0, -Node.radius * 1.7);
        
        var betaText = "β: ";
        if (this.beta == Number.POSITIVE_INFINITY) {
            betaText += "∞";
        } else if (this.beta == Number.NEGATIVE_INFINITY) {
            betaText += "-∞";
        } else if (this.beta == null) {
            betaText = "";
        } else {
            betaText += this.beta;
        }
        ctx.fillText(betaText, 0, -Node.radius * 1.3);
    }

    // Draw highlight for current node if needed
    if (this === this.nodeManager?.selected && !this.pruned) {
        ctx.strokeStyle = "#60A5FA";  // Bright blue highlight
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, Node.radius + 5, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();
};

Node.radius = 25;  // Set a consistent node size