const sections = [
  {
    id: "tic-tac-toe",
    title: "TIC TAC TOE",
    desc: "Lets see how much you know about the game"
  },
  {
    id: "greedy-best-first-search",
    title: "GREEDY BEST FIRST SEARCH",
    desc: "Test your knowledge of this search algorithm"
  },
  {
    id: "depth-first-search",
    title: "DEPTH FIRST SEARCH",
    desc: "How well do you know DFS?"
  },
  {
    id: "missionaries-and-cannibals",
    title: "MISSIONARIES AND CANNIBALS",
    desc: "Quiz on the classic AI problem"
  },
  {
    id: "alpha-beta-pruning",
    title: "ALPHA BETA PRUNING",
    desc: "Test your understanding of pruning"
  },
  {
    id: "astar-search",
    title: "A* SEARCH",
    desc: "How well do you know A* search?"
  },
  {
    "id": "constraint-satisfaction",
    "title": "CONSTRAINT SATISFACTION",
    "desc": "Test your understanding of constraint satisfaction problems like room coloring!"
  },
  {
    "id": "wumpus-world",
    "title": "WUMPUS WORLD",
    "desc": "Explore your knowledge about the Wumpus World and its percepts!"
  },
  {
    "id": "uniform-cost-search",
    "title": "UNIFORM COST SEARCH",
    "desc": "Challenge yourself on the concepts of cost-based searching!"
  },
  {
    "id": "travelling-salesman",
    "title": "TRAVELLING SALESMAN PROBLEM",
    "desc": "See how much you know about the classic Travelling Salesman Problem!"
  }
  
];

function renderSections(filter = "") {
  const container = document.getElementById("sections");
  container.innerHTML = "";
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
        <div class="section-desc">${sec.desc}</div>
        <button class="section-btn">Take the Quiz!</button>
      `;
      container.appendChild(card);
    });
}

document.getElementById("searchInput").addEventListener("input", function() {
  renderSections(this.value);
});

function clearSearch() {
  document.getElementById("searchInput").value = "";
  renderSections();
}

renderSections();
