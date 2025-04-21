class GameState {
    constructor() {
        this.width = 8;
        this.height = 6;
        this.agentX = 0;
        this.agentY = 5;
        this.direction = 'right';
        this.gameOver = false;
        this.totalGold = 2;
        this.collectedGold = 0;
        
        // Initialize grid with empty cells
        this.grid = Array(this.height).fill().map(() => Array(this.width).fill().map(() => ({
            visited: false,
            hasWumpus: false,
            hasPit: false,
            hasGold: false,
            hasStench: false,
            hasBreeze: false
        })));
        
        // Place game elements
        this.placeGameElements();
    }

    placeGameElements() {
        // Place Wumpus - it will create stench in adjacent cells
        this.grid[2][2].hasWumpus = true;
        
        // Place pits - each will create breeze in adjacent cells
        this.grid[4][1].hasPit = true;  // This creates breeze at (0,1), (1,0), (2,1)
        this.grid[3][3].hasPit = true;  // This creates breeze at (2,3), (3,2), (4,3), (3,4)
        
        // Add percepts around hazards
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x].hasWumpus) {
                    this.addStench(x, y);
                }
                if (this.grid[y][x].hasPit) {
                    this.addBreeze(x, y);
                }
            }
        }

        // Place gold pieces
        this.grid[1][3].hasGold = true;
        this.grid[3][1].hasGold = true;

        // Mark only the starting cell as visited
        this.grid[5][0].visited = true;
    }

    addStench(x, y) {
        // Add stench to all adjacent cells (up, right, down, left)
        const neighbors = [
            [x, y-1], // up
            [x+1, y], // right
            [x, y+1], // down
            [x-1, y]  // left
        ];
        
        neighbors.forEach(([nx, ny]) => {
            if (this.isValidCell(nx, ny)) {
                this.grid[ny][nx].hasStench = true;
            }
        });
    }

    addBreeze(x, y) {
        // Add breeze to all adjacent cells (up, right, down, left)
        const neighbors = [
            [x, y-1], // up
            [x+1, y], // right
            [x, y+1], // down
            [x-1, y]  // left
        ];
        
        neighbors.forEach(([nx, ny]) => {
            if (this.isValidCell(nx, ny)) {
                this.grid[ny][nx].hasBreeze = true;
            }
        });
    }

    isValidCell(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    grabGold() {
        const currentCell = this.grid[this.agentY][this.agentX];
        if (currentCell.hasGold) {
            currentCell.hasGold = false;
            this.collectedGold++;
            document.getElementById('goldCounter').textContent = `${this.collectedGold}/${this.totalGold}`;
            this.updateKnowledge(`Gold collected! (${this.collectedGold}/${this.totalGold})`);
            
            if (this.collectedGold === this.totalGold) {
                this.updateKnowledge('Congratulations! All gold collected!');
                this.gameOver = true;
                this.updateButtonStates();
            }
            return true;
        }
        return false;
    }

    renderWorld() {
        const grid = document.getElementById('grid');
        grid.innerHTML = '';

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                const currentCell = this.grid[y][x];

                if (currentCell.visited) {
                    cell.classList.add('visited');
                }

                if (x === this.agentX && y === this.agentY) {
                    cell.classList.add('current');
                    const agent = document.createElement('div');
                    agent.className = `agent-direction`;
                    cell.classList.add(`agent-${this.direction}`);
                    cell.appendChild(agent);
                }

                if (currentCell.visited || (x === this.agentX && y === this.agentY)) {
                    if (currentCell.hasWumpus) {
                        cell.classList.add('wumpus');
                    }
                    if (currentCell.hasPit) {
                        cell.classList.add('pit');
                    }
                    if (currentCell.hasGold) {
                        cell.classList.add('gold');
                    }
                    if (currentCell.hasStench) {
                        const stench = document.createElement('div');
                        stench.className = 'percept stench';
                        cell.appendChild(stench);
                    }
                    if (currentCell.hasBreeze) {
                        const breeze = document.createElement('div');
                        breeze.className = 'percept breeze';
                        cell.appendChild(breeze);
                    }
                    if (currentCell.hasGold) {
                        const glitter = document.createElement('div');
                        glitter.className = 'percept glitter';
                        cell.appendChild(glitter);
                    }
                }

                grid.appendChild(cell);
            }
        }
    }

    moveForward() {
        if (this.gameOver) return false;
        
        let newX = this.agentX;
        let newY = this.agentY;
        
        switch(this.direction) {
            case 'up': newY--; break;
            case 'right': newX++; break;
            case 'down': newY++; break;
            case 'left': newX--; break;
        }
        
        if (this.isValidCell(newX, newY)) {
            this.agentX = newX;
            this.agentY = newY;
            this.grid[newY][newX].visited = true;
            
            // Update knowledge base with current position
            this.updateKnowledge(`Moved to position (${newX}, ${newY})`);
            
            // Check and report percepts
            const currentCell = this.grid[newY][newX];
            let percepts = [];
            
            if (currentCell.hasBreeze) {
                percepts.push('breeze');
                this.updateKnowledge('I feel a breeze... There must be a pit nearby!');
            }
            
            if (currentCell.hasStench) {
                percepts.push('stench');
                this.updateKnowledge('I smell a stench... The Wumpus must be close!');
            }
            
            if (currentCell.hasGold) {
                percepts.push('glitter');
                this.updateKnowledge('I see something glittering... There is gold here!');
            }
            
            if (percepts.length === 0) {
                this.updateKnowledge('This room seems safe.');
            }
            
            if (currentCell.hasWumpus) {
                this.updateKnowledge('Game Over! You encountered the Wumpus!');
                this.gameOver = true;
                this.updateButtonStates();
            } else if (currentCell.hasPit) {
                this.updateKnowledge('Game Over! You fell into a pit!');
                this.gameOver = true;
                this.updateButtonStates();
            }
            
            this.updateUI();
            return true;
        } else {
            this.updateKnowledge('Cannot move forward - wall detected!');
            return false;
        }
    }

    turnLeft() {
        if (this.gameOver) return;
        switch(this.direction) {
            case 'up': this.direction = 'left'; break;
            case 'right': this.direction = 'up'; break;
            case 'down': this.direction = 'right'; break;
            case 'left': this.direction = 'down'; break;
        }
        this.updateKnowledge(`Turned left, now facing ${this.direction}`);
        this.updateUI();
    }

    turnRight() {
        if (this.gameOver) return;
        switch(this.direction) {
            case 'up': this.direction = 'right'; break;
            case 'right': this.direction = 'down'; break;
            case 'down': this.direction = 'left'; break;
            case 'left': this.direction = 'up'; break;
        }
        this.updateKnowledge(`Turned right, now facing ${this.direction}`);
        this.updateUI();
    }

    updateKnowledge(message, type = '') {
        const list = document.getElementById('knowledge-list');
        const item = document.createElement('li');
        item.textContent = message;
        if (message.includes('Game Over')) {
            item.classList.add('danger');
        } else if (message.includes('breeze') || message.includes('stench')) {
            item.classList.add('warning');
        } else if (message.includes('gold') || message.includes('glitter')) {
            item.classList.add('success');
        }
        list.insertBefore(item, list.firstChild);
    }

    reset() {
        this.agentX = 0;
        this.agentY = 5;
        this.direction = 'right';
        this.gameOver = false;
        this.collectedGold = 0;
        
        // Reset grid
        this.grid = Array(this.height).fill().map(() => Array(this.width).fill().map(() => ({
            visited: false,
            hasWumpus: false,
            hasPit: false,
            hasGold: false,
            hasStench: false,
            hasBreeze: false
        })));
        
        // Place game elements again
        this.placeGameElements();
        
        // Clear knowledge list
        document.getElementById('knowledge-list').innerHTML = '';
        this.updateKnowledge('Game reset. Good luck!');
        
        // Enable all buttons
        this.updateButtonStates();
        
        this.updateUI();
    }

    updateUI() {
        document.getElementById('position').textContent = `(${this.agentX},${this.agentY})`;
        document.getElementById('goldCounter').textContent = `${this.collectedGold}/${this.totalGold}`;
        document.getElementById('breeze').textContent = this.grid[this.agentY][this.agentX].hasBreeze ? 'Yes' : 'No';
        document.getElementById('stench').textContent = this.grid[this.agentY][this.agentX].hasStench ? 'Yes' : 'No';
        document.getElementById('glitter').textContent = this.grid[this.agentY][this.agentX].hasGold ? 'Yes' : 'No';
        
        // Update button states
        this.updateButtonStates();
        
        this.renderWorld();
    }

    updateButtonStates() {
        const buttons = ['moveForward', 'turnLeft', 'turnRight', 'grab', 'shoot'];
        buttons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            button.disabled = this.gameOver || this.collectedGold === this.totalGold;
        });
        // Reset button is always enabled
        document.getElementById('reset').disabled = false;
    }
}

// Initialize game
const game = new GameState();
game.updateUI();

// Add event listeners
document.getElementById('moveForward').addEventListener('click', () => game.moveForward());
document.getElementById('turnLeft').addEventListener('click', () => game.turnLeft());
document.getElementById('turnRight').addEventListener('click', () => game.turnRight());
document.getElementById('grab').addEventListener('click', () => game.grabGold());
document.getElementById('reset').addEventListener('click', () => game.reset());
document.getElementById('shoot').addEventListener('click', () => {
    if (!game.gameOver) {
        game.updateKnowledge('Arrow shot! But nothing happened...');
    }
});