(function () {
  const ROUND_SECONDS = 5 * 60;
  const RADIUS = 122;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  const fillCircle = document.getElementById('fillCircle');
  const timeDisplay = document.getElementById('timeDisplay');
  const stateLabel = document.getElementById('stateLabel');
  const startPauseBtn = document.getElementById('startPauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const ringWrap = document.getElementById('ringWrap');
  const roundsTodayEl = document.getElementById('roundsToday');
  const dotsEl = document.getElementById('dots');
  const themeToggle = document.getElementById('themeToggle');

  const THEME_KEY = 'five-timer-theme';
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  themeToggle.checked = isLight;

  themeToggle.addEventListener('change', () => {
    if (themeToggle.checked) {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem(THEME_KEY, 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem(THEME_KEY, 'dark');
    }
  });

  fillCircle.style.strokeDasharray = CIRCUMFERENCE;
  fillCircle.style.strokeDashoffset = 0;

  let remaining = ROUND_SECONDS;
  let running = false;
  let intervalId = null;

  function todayKey() {
    const d = new Date();
    return `five-timer-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function getRoundsToday() {
    return parseInt(localStorage.getItem(todayKey()) || '0', 10);
  }

  function setRoundsToday(n) {
    localStorage.setItem(todayKey(), String(n));
    renderRounds();
  }

  function renderRounds() {
    const count = getRoundsToday();
    roundsTodayEl.textContent = count;
    dotsEl.innerHTML = '';
    const shown = Math.max(count, 1);
    for (let i = 0; i < shown; i++) {
      const dot = document.createElement('div');
      dot.className = 'dot' + (i < count ? ' done' : '');
      dotsEl.appendChild(dot);
    }
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function updateDisplay() {
    timeDisplay.textContent = formatTime(remaining);
    const progress = 1 - remaining / ROUND_SECONDS;
    fillCircle.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  }

  function playChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      [660, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + i * 0.18);
        gain.gain.linearRampToValueAtTime(0.18, now + i * 0.18 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.9);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.18);
        osc.stop(now + i * 0.18 + 1);
      });
    } catch (e) { /* audio unavailable, ignore */ }
  }

  function tick() {
    remaining -= 1;
    if (remaining <= 0) {
      remaining = 0;
      updateDisplay();
      completeRound();
      return;
    }
    updateDisplay();
  }

  function start() {
    if (running) return;
    running = true;
    stateLabel.textContent = 'Focusing';
    startPauseBtn.textContent = 'Pause';
    intervalId = setInterval(tick, 1000);
  }

  function pause() {
    running = false;
    stateLabel.textContent = 'Paused';
    startPauseBtn.textContent = 'Resume';
    clearInterval(intervalId);
  }

  function reset() {
    running = false;
    clearInterval(intervalId);
    remaining = ROUND_SECONDS;
    stateLabel.textContent = 'Tap to start';
    startPauseBtn.textContent = 'Start';
    fillCircle.style.stroke = 'var(--ring-fill)';
    updateDisplay();
  }

  function completeRound() {
    running = false;
    clearInterval(intervalId);
    stateLabel.textContent = 'Round complete';
    startPauseBtn.textContent = 'Start';
    fillCircle.style.stroke = 'var(--ring-fill-alt)';
    playChime();
    setRoundsToday(getRoundsToday() + 1);
    setTimeout(() => {
      remaining = ROUND_SECONDS;
      stateLabel.textContent = 'Tap to start';
      fillCircle.style.stroke = 'var(--ring-fill)';
      updateDisplay();
    }, 2500);
  }

  function toggle() {
    if (remaining === 0) return;
    running ? pause() : start();
  }

  startPauseBtn.addEventListener('click', toggle);
  resetBtn.addEventListener('click', reset);
  ringWrap.addEventListener('click', toggle);
  ringWrap.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      toggle();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && document.activeElement !== resetBtn) {
      e.preventDefault();
      toggle();
    }
  });

  updateDisplay();
  renderRounds();
})();