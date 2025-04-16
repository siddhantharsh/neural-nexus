class TicTacToe {
    constructor() {
        this.board = document.getElementById("board");
        this.statusText = document.getElementById("statusText");
        this.restartBtn = document.getElementById("restartBtn");
        this.undoBtn = document.getElementById("undoBtn");
        this.playerScoreSpan = document.getElementById("playerScore");
        this.aiScoreSpan = document.getElementById("aiScore");
        
        this.cells = [];
        this.moveHistory = [];
        this.playerScore = 0;
        this.aiScore = 0;
        
        this.setupGame();
    }

    setupGame() {
        this.currentPlayer = "X";
        this.gameOver = false;
        this.cells = Array(9).fill("");
        this.moveHistory = [];
        
        this.createBoard();
        this.setupEventListeners();
        this.updateStatus();
        this.undoBtn.disabled = true;
    }

    createBoard() {
        this.board.innerHTML = "";
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.addEventListener("click", () => this.handleMove(i));
            this.board.appendChild(cell);
        }
    }

    setupEventListeners() {
        this.restartBtn.addEventListener("click", () => this.setupGame());
        this.undoBtn.addEventListener("click", () => this.undoMove());
    }

    handleMove(index) {
        if (this.cells[index] || this.gameOver) return;

        // Player's move
        this.makeMove(index);
        
        // AI's move
        if (!this.gameOver) {
            setTimeout(() => {
                const aiMove = this.getBestMove();
                if (aiMove !== -1) {
                    this.makeMove(aiMove);
                }
            }, 500);
        }
    }

    makeMove(index) {
        if (this.cells[index] || this.gameOver) return;

        this.cells[index] = this.currentPlayer;
        this.moveHistory.push(index);
        
        const cell = this.board.children[index];
        cell.textContent = this.currentPlayer;
        cell.classList.add(this.currentPlayer.toLowerCase());
        
        if (this.checkWinner(this.currentPlayer)) {
            this.gameOver = true;
            this.highlightWinningCells();
            if (this.currentPlayer === "X") {
                this.playerScore++;
                this.playerScoreSpan.textContent = this.playerScore;
            } else {
                this.aiScore++;
                this.aiScoreSpan.textContent = this.aiScore;
            }
        } else if (!this.cells.includes("")) {
            this.gameOver = true;
        }

        this.currentPlayer = this.currentPlayer === "X" ? "O" : "X";
        this.updateStatus();
        this.undoBtn.disabled = this.currentPlayer === "O" || this.gameOver;
    }

    undoMove() {
        if (this.moveHistory.length < 2 || this.gameOver) return;
        
        // Undo both AI's and player's moves
        for (let i = 0; i < 2; i++) {
            const lastMove = this.moveHistory.pop();
            this.cells[lastMove] = "";
            const cell = this.board.children[lastMove];
            cell.textContent = "";
            cell.classList.remove("x", "o", "winner");
        }
        
        this.gameOver = false;
        this.currentPlayer = "X";
        this.updateStatus();
        this.undoBtn.disabled = this.moveHistory.length < 2;
    }

    getBestMove() {
        const availableMoves = this.cells.reduce((moves, cell, index) => {
            if (cell === "") moves.push(index);
            return moves;
        }, []);

        // Try to win
        for (const move of availableMoves) {
            this.cells[move] = "O";
            if (this.checkWinner("O")) {
                this.cells[move] = "";
                return move;
            }
            this.cells[move] = "";
        }

        // Block player's winning move
        for (const move of availableMoves) {
            this.cells[move] = "X";
            if (this.checkWinner("X")) {
                this.cells[move] = "";
                return move;
            }
            this.cells[move] = "";
        }

        // Take center if available
        if (availableMoves.includes(4)) return 4;

        // Take corners
        const corners = [0, 2, 6, 8].filter(corner => availableMoves.includes(corner));
        if (corners.length > 0) {
            return corners[Math.floor(Math.random() * corners.length)];
        }

        // Take any available move
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    checkWinner(player) {
        const winPatterns = [
            [0,1,2], [3,4,5], [6,7,8],
            [0,3,6], [1,4,7], [2,5,8],
            [0,4,8], [2,4,6]
        ];
        return winPatterns.some(pattern =>
            pattern.every(index => this.cells[index] === player)
        );
    }

    highlightWinningCells() {
        const winPatterns = [
            [0,1,2], [3,4,5], [6,7,8],
            [0,3,6], [1,4,7], [2,5,8],
            [0,4,8], [2,4,6]
        ];
        
        const winningPattern = winPatterns.find(pattern =>
            pattern.every(index => this.cells[index] === this.currentPlayer)
        );

        if (winningPattern) {
            winningPattern.forEach(index => {
                this.board.children[index].classList.add("winner");
            });
        }
    }

    updateStatus() {
        if (this.gameOver) {
            if (this.checkWinner("X")) {
                this.statusText.textContent = "You win! 🎉";
            } else if (this.checkWinner("O")) {
                this.statusText.textContent = "AI wins! 🤖";
            } else {
                this.statusText.textContent = "It's a draw! 🤝";
            }
        } else {
            this.statusText.textContent = this.currentPlayer === "X" ? 
                "Your turn" : "AI is thinking...";
        }
    }
}

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
});
