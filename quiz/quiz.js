const urlParams = new URLSearchParams(window.location.search);
const topic = urlParams.get('topic');
const topicTitles = {
  "tic-tac-toe": "TIC-TAC-TOE",
  "greedy-best-first-search": "GREEDY BEST FIRST SEARCH",
  "depth-first-search": "DEPTH FIRST SEARCH",
  "missionaries-and-cannibals": "MISSIONARIES AND CANNIBALS",
  "alpha-beta-pruning": "ALPHA BETA PRUNING",
  "astar-search": "A* SEARCH",
  "constraint-satisfaction":"CONSTRAINT SATISFACTION",
  "travelling-salesman":"TRAVELLING SALESMAN PROBLEM",
  "wumpus-world":"WUMPUS WORLD",
  "uniform-cost-search":"UNIFORM COST SEARCH"
};

let questions = [];
let current = 0;
let selected = [];
let score = 0;
let timer;
let timeLeft = 120; // 2 minutes

// Search functionality
const searchInput = document.querySelector('.search-input');
const recentSearchesList = document.getElementById('recent-searches');

// Load recent searches from localStorage
let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function startTimer() {
  updateTimer();
  timer = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      clearInterval(timer);
      finishQuiz();
    }
  }, 1000);
}

function updateTimer() {
  const min = Math.floor(timeLeft / 60);
  const sec = timeLeft % 60;
  const timerElem = document.getElementById("timer");
  if (timerElem) {
    timerElem.textContent = `Time Left: ${min}:${sec.toString().padStart(2, '0')}`;
  }
}

function loadQuestions() {
  fetch('questions.json')
    .then(res => res.json())
    .then(data => {
      if (!data[topic]) {
        document.getElementById("quizContainer").innerHTML = "<h2>Invalid topic!</h2>";
        return;
      }
      questions = shuffle([...data[topic]]).slice(0, 5);
      selected = Array(questions.length).fill(null);
      renderQuiz();
      startTimer();
    });
}

function renderSidebar(showStatus = false) {
  let sidebar = `<div class="score-box" id="scoreBox" style="display:none"></div>
    <div class="sidebar-questions">`;
  for (let i = 0; i < questions.length; i++) {
    let status = "";
    let icon = "";
    if (showStatus && selected[i] !== null) {
      if (selected[i] === questions[i].answer) {
        status = "correct";
        icon = "✔️";
      } else {
        status = "incorrect";
        icon = "❌";
      }
    } else if (i === current && !showStatus) {
      status = "active";
    } else {
      status = "disabled";
    }
    sidebar += `<div class="sidebar-question ${status}">
      <span class="icon">${icon}</span>Question ${i + 1}
    </div>`;
  }
  sidebar += `</div>`;
  return sidebar;
}

function renderQuiz(isNavigating = false) {
  const q = questions[current];
  let sidebar = renderSidebar();

  let percent = Math.round(((current + 1) / questions.length) * 100);

  let content = `
    <div class="quiz-card">
      <div class="quiz-title">${topicTitles[topic] || "Quiz"}</div>
      <div class="progress-bar">
        <div class="progress-bar-inner" style="width:${percent}%"></div>
      </div>
      <div class="question-number">Question ${current + 1} / ${questions.length}</div>
      <div class="question-text">${q.question}</div>
      <ul class="options-list${isNavigating ? ' new-question' : ''}">
        ${q.options.map((opt, i) => `
          <li>
            <button class="option-btn${selected[current] === i ? " selected" : ""}" onclick="selectOption(${i})">${opt}</button>
          </li>
        `).join('')}
      </ul>
      <div class="quiz-nav">
        ${current > 0 ? `<button class="quiz-btn secondary" onclick="prevQuestion()">Previous</button>` : ""}
        <button class="quiz-btn primary" onclick="nextQuestion()">${current === questions.length - 1 ? "Submit" : "Next"}</button>
      </div>
      <div class="timer" id="timer"></div>
    </div>
  `;

  const container = document.getElementById("quizContainer");
  container.innerHTML = `
    <div class="quiz-main-layout${isNavigating ? ' navigating' : ''}">
      ${content}
      <div class="quiz-sidebar">${sidebar}</div>
    </div>
  `;
  updateTimer();
}

function selectOption(i) {
  // Don't do anything if selecting the same option
  if (selected[current] === i) return;

  const optionsList = document.querySelector('.options-list');
  const options = optionsList.querySelectorAll('.option-btn');
  
  // If there was a previously selected option
  if (selected[current] !== null) {
    const prevSelected = options[selected[current]];
    prevSelected.classList.remove('selected');
    prevSelected.classList.add('deselecting');
    
    // Update the selection immediately but let CSS handle the animation
    selected[current] = i;
    options[i].classList.add('selected');
    
    // Remove the deselecting class after animation completes
    setTimeout(() => {
      prevSelected.classList.remove('deselecting');
    }, 400);
  } else {
    // If no previous selection, update immediately
    selected[current] = i;
    options[i].classList.add('selected');
  }
}

function prevQuestion() {
  if (current > 0) {
    current--;
    renderQuiz(true);
  }
}

function nextQuestion() {
  if (selected[current] === null) {
    alert("Please select an option!");
    return;
  }
  if (current < questions.length - 1) {
    current++;
    renderQuiz(true);
  } else {
    finishQuiz();
  }
}

function getScoreComment(percent) {
  if (percent === 100) return "Excellent! Perfect score!";
  if (percent >= 80) return "Great job!";
  if (percent >= 60) return "Good effort!";
  if (percent >= 40) return "Keep practicing!";
  return "Try again!";
}

function finishQuiz() {
  clearInterval(timer);
  score = 0;
  for (let i = 0; i < questions.length; i++) {
    if (selected[i] === questions[i].answer) score++;
  }
  let percent = Math.round((score / questions.length) * 100);
  let comment = getScoreComment(percent);
  let sidebar = renderSidebar(true); // pass true to show correct/incorrect
  let html = `
    <div class="quiz-card">
      <div class="quiz-title">${topicTitles[topic]}</div>
      <div class="score-box" style="display:block;color:#ffffff;">
        ${percent}%<br>
        <span style="font-size:0.7em;font-weight:400;color:#ffffff;">You got ${score} out of ${questions.length} correct</span>
        <br><span style="font-size:1em;font-weight:600;color:#ffffff;">${comment}</span>
      </div>
      <button class="quiz-btn primary" onclick="reviewQuestions()">Review Questions</button>
    </div>
  `;
  document.getElementById("quizContainer").innerHTML = `
    <div class="quiz-main-layout">
      ${html}
      <div class="quiz-sidebar">${sidebar}
        <canvas id="resultChart" width="180" height="180" style="margin-top:30px;"></canvas>
      </div>
    </div>
  `;
  drawResultChart(score, questions.length - score);
}

function reviewQuestions() {
  let sidebar = renderSidebar(true);
  let html = `
    <div class="quiz-card">
      <div class="quiz-title">${topicTitles[topic]}</div>
      ${questions.map((q, i) => `
        <div class="review-question" style="background:#23487a;color:#fff;border-radius:0.5em;padding:1.2em;margin-bottom:2em;display:flex;align-items:flex-start;gap:2em;">
          <div style="flex:1;">
            <div style="background:#fff;color:#222;padding:1em 1.2em;border-radius:0.7em 0.7em 0.7em 0.7em;box-shadow:6px 6px 0 #2222;">
              <b>Q${i+1}. ${q.question}</b>
            </div>
            <div style="margin-top:1.2em;">
              <div><b>Your answer:</b> ${selected[i] !== null ? q.options[selected[i]] : "No answer."}</div>
              <div><b>Correct answer:</b> ${q.options[q.answer]}</div>
              <div style="margin-top:0.7em;"><b>Explanation:</b> ${q.explanation}</div>
            </div>
          </div>
        </div>
      `).join('')}
      <button class="quiz-btn primary" onclick="window.location='index.html'">Go Home</button>
    </div>
  `;
  document.getElementById("quizContainer").innerHTML = `
    <div class="quiz-main-layout">
      ${html}
      <div class="quiz-sidebar">${sidebar}
        <canvas id="resultChart" width="180" height="180" style="margin-top:30px;"></canvas>
      </div>
    </div>
  `;
  drawResultChart(score, questions.length - score);
}

window.showExplanation = function(idx, btn) {
  btn.nextElementSibling.style.display = "block";
  btn.style.display = "none";
};

function drawResultChart(correct, incorrect) {
  const canvas = document.getElementById('resultChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const total = correct + incorrect;
  const correctAngle = (correct / total) * 2 * Math.PI;
  
  // Animation variables
  let currentAngle = 0;
  const animationDuration = 2000; // 2 seconds
  const startTime = performance.now();
  
  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / animationDuration, 1);
    
    // Easing function for smooth animation
    const easeOut = t => 1 - Math.pow(1 - t, 3);
    const easedProgress = easeOut(progress);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Add shadow to entire chart
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 5;
    
    // Draw incorrect (red) portion
    ctx.beginPath();
    ctx.moveTo(90, 90);
    ctx.arc(90, 90, 80, -0.5 * Math.PI, (2 * Math.PI * easedProgress) - 0.5 * Math.PI, false);
    ctx.closePath();
    ctx.fillStyle = "rgba(220, 53, 69, 0.8)";
    ctx.fill();
    
    // Draw correct (green) portion with glow
    ctx.beginPath();
    ctx.moveTo(90, 90);
    ctx.arc(90, 90, 80, -0.5 * Math.PI, (correctAngle * easedProgress) - 0.5 * Math.PI, false);
    ctx.closePath();
    ctx.fillStyle = "rgba(40, 167, 69, 0.9)";
    ctx.shadowColor = 'rgba(40, 167, 69, 0.5)';
    ctx.shadowBlur = 20;
    ctx.fill();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    
    // Add score text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px Inter";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.round((correct/total) * 100)}%`, 90, 90);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  
  requestAnimationFrame(animate);
}

window.nextQuestion = nextQuestion;

window.onload = loadQuestions;

function updateRecentSearches() {
    recentSearchesList.innerHTML = '';
    recentSearches.slice(0, 5).forEach(search => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `?topic=${search.topic}`;
        a.textContent = search.name;
        li.appendChild(a);
        recentSearchesList.appendChild(li);
    });
}

// Update recent searches when a topic is selected
function addToRecentSearches(topic, name) {
    // Remove if already exists
    recentSearches = recentSearches.filter(s => s.topic !== topic);
    // Add to beginning
    recentSearches.unshift({ topic, name });
    // Keep only last 5 searches
    recentSearches = recentSearches.slice(0, 5);
    // Save to localStorage
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    // Update UI
    updateRecentSearches();
}

// Handle search input
searchInput.addEventListener('input', (e) => {
    const value = e.target.value.toLowerCase();
    const allTopics = Object.keys(topicTitles);
    const filteredTopics = allTopics.filter(topic => 
        topicTitles[topic].toLowerCase().includes(value)
    );
    
    // Update dropdown with filtered results
    const topSearchesSection = document.querySelector('.search-section:first-child ul');
    topSearchesSection.innerHTML = '';
    
    filteredTopics.forEach(topic => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `?topic=${topic}`;
        a.textContent = topicTitles[topic];
        li.appendChild(a);
        topSearchesSection.appendChild(li);
    });
});

// Initialize recent searches
updateRecentSearches();
