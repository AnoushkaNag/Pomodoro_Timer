// script.js
// DOM Elements
const timerDisplay    = document.getElementById('timer');
const modeDisplay     = document.getElementById('mode');
const startBtn        = document.getElementById('start-btn');
const pauseBtn        = document.getElementById('pause-btn');
const resetBtn        = document.getElementById('reset-btn');
const cycleInfo       = document.getElementById('cycle-info');
const themeToggle     = document.getElementById('theme-toggle');
const alertSound      = document.getElementById('alert-sound');

const taskForm        = document.getElementById('task-form');
const taskInput       = document.getElementById('task-input');
const taskList        = document.getElementById('task-list');
const resetTasksBtn   = document.getElementById('reset-tasks-btn');

const xpDisplay       = document.getElementById('xp');
const levelDisplay    = document.getElementById('level');
const quoteDisplay    = document.getElementById('quote');

const ctx             = document.getElementById('session-graph').getContext('2d');

// Timer Settings
let pomodoroDuration  = 25 * 60;
let shortBreak        = 5 * 60;
let longBreak         = 15 * 60;
let timer             = pomodoroDuration;
let interval          = null;
let mode              = 'Pomodoro';
let cycle             = 1;
let isRunning         = false;
let completedPomodoros= 0;

// Gamification
let xp    = 0;
let level = 1;
const quotes = [
  "Stay focused, stay strong.",
  "One Pomodoro at a time.",
  "Progress over perfection.",
  "Every tick is a step forward.",
  "Keep going, you're doing great."
];

// --- Session History Storage & Chart.js Setup ---
function loadSessions() {
  return JSON.parse(localStorage.getItem('sessions') || '[]');
}
function saveSessionEntry() {
  const sessions = loadSessions();
  sessions.push({
    time: new Date().toLocaleTimeString(),
    count: completedPomodoros
  });
  localStorage.setItem('sessions', JSON.stringify(sessions));
}
let sessionChart = null;
function updateSessionGraph() {
  const sessions = loadSessions();
  const labels = sessions.map(s => s.time);
  const data   = sessions.map(s => s.count);
  if (sessionChart) sessionChart.destroy();
  sessionChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Completed Pomodoros',
        data,
        fill: false,
        tension: 0.3
      }]
    },
    options: {
      scales: {
        x: { title: { display: true, text: 'Time' } },
        y: { title: { display: true, text: 'Sessions' }, beginAtZero: true }
      }
    }
  });
}

// ------------------- Timer Logic -------------------
function updateTimerDisplay() {
  const mins = String(Math.floor(timer / 60)).padStart(2, '0');
  const secs = String(timer % 60).padStart(2, '0');
  timerDisplay.textContent = `${mins}:${secs}`;
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  interval = setInterval(() => {
    timer--;
    updateTimerDisplay();
    if (timer <= 0) {
      clearInterval(interval);
      isRunning = false;
      alertSound.play();
      handleSessionEnd();
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(interval);
  isRunning = false;
}

function resetTimer() {
  clearInterval(interval);
  isRunning = false;
  timer = getCurrentDuration();
  updateTimerDisplay();
}

function handleSessionEnd() {
  if (mode === 'Pomodoro') {
    completedPomodoros++;
    xp += 25;
    if (xp >= level * 100) {
      xp = 0;
      level++;
    }
    saveSessionEntry();
    updateSessionGraph();
    updateGamification();
    if (completedPomodoros % 4 === 0) {
      switchMode('Long Break');
    } else {
      switchMode('Short Break');
    }
  } else {
    switchMode('Pomodoro');
    cycle++;
  }
}

function switchMode(newMode) {
  mode = newMode;
  modeDisplay.textContent = newMode;
  timer = getCurrentDuration();
  updateTimerDisplay();
  cycleInfo.textContent = `Cycle: ${cycle} of 4`;
}

function getCurrentDuration() {
  switch (mode) {
    case 'Pomodoro':   return pomodoroDuration;
    case 'Short Break':return shortBreak;
    case 'Long Break': return longBreak;
  }
}

// ------------------- Gamification -------------------
function updateGamification() {
  xpDisplay.textContent = xp;
  levelDisplay.textContent = level;
  quoteDisplay.textContent = quotes[Math.floor(Math.random() * quotes.length)];
  localStorage.setItem('xp', xp);
  localStorage.setItem('level', level);
}

// ------------------- Task Management -------------------
taskForm.addEventListener('submit', e => {
  e.preventDefault();
  const task = taskInput.value.trim();
  if (!task) return;
  const li = document.createElement('li');
  li.innerHTML = `${task} <button onclick="this.parentElement.remove()">✓</button>`;
  taskList.appendChild(li);
  saveTasks();
  taskInput.value = '';
});

resetTasksBtn.addEventListener('click', () => {
  if (confirm('Clear all tasks?')) {
    localStorage.removeItem('tasks');
    taskList.innerHTML = '';
  }
});

function saveTasks() {
  const tasks = Array.from(taskList.children)
    .map(li => li.textContent.replace('✓','').trim());
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  taskList.innerHTML = '';
  tasks.forEach(task => {
    const li = document.createElement('li');
    li.innerHTML = `${task} <button onclick="this.parentElement.remove()">✓</button>`;
    taskList.appendChild(li);
  });
}

// ------------------- Theme Toggle + Save -------------------
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}
themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'light' ? 'dark' : 'light');
});

// ------------------- Initialization -------------------
function init() {
  updateTimerDisplay();
  modeDisplay.textContent = mode;
  cycleInfo.textContent = `Cycle: ${cycle} of 4`;

  xp = parseInt(localStorage.getItem('xp')) || 0;
  level = parseInt(localStorage.getItem('level')) || 1;
  updateGamification();

  loadTasks();
  const savedTheme = localStorage.getItem('theme') || 'dark';
  applyTheme(savedTheme);

  // Chart
  updateSessionGraph();

  // Button listeners
  startBtn.addEventListener('click', startTimer);
  pauseBtn.addEventListener('click', pauseTimer);
  resetBtn.addEventListener('click', resetTimer);
}

init();
