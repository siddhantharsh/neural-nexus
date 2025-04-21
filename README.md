# Virtual Lab - Algorithm Visualizations

An interactive web-based platform for visualizing and learning various algorithms through hands-on experimentation and step-by-step visualization.

## Current Visualizations

### 1. Alpha-Beta Pruning
An optimization technique for the minimax algorithm used in game theory and artificial intelligence.

Features:
- Interactive tree generation with customizable depth and branching factor
- Step-by-step visualization of the algorithm
- Visual representation of alpha and beta values
- Node value editing
- Pruning visualization
- Autoplay functionality

### 2. Greedy Best-First Search (GBFS)
A pathfinding algorithm that uses heuristics to find the most promising path to the goal.

Features:
- Interactive grid-based visualization
- Customizable start and goal positions
- Obstacle placement
- Step-by-step pathfinding visualization
- Heuristic function demonstration
- Path cost calculation

### 3. Tic-Tac-Toe with AI
A classic game implementation showcasing minimax algorithm in practice.

Features:
- Player vs AI gameplay
- Interactive game board
- AI difficulty levels
- Move highlighting
- Game state visualization
- Win/Draw detection

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Local development server (e.g., Live Server for VS Code)

### Running Locally
1. Clone this repository
```bash
git clone https://github.com/yourusername/virtual-lab.git
```

2. Navigate to the project directory
```bash
cd virtual-lab
```

3. Start a local development server
- If using VS Code with Live Server extension:
  - Right-click on `index.html`
  - Select "Open with Live Server"
- Or use any other local development server of your choice

4. Open your browser and navigate to the local server address (typically `http://localhost:5500`)

## Project Structure
```
virtual-lab/
├── README.md
├── index.html
├── styles.css
├── alpha-beta-pruning/
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── gbfs-demo/
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── tic-tac-toe/
│   ├── index.html
│   ├── script.js
│   └── styles.css
└── assets/
    └── images/
```

## Features Common to All Visualizations

- Intuitive user interface
- Interactive controls
- Step-by-step execution
- Visual feedback
- Educational information panels
- Responsive design
- Dark/Light mode support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.