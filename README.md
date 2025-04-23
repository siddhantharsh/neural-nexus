# Neural Nexus - AI Algorithm Visualizations

An interactive web-based platform for visualizing and learning various AI algorithms through hands-on experimentation and step-by-step visualization. This project provides a comprehensive collection of AI algorithm visualizations, from basic search algorithms to complex problem-solving techniques.

For live demo, go to https://neuralnexuslab.netlify.app/

## Table of Contents
1. [Graph-Based AI Search Algorithms](#1-graph-based-ai-search-algorithms)
2. [Game Theory and Problem Solving](#2-game-theory-and-problem-solving)
3. [Optimization Problems](#3-optimization-problems)
4. [Knowledge Representation](#4-knowledge-representation)
5. [Getting Started](#getting-started)
6. [Project Structure](#project-structure)
7. [Features](#features)
8. [Contributing](#contributing)
9. [License](#license)

## 1. Graph-Based AI Search Algorithms

A collection of powerful search algorithms that form the backbone of artificial intelligence and problem-solving.

### 1.1 Alpha-Beta Pruning
An optimization technique for the minimax algorithm used in game theory and artificial intelligence.

Features:
- Interactive tree generation with customizable depth and branching factor
- Step-by-step visualization of the algorithm
- Visual representation of alpha and beta values
- Node value editing
- Pruning visualization
- Autoplay functionality

### 1.2 Greedy Best-First Search (GBFS)
A pathfinding algorithm that uses heuristics to find the most promising path to the goal.

Features:
- Interactive grid-based visualization
- Customizable start and goal positions
- Obstacle placement
- Step-by-step pathfinding visualization
- Heuristic function demonstration
- Path cost calculation

### 1.3 Depth-First Search (DFS)
A graph traversal algorithm that explores as far as possible along each branch.

Features:
- Interactive graph visualization
- Customizable graph structure
- Step-by-step traversal visualization
- Node highlighting
- Path tracking
- Backtracking visualization

### 1.4 A* Search
An informed search algorithm that finds the shortest path using heuristics.

Features:
- Interactive grid-based visualization
- Customizable start and goal positions
- Obstacle placement
- Heuristic function visualization
- Path cost calculation
- Open/Closed set visualization
- Pathfinder demo integration

### 1.5 Uniform Cost Search
A search algorithm that finds the path with the lowest cumulative cost.

Features:
- Interactive grid-based visualization
- Customizable node costs
- Step-by-step cost calculation
- Path optimization visualization
- Cost matrix display
- Optimal path highlighting

## 2. Game Theory and Problem Solving

### 2.1 Tic-Tac-Toe with AI
A classic game implementation showcasing minimax algorithm in practice.

Features:
- Player vs AI gameplay
- Interactive game board
- AI difficulty levels
- Move highlighting
- Game state visualization
- Win/Draw detection
- Score tracking
- Undo functionality

### 2.2 Missionaries and Cannibals
A classic state space problem solved using search algorithms.

Features:
- Interactive state space visualization
- Step-by-step solution demonstration
- State transition visualization
- Valid move highlighting
- Solution path tracking
- Problem constraints display
- Multiple solution finding

## 3. Optimization Problems

### 3.1 Traveling Salesman Problem
An optimization problem to find the shortest possible route.

Features:
- Interactive city placement
- Multiple algorithm implementations
- Step-by-step solution visualization
- Cost calculation
- Route optimization
- Performance comparison
- Customizable city count
- Distance matrix visualization

### 3.2 Constraint Satisfaction (Room Coloring)
Solving problems by finding values that satisfy all constraints.

Features:
- Interactive room layout
- Constraint visualization
- Solution space exploration
- Backtracking demonstration
- Valid assignment checking
- Multiple solution finding
- Customizable room connections
- Color palette selection

## 4. Knowledge Representation

### 4.1 Wumpus World
A knowledge representation and reasoning problem in AI.

Features:
- Interactive cave exploration
- Knowledge base visualization
- Logical reasoning demonstration
- Agent perception simulation
- Decision making visualization
- Game state tracking
- Multiple cave layouts
- Risk assessment visualization

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
├── script.js
├── resources/
│   ├── section1.mp4
│   ├── section2.mp4
│   └── ai logo.png
├── alpha-beta-pruning/
├── gbfs-demo/
├── dfs-demo/
├── a star algorithm/
├── pathfinder/
├── Uniform Cost Search/
├── tic-tac-toe/
├── missionaries-cannibals/
├── wumpus-world/
├── Traveling salesman problem/
└── room-coloring/
```

## Features Common to All Visualizations

- Intuitive user interface
- Interactive controls
- Step-by-step execution
- Visual feedback
- Educational information panels
- Responsive design
- Dark/Light mode support
- Mobile-friendly interface
- Real-time algorithm visualization
- Customizable parameters
- Navigation buttons for easy access
- Font Awesome icons integration
- Consistent styling across all demos
- Error handling and user feedback
- Performance optimization
- Cross-browser compatibility

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. When contributing, please:

1. Fork the repository
2. Create a new branch for your feature
3. Make your changes
4. Submit a pull request with a clear description of your changes

## License

This project is licensed under the MIT License - see the LICENSE file for details.
