const sections = [
  {
    id: "tic-tac-toe",
    title: "TIC TAC TOE",
    desc: "Challenge yourself with questions about game theory, optimal strategies, and the mathematics behind this classic game!"
  },
  {
    id: "greedy-best-first-search",
    title: "GREEDY BEST FIRST SEARCH",
    desc: "Dive into heuristic-based search algorithms and discover how greedy strategies find solutions in complex problem spaces."
  },
  {
    id: "depth-first-search",
    title: "DEPTH FIRST SEARCH",
    desc: "Explore the recursive nature of DFS, its applications in maze solving, and graph traversal techniques."
  },
  {
    id: "missionaries-and-cannibals",
    title: "MISSIONARIES AND CANNIBALS",
    desc: "Test your problem-solving skills with this classic AI puzzle involving state space search and constraint handling."
  },
  {
    id: "alpha-beta-pruning",
    title: "ALPHA BETA PRUNING",
    desc: "Master the optimization technique that revolutionized game tree search algorithms and minimax strategy."
  },
  {
    id: "astar-search",
    title: "A* SEARCH",
    desc: "Understand the perfect blend of Dijkstra's algorithm and heuristic search that makes A* both optimal and efficient."
  },
  {
    "id": "constraint-satisfaction",
    "title": "CONSTRAINT SATISFACTION",
    "desc": "From map coloring to scheduling problems, learn how CSP algorithms solve complex real-world optimization challenges."
  },
  {
    "id": "wumpus-world",
    "title": "WUMPUS WORLD",
    "desc": "Navigate through this classic AI environment that tests logical reasoning, knowledge representation, and inference."
  },
  {
    "id": "uniform-cost-search",
    "title": "UNIFORM COST SEARCH",
    "desc": "Discover how this algorithm finds the lowest-cost path in weighted graphs and its relationship to Dijkstra's algorithm."
  },
  {
    id: "travelling-salesman",
    title: "TRAVELLING SALESMAN PROBLEM",
    desc: "Explore one of computer science's most famous NP-hard problems and the clever algorithms used to solve it."
  }
  
];

function renderSections(filter = "") {
  const container = document.getElementById("sections");
  const currentCards = container.children;
  
  // If there are existing cards, animate them out first
  if (currentCards.length > 0) {
    Array.from(currentCards).forEach(card => {
      card.classList.add('disappearing');
    });
    
    // Wait for disappear animation to complete
    setTimeout(() => {
      container.innerHTML = "";
      // Add new filtered cards
      addNewCards();
    }, 300); // Match the cardDisappear animation duration
  } else {
    // If no existing cards, add new ones immediately
    addNewCards();
  }
  
  function addNewCards() {
    sections
      .filter(sec => sec.title.toLowerCase().includes(filter.toLowerCase()))
      .forEach(sec => {
        const card = document.createElement("div");
        card.className = "section-card";
        card.onclick = () => {
          window.location.href = `quiz.html?topic=${sec.id}`;
        };
        card.innerHTML = `
          <div class="section-title">${sec.title}</div>
          <div class="section-content">
            <div class="section-desc">${sec.desc}</div>
            <button class="section-btn">Take the Quiz!</button>
          </div>
        `;
        container.appendChild(card);
      });
  }
}

document.getElementById("searchInput").addEventListener("input", function() {
  renderSections(this.value);
});

function clearSearch() {
  document.getElementById("searchInput").value = "";
  renderSections();
}

renderSections();
