/**
 * Sedona Adventure Countdown — app.js
 *
 * Target: July 8, 2026 at 6:42 AM Eastern Daylight Time
 *   EDT = UTC−4, so the UTC moment is 10:42:00 UTC
 */

'use strict';

// ── Target date ──────────────────────────────────────────
// July 8, 2026, 6:42 AM EDT (UTC−4) = 10:42 UTC
const TARGET = new Date('2026-07-08T10:42:00Z');

// ── DOM references ───────────────────────────────────────
const daysEl       = document.getElementById('days');
const hoursEl      = document.getElementById('hours');
const minutesEl    = document.getElementById('minutes');
const secondsEl    = document.getElementById('seconds');
const celebrationEl = document.getElementById('celebration');
const starsEl      = document.getElementById('celebration-stars');

// Track previous values so we only animate elements that changed
let prev = { days: null, hours: null, minutes: null, seconds: null };
let intervalId = null;

// ── Utility ───────────────────────────────────────────────

/** Zero-pad a number to at least `width` digits. */
function pad(n, width = 2) {
  return String(n).padStart(width, '0');
}

/**
 * Flash a number element with a subtle scale-dip animation
 * (matches the .tick keyframe in style.css).
 */
function flashElement(el) {
  el.classList.remove('tick');
  // Force a reflow so removing + re-adding the class works
  void el.offsetWidth;
  el.classList.add('tick');
}

// ── Countdown logic ──────────────────────────────────────

function updateCountdown() {
  const now  = new Date();
  const diff = TARGET - now;   // milliseconds remaining

  if (diff <= 0) {
    // Write zeros one last time, then celebrate
    setDisplay(0, 0, 0, 0);
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    showCelebration();
    return;
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days    = Math.floor(totalSeconds / 86400);
  const hours   = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  setDisplay(days, hours, minutes, seconds);
}

function setDisplay(days, hours, minutes, seconds) {
  // Days: show the raw number (may be 3 digits), no leading zero needed
  const dStr = String(days);
  const hStr = pad(hours);
  const mStr = pad(minutes);
  const sStr = pad(seconds);

  if (dStr !== prev.days) {
    daysEl.textContent = dStr;
    if (prev.days !== null) flashElement(daysEl);
    prev.days = dStr;
  }
  if (hStr !== prev.hours) {
    hoursEl.textContent = hStr;
    if (prev.hours !== null) flashElement(hoursEl);
    prev.hours = hStr;
  }
  if (mStr !== prev.minutes) {
    minutesEl.textContent = mStr;
    if (prev.minutes !== null) flashElement(minutesEl);
    prev.minutes = mStr;
  }
  if (sStr !== prev.seconds) {
    secondsEl.textContent = sStr;
    if (prev.seconds !== null) flashElement(secondsEl);
    prev.seconds = sStr;
  }
}

// ── Celebration ──────────────────────────────────────────

function createStarParticles(container, count = 60) {
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'star-particle' + (i % 4 === 0 ? ' teal' : '');

    const size  = Math.random() * 5 + 2;           // 2–7 px
    const left  = Math.random() * 100;             // 0–100 %
    const top   = Math.random() * 100;             // 0–100 %
    const dur   = (Math.random() * 2.5 + 1).toFixed(2); // 1–3.5 s
    const delay = (Math.random() * 4).toFixed(2);        // 0–4 s

    el.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${left}%;
      top: ${top}%;
      --dur: ${dur}s;
      --delay: ${delay}s;
    `;
    fragment.appendChild(el);
  }

  container.appendChild(fragment);
}

function showCelebration() {
  // Build particles only once
  if (!starsEl.hasChildNodes()) {
    createStarParticles(starsEl);
  }

  celebrationEl.setAttribute('aria-hidden', 'false');
  // Small rAF delay ensures the CSS transition fires
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      celebrationEl.classList.add('visible');
    });
  });
}

// ── Start ─────────────────────────────────────────────────

// Render immediately, then tick every second
updateCountdown();
intervalId = setInterval(updateCountdown, 1000);

// ── Service Worker registration ──────────────────────────

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((reg) => {
        console.log('SW registered, scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('SW registration failed:', err);
      });
  });
}
