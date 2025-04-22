class MissionariesCannibals {
    constructor() {
        this.state = {
            left: { missionaries: 3, cannibals: 3 },
            right: { missionaries: 0, cannibals: 0 },
            boat: { missionaries: 0, cannibals: 0 },
            boatPosition: 'left',
            moves: 0,
            invalidAttempts: 0
        };

        this.solution = [
            // Step 1: (3,3,L) → (3,1,R) [2 cannibals cross]
            { action: 'add', type: 'cannibals', count: 2 },
            { action: 'cross' },
            { action: 'remove', type: 'cannibals', count: 2 },
            
            // Step 2: (3,1,R) → (3,2,L) [1 cannibal returns]
            { action: 'add', type: 'cannibals', count: 1 },
            { action: 'cross' },
            { action: 'remove', type: 'cannibals', count: 1 },
            
            // Step 3: (3,2,L) → (3,0,R) [2 cannibals cross]
            { action: 'add', type: 'cannibals', count: 2 },
            { action: 'cross' },
            { action: 'remove', type: 'cannibals', count: 2 },
            
            // Step 4: (3,0,R) → (3,1,L) [1 cannibal returns]
            { action: 'add', type: 'cannibals', count: 1 },
            { action: 'cross' },
            { action: 'remove', type: 'cannibals', count: 1 },
            
            // Step 5: (3,1,L) → (1,1,R) [2 missionaries cross]
            { action: 'add', type: 'missionaries', count: 2 },
            { action: 'cross' },
            { action: 'remove', type: 'missionaries', count: 2 },
            
            // Step 6: (1,1,R) → (2,2,L) [1 cannibal + 1 missionary return]
            { action: 'add', type: 'missionaries', count: 1 },
            { action: 'add', type: 'cannibals', count: 1 },
            { action: 'cross' },
            { action: 'remove', type: 'missionaries', count: 1 },
            { action: 'remove', type: 'cannibals', count: 1 },
            
            // Step 7: (2,2,L) → (0,2,R) [2 missionaries cross]
            { action: 'add', type: 'missionaries', count: 2 },
            { action: 'cross' },
            { action: 'remove', type: 'missionaries', count: 2 },
            
            // Step 8: (0,2,R) → (0,3,L) [1 cannibal returns]
            { action: 'add', type: 'cannibals', count: 1 },
            { action: 'cross' },
            { action: 'remove', type: 'cannibals', count: 1 },
            
            // Step 9: (0,3,L) → (0,1,R) [2 cannibals cross]
            { action: 'add', type: 'cannibals', count: 2 },
            { action: 'cross' },
            { action: 'remove', type: 'cannibals', count: 2 },
            
            // Step 10: (0,1,R) → (0,2,L) [1 cannibal returns]
            { action: 'add', type: 'cannibals', count: 1 },
            { action: 'cross' },
            { action: 'remove', type: 'cannibals', count: 1 },
            
            // Step 11: (0,2,L) → (0,0,R) [2 cannibals cross]
            { action: 'add', type: 'cannibals', count: 2 },
            { action: 'cross' },
            { action: 'remove', type: 'cannibals', count: 2 }
        ];

        this.currentStep = 0;
        this.isPlayingSolution = false;
        this.initializeElements();
        this.initializeEventListeners();
        this.render();
        this.boat.classList.add('left-side');
    }

    initializeElements() {
        // Get DOM elements
        this.leftBank = document.getElementById('leftBankPeople');
        this.rightBank = document.getElementById('rightBankPeople');
        this.boat = document.getElementById('boat');
        this.boatPeople = document.getElementById('boatPeople');
        this.status = document.getElementById('status');
        
        // Stats elements
        this.leftM = document.getElementById('leftM');
        this.leftC = document.getElementById('leftC');
        this.rightM = document.getElementById('rightM');
        this.rightC = document.getElementById('rightC');
        this.moveCount = document.getElementById('moveCount');
        this.invalidCount = document.getElementById('invalidCount');

        // Buttons
        this.addMButton = document.getElementById('addM');
        this.addCButton = document.getElementById('addC');
        this.removeMButton = document.getElementById('removeM');
        this.removeCButton = document.getElementById('removeC');
        this.crossButton = document.getElementById('crossRiver');
        this.resetButton = document.getElementById('reset');
    }

    initializeEventListeners() {
        this.addMButton.addEventListener('click', () => this.addToBoat('missionaries'));
        this.addCButton.addEventListener('click', () => this.addToBoat('cannibals'));
        this.removeMButton.addEventListener('click', () => this.removeFromBoat('missionaries'));
        this.removeCButton.addEventListener('click', () => this.removeFromBoat('cannibals'));
        this.crossButton.addEventListener('click', () => this.crossRiver());
        this.resetButton.addEventListener('click', () => this.resetPuzzle());
        document.getElementById('showSolution').addEventListener('click', () => this.playSolution());
    }

    addToBoat(type) {
        const currentBank = this.state[this.state.boatPosition];
        const boatTotal = this.state.boat.missionaries + this.state.boat.cannibals;

        if (boatTotal >= 2) {
            this.updateStatus('Boat is full!', 'warning');
            return;
        }

        if (currentBank[type] > 0) {
            currentBank[type]--;
            this.state.boat[type]++;
            this.render();
            this.updateButtons();
            
            // Add boarding animation
            const person = this.boatPeople.lastElementChild;
            person.classList.add('boarding');
            setTimeout(() => person.classList.remove('boarding'), 500);
        }
    }

    removeFromBoat(type) {
        if (this.state.boat[type] > 0) {
            this.state.boat[type]--;
            this.state[this.state.boatPosition][type]++;
            this.render();
            this.updateButtons();
            
            // Add boarding animation
            const bank = this.state.boatPosition === 'left' ? this.leftBank : this.rightBank;
            const person = bank.lastElementChild;
            person.classList.add('boarding');
            setTimeout(() => person.classList.remove('boarding'), 500);
        }
    }

    crossRiver() {
        if (!this.isValidMove()) return;

        const boat = document.querySelector('.boat');
        const isOnLeftBank = !boat.classList.contains('right-side');
        
        // Store current boat state before moving
        const boatState = {
            missionaries: this.state.boat.missionaries,
            cannibals: this.state.boat.cannibals
        };

        // Calculate new position
        const newPosition = isOnLeftBank ? 'right' : 'left';
        const targetBank = this.state[newPosition];
        
        // Check if move would be valid
        const newTargetM = targetBank.missionaries + boatState.missionaries;
        const newTargetC = targetBank.cannibals + boatState.cannibals;
        
        if (!this.isValidState(newTargetM, newTargetC)) {
            this.state.invalidAttempts++;
            this.updateStatus('Invalid move! Cannibals would outnumber missionaries!', 'error');
            return;
        }

        // Disable controls during animation
        this.disableControls();

        // Remove current position classes
        boat.classList.remove('left-side', 'right-side');
        
        // Add crossing animation
        if (isOnLeftBank) {
            boat.classList.add('crossing-right');
        } else {
            boat.classList.add('crossing-left');
        }

        // Don't update the state or render until animation completes
        setTimeout(() => {
            // Remove crossing animation
            boat.classList.remove('crossing-right', 'crossing-left');
            
            // Add new position class
            if (isOnLeftBank) {
                boat.classList.add('right-side');
            } else {
                boat.classList.add('left-side');
            }

            // Update the game state
            targetBank.missionaries += boatState.missionaries;
            targetBank.cannibals += boatState.cannibals;
            this.state.boat = { missionaries: 0, cannibals: 0 };
            this.state.boatPosition = newPosition;
            this.state.moves++;

            // Now render the new state
            this.render();
            
            // Check win condition
            this.checkWinCondition();

            // Re-enable controls if not playing solution
            if (!this.isPlayingSolution) {
                this.enableControls();
            }
        }, 1500); // Match the animation duration from CSS
    }

    isValidMove() {
        const boatTotal = this.state.boat.missionaries + this.state.boat.cannibals;
        
        if (boatTotal === 0) {
            this.updateStatus('Boat needs at least one person!', 'warning');
            return false;
        }

        return true;
    }

    isValidState(missionaries, cannibals) {
        // If there are no missionaries, cannibals can be any number
        if (missionaries === 0) return true;
        // If there are missionaries, they must not be outnumbered by cannibals
        return missionaries >= cannibals;
    }

    checkWinCondition() {
        if (this.state.right.missionaries === 3 && this.state.right.cannibals === 3) {
            this.updateStatus('Congratulations! You solved the puzzle!', 'success');
            this.disableControls();
        }
    }

    updateStatus(message, type = 'info') {
        this.status.textContent = message;
        this.status.className = `status ${type}`;
    }

    updateButtons() {
        const currentBank = this.state[this.state.boatPosition];
        const boatTotal = this.state.boat.missionaries + this.state.boat.cannibals;

        this.addMButton.disabled = currentBank.missionaries === 0 || boatTotal >= 2;
        this.addCButton.disabled = currentBank.cannibals === 0 || boatTotal >= 2;
        this.removeMButton.disabled = this.state.boat.missionaries === 0;
        this.removeCButton.disabled = this.state.boat.cannibals === 0;
    }

    disableControls() {
        this.addMButton.disabled = true;
        this.addCButton.disabled = true;
        this.removeMButton.disabled = true;
        this.removeCButton.disabled = true;
        this.crossButton.disabled = true;
        this.resetButton.disabled = true;
    }

    enableControls() {
        this.resetButton.disabled = false;
        this.updateButtons();
    }

    resetPuzzle() {
        this.state = {
            left: { missionaries: 3, cannibals: 3 },
            right: { missionaries: 0, cannibals: 0 },
            boat: { missionaries: 0, cannibals: 0 },
            boatPosition: 'left',
            moves: 0,
            invalidAttempts: 0
        };

        this.boat.classList.remove('crossing-right', 'crossing-left');
        this.updateStatus('Select passengers and cross the river...');
        this.render();
        
        this.enableControls();
    }

    async playSolution() {
        if (this.isPlayingSolution) return;
        
        this.isPlayingSolution = true;
        this.resetPuzzle();
        this.disableControls();
        document.getElementById('showSolution').disabled = true;

        while (this.currentStep < this.solution.length) {
            await this.playNextStep();
        }

        this.isPlayingSolution = false;
        document.getElementById('showSolution').disabled = false;
    }

    async playNextStep() {
        if (this.currentStep >= this.solution.length) {
            this.isPlayingSolution = false;
            this.updateStatus('Solution complete!');
            return;
        }

        const step = this.solution[this.currentStep];
        
        switch (step.action) {
            case 'add':
                for (let i = 0; i < step.count; i++) {
                    this.addToBoat(step.type);
                    await new Promise(resolve => setTimeout(resolve, 700));
                }
                break;
            case 'remove':
                for (let i = 0; i < step.count; i++) {
                    this.removeFromBoat(step.type);
                    await new Promise(resolve => setTimeout(resolve, 700));
                }
                break;
            case 'cross':
                await new Promise(resolve => {
                    this.crossRiver();
                    setTimeout(resolve, 2000); // Wait for crossing animation to complete
                });
                break;
        }

        this.currentStep++;
        // Add a small pause between steps
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    render() {
        // Update counters
        this.leftM.textContent = this.state.left.missionaries;
        this.leftC.textContent = this.state.left.cannibals;
        this.rightM.textContent = this.state.right.missionaries;
        this.rightC.textContent = this.state.right.cannibals;
        this.moveCount.textContent = this.state.moves;
        this.invalidCount.textContent = this.state.invalidAttempts;

        // Clear and render people on banks
        this.renderBank(this.leftBank, this.state.left);
        this.renderBank(this.rightBank, this.state.right);
        this.renderBoat();
        
        // Update button states
        this.updateButtons();
    }

    renderBank(bankElement, bankState) {
        bankElement.innerHTML = '';
        
        // Add missionaries
        for (let i = 0; i < bankState.missionaries; i++) {
            const person = document.createElement('div');
            person.className = 'person missionary';
            person.textContent = 'M';
            bankElement.appendChild(person);
        }
        
        // Add cannibals
        for (let i = 0; i < bankState.cannibals; i++) {
            const person = document.createElement('div');
            person.className = 'person cannibal';
            person.textContent = 'C';
            bankElement.appendChild(person);
        }
    }

    renderBoat() {
        this.boatPeople.innerHTML = '';
        
        // Add missionaries in boat
        for (let i = 0; i < this.state.boat.missionaries; i++) {
            const person = document.createElement('div');
            person.className = 'person missionary';
            person.textContent = 'M';
            this.boatPeople.appendChild(person);
        }
        
        // Add cannibals in boat
        for (let i = 0; i < this.state.boat.cannibals; i++) {
            const person = document.createElement('div');
            person.className = 'person cannibal';
            person.textContent = 'C';
            this.boatPeople.appendChild(person);
        }
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MissionariesCannibals();
}); 