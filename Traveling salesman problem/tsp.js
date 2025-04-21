class TSP {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.points = [];
        this.currentPath = [];
        this.bestPath = [];
        this.bestDistance = Infinity;
        this.stepCount = 0;
        this.isRunning = false;
        this.algorithm = 'nearest';
        this.animationFrame = null;

        this.initializeCanvas();
        this.setupEventListeners();
    }

    initializeCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.draw();
    }

    setupEventListeners() {
        // Canvas click handler
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

        // Button handlers
        document.getElementById('addPoint').addEventListener('click', () => {
            document.getElementById('canvasOverlay').style.display = 'block';
        });
        document.getElementById('clearPoints').addEventListener('click', () => this.clearPoints());
        document.getElementById('randomPoints').addEventListener('click', () => this.addRandomPoints());
        document.getElementById('solve').addEventListener('click', () => this.solve());
        document.getElementById('step').addEventListener('click', () => this.step());
        document.getElementById('reset').addEventListener('click', () => this.reset());
        document.getElementById('algorithm').addEventListener('change', (e) => {
            this.algorithm = e.target.value;
            this.updateInfo();
        });
    }

    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.addPoint(x, y);
        document.getElementById('canvasOverlay').style.display = 'none';
    }

    addPoint(x, y) {
        this.points.push({ x, y });
        this.updateStats();
        this.draw();
    }

    addRandomPoints() {
        const padding = 50;
        const count = 5 + Math.floor(Math.random() * 6); // 5-10 points
        this.clearPoints();
        for (let i = 0; i < count; i++) {
            const x = padding + Math.random() * (this.canvas.width - 2 * padding);
            const y = padding + Math.random() * (this.canvas.height - 2 * padding);
            this.points.push({ x, y });
        }
        this.updateStats();
        this.draw();
    }

    clearPoints() {
        this.points = [];
        this.currentPath = [];
        this.bestPath = [];
        this.bestDistance = Infinity;
        this.stepCount = 0;
        this.isRunning = false;
        this.updateStats();
        this.draw();
    }

    reset() {
        this.currentPath = [];
        this.stepCount = 0;
        this.isRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.updateStats();
        this.draw();
    }

    distance(p1, p2) {
        return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    }

    totalDistance(path) {
        let total = 0;
        for (let i = 0; i < path.length - 1; i++) {
            total += this.distance(this.points[path[i]], this.points[path[i + 1]]);
        }
        if (path.length > 0) {
            total += this.distance(this.points[path[path.length - 1]], this.points[path[0]]);
        }
        return total;
    }

    nearestNeighbor() {
        if (this.points.length < 2) return;
        
        if (this.currentPath.length === 0) {
            this.currentPath = [0];
        }

        if (this.currentPath.length < this.points.length) {
            const last = this.currentPath[this.currentPath.length - 1];
            let nearest = -1;
            let minDist = Infinity;

            for (let i = 0; i < this.points.length; i++) {
                if (!this.currentPath.includes(i)) {
                    const dist = this.distance(this.points[last], this.points[i]);
                    if (dist < minDist) {
                        minDist = dist;
                        nearest = i;
                    }
                }
            }

            if (nearest !== -1) {
                this.currentPath.push(nearest);
            }
        }

        const currentDistance = this.totalDistance(this.currentPath);
        if (currentDistance < this.bestDistance) {
            this.bestDistance = currentDistance;
            this.bestPath = [...this.currentPath];
        }

        return this.currentPath.length === this.points.length;
    }

    twoOpt() {
        if (this.points.length < 3) return true;

        if (this.currentPath.length === 0) {
            this.currentPath = Array.from({ length: this.points.length }, (_, i) => i);
            this.bestPath = [...this.currentPath];
            this.bestDistance = this.totalDistance(this.currentPath);
        }

        let improved = false;
        const n = this.points.length;

        for (let i = 0; i < n - 1 && !improved; i++) {
            for (let j = i + 1; j < n && !improved; j++) {
                const newPath = [...this.currentPath];
                // Reverse the segment between i and j
                const segment = newPath.slice(i, j + 1).reverse();
                newPath.splice(i, segment.length, ...segment);

                const newDistance = this.totalDistance(newPath);
                if (newDistance < this.bestDistance) {
                    this.bestDistance = newDistance;
                    this.bestPath = [...newPath];
                    this.currentPath = newPath;
                    improved = true;
                }
            }
        }

        return !improved;
    }

    bruteForce(current = [], used = new Set()) {
        if (this.points.length > 10) {
            this.updateInfo("Too many points for brute force! Use ≤10 points.");
            return true;
        }

        if (current.length === 0) {
            this.currentPath = [0];
            used.add(0);
        }

        if (this.currentPath.length === this.points.length) {
            const distance = this.totalDistance(this.currentPath);
            if (distance < this.bestDistance) {
                this.bestDistance = distance;
                this.bestPath = [...this.currentPath];
            }
            return true;
        }

        for (let i = 0; i < this.points.length; i++) {
            if (!used.has(i)) {
                this.currentPath.push(i);
                used.add(i);
                return false;
            }
        }

        return false;
    }

    step() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.currentPath = [];
            this.bestPath = [];
            this.bestDistance = Infinity;
        }

        let finished = false;
        switch (this.algorithm) {
            case 'nearest':
                finished = this.nearestNeighbor();
                break;
            case 'twoOpt':
                finished = this.twoOpt();
                break;
            case 'bruteForce':
                finished = this.bruteForce();
                break;
        }

        this.stepCount++;
        this.updateStats();
        this.draw();

        if (finished) {
            this.isRunning = false;
            this.currentPath = [...this.bestPath];
        }
    }

    solve() {
        const animate = () => {
            if (this.isRunning) {
                this.step();
                this.animationFrame = requestAnimationFrame(animate);
            }
        };

        if (!this.isRunning) {
            this.reset();
            this.isRunning = true;
            animate();
        }
    }

    updateStats() {
        document.getElementById('pointCount').textContent = this.points.length;
        document.getElementById('pathLength').textContent = 
            this.bestDistance === Infinity ? 0 : Math.round(this.bestDistance);
        document.getElementById('stepCount').textContent = this.stepCount;
    }

    updateInfo() {
        const info = {
            nearest: "Nearest Neighbor: Greedily selects the closest unvisited point.",
            twoOpt: "2-Opt: Improves the route by swapping path segments.",
            bruteForce: "Brute Force: Tries all possible combinations (≤10 points)."
        };
        document.getElementById('info').textContent = info[this.algorithm];
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw points
        this.points.forEach((point, i) => {
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
            this.ctx.fillStyle = '#4A90E2';
            this.ctx.fill();
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });

        // Draw current path
        if (this.currentPath.length > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(
                this.points[this.currentPath[0]].x,
                this.points[this.currentPath[0]].y
            );

            for (let i = 1; i < this.currentPath.length; i++) {
                this.ctx.lineTo(
                    this.points[this.currentPath[i]].x,
                    this.points[this.currentPath[i]].y
                );
            }

            if (this.currentPath.length === this.points.length) {
                this.ctx.lineTo(
                    this.points[this.currentPath[0]].x,
                    this.points[this.currentPath[0]].y
                );
            }

            this.ctx.strokeStyle = '#4A90E2';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }
}

// Initialize the application
const tsp = new TSP();
tsp.updateInfo(); 