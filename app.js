const TASKS_KEY = 'ubiquitous-umbrella.tasks.v1';
const WEATHER_KEY = 'ubiquitous-umbrella.weather.v1';
const form = document.querySelector('#task-form');
const input = document.querySelector('#task-input');
const categoryInput = document.querySelector('#task-category');
const list = document.querySelector('#task-list');
const emptyState = document.querySelector('#empty-state');
const progressCopy = document.querySelector('#progress-copy');
const progressFill = document.querySelector('#progress-fill');
const remainingCopy = document.querySelector('#remaining-copy');
const clearDoneButton = document.querySelector('#clear-done');
const forecastMessage = document.querySelector('#forecast-message');
const progressNote = document.querySelector('#progress-note');
const weatherButtons = [...document.querySelectorAll('.weather-choice')];
const suggestionButtons = [...document.querySelectorAll('[data-suggestion]')];

let tasks = loadTasks();
let selectedWeather = loadWeather();

const weatherNotes = {
  sunny: 'Let the light in. Follow the thing that feels bright.',
  cloudy: 'You can move gently. One clear patch is enough.',
  rainy: 'Make a softer plan. Rest is part of the forecast.',
  windy: 'Let the noise pass through. Keep one small anchor.',
};

function todayParts() {
  const now = new Date();
  const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(now);
  const month = new Intl.DateTimeFormat(undefined, { month: 'long' }).format(now);
  const day = new Intl.DateTimeFormat(undefined, { day: '2-digit' }).format(now);
  const year = new Intl.DateTimeFormat(undefined, { year: 'numeric' }).format(now);
  return { weekday, month, day, year };
}

function setDates() {
  const { weekday, month, day, year } = todayParts();
  const dateLine = `${weekday.toUpperCase()}, ${month.toUpperCase()} ${day}`;
  document.querySelector('#sidebar-date').innerHTML = `${weekday.toUpperCase()}<br>${month.toUpperCase()} ${day}`;
  document.querySelector('#date-year').textContent = year;
  document.querySelector('#mobile-date').textContent = `${weekday.slice(0, 3).toUpperCase()} · ${month.slice(0, 3).toUpperCase()} ${day}`;
  document.querySelector('.section-heading .micro-label').textContent = dateLine;
}

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(TASKS_KEY) || '[]');
    return Array.isArray(saved)
      ? saved.filter(task => task && typeof task.id === 'string' && typeof task.text === 'string' && typeof task.done === 'boolean')
        .map(task => ({ ...task, category: ['Focus', 'Life', 'Joy'].includes(task.category) ? task.category : 'Focus' }))
      : [];
  } catch {
    return [];
  }
}

function loadWeather() {
  try {
    const saved = localStorage.getItem(WEATHER_KEY);
    return ['sunny', 'cloudy', 'rainy', 'windy'].includes(saved) ? saved : '';
  } catch {
    return '';
  }
}

function persist(key, value) {
  try { localStorage.setItem(key, value); } catch { /* The planner still works if browser storage is unavailable. */ }
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function setWeather(weather) {
  selectedWeather = weather;
  persist(WEATHER_KEY, weather);
  weatherButtons.forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.weather === weather));
  });
  forecastMessage.textContent = weather ? weatherNotes[weather] : 'Every forecast belongs here. Start wherever you are.';
}

function render() {
  list.replaceChildren();
  emptyState.hidden = tasks.length > 0;
  const complete = tasks.filter(task => task.done).length;
  const remaining = tasks.length - complete;
  progressCopy.textContent = `${complete} / ${tasks.length}`;
  progressFill.style.width = `${tasks.length ? (complete / tasks.length) * 100 : 0}%`;
  remainingCopy.textContent = tasks.length === 0
    ? 'Nothing on the horizon yet'
    : remaining === 0 ? 'The whole list, weathered beautifully.' : `${remaining} ${remaining === 1 ? 'thing' : 'things'} still in the air`;
  clearDoneButton.hidden = complete === 0;
  progressNote.textContent = remaining === 0 && tasks.length > 0
    ? 'Look at you. Take a breath and let that land.'
    : complete > 0 ? 'Every checked-off thing is a little patch of blue.' : 'You don’t have to do it all. Just the next thing.';

  for (const task of tasks) {
    const item = document.createElement('li');
    item.className = `task-item${task.done ? ' done' : ''}`;

    const check = document.createElement('button');
    check.className = 'check';
    check.type = 'button';
    check.setAttribute('aria-label', `${task.done ? 'Mark as not done' : 'Mark as done'}: ${task.text}`);
    check.setAttribute('aria-pressed', String(task.done));
    if (task.done) check.innerHTML = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3 8 3.2 3.2L13 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    check.addEventListener('click', () => {
      task.done = !task.done;
      persist(TASKS_KEY, JSON.stringify(tasks));
      render();
    });

    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;

    const category = document.createElement('span');
    category.className = `task-category ${task.category.toLowerCase()}`;
    category.textContent = task.category;

    const remove = document.createElement('button');
    remove.className = 'delete-task';
    remove.type = 'button';
    remove.setAttribute('aria-label', `Delete task: ${task.text}`);
    remove.textContent = '×';
    remove.addEventListener('click', () => {
      tasks = tasks.filter(candidate => candidate.id !== task.id);
      persist(TASKS_KEY, JSON.stringify(tasks));
      render();
    });

    item.append(check, text, category, remove);
    list.append(item);
  }
}

function addTask(text, category) {
  const cleanText = text.trim();
  if (!cleanText) return;
  tasks.push({ id: makeId(), text: cleanText, category, done: false });
  persist(TASKS_KEY, JSON.stringify(tasks));
  render();
}

form.addEventListener('submit', event => {
  event.preventDefault();
  addTask(input.value, categoryInput.value);
  input.value = '';
  input.focus();
});

suggestionButtons.forEach(button => {
  button.addEventListener('click', () => addTask(button.dataset.suggestion, button.dataset.category));
});

weatherButtons.forEach(button => {
  button.addEventListener('click', () => setWeather(button.dataset.weather));
});

clearDoneButton.addEventListener('click', () => {
  tasks = tasks.filter(task => !task.done);
  persist(TASKS_KEY, JSON.stringify(tasks));
  render();
});

setDates();
setWeather(selectedWeather);
render();
