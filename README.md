# Virtual Lab - Algorithm Visualizations

An interactive web-based platform for visualizing and learning algorithms.

## Current Visualizations

### Alpha-Beta Pruning
An interactive visualization of the Alpha-Beta Pruning algorithm, which is an optimization technique for the minimax algorithm used in game theory and artificial intelligence.

Features:
- Interactive tree generation with customizable depth and branching factor
- Step-by-step visualization of the algorithm
- Visual representation of alpha and beta values
- Node value editing
- Pruning visualization
- Autoplay functionality

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
├── alpha-beta-pruning/
│   ├── index.html
│   ├── script.js
│   └── styles.css
└── (other visualizations...) 