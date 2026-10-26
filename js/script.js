/* =========================================================
   Spectra '26 — Interactivity (plain JavaScript, no libraries)

   Features
   1.  Dark / light theme toggle (remembered with localStorage)
   2.  Mobile hamburger menu with animated icon
   3.  Sticky header shadow + active nav link on scroll
   4.  Typing text effect in the hero
   5.  Live countdown to the event
   6.  Animated stat counters (start when visible)
   7.  Events rendered from a JS array + category filter + live search
   8.  Event details modal (Esc / overlay / button to close)
   9.  Registration form with real-time validation
   10. FAQ accordion
   11. Scroll-reveal animations, back-to-top button, toast messages
   ========================================================= */

'use strict';

/* ---------- Small helpers ---------- */
const $ = (sel, scope = document) => scope.querySelector(sel);
const $$ = (sel, scope = document) => [...scope.querySelectorAll(sel)];

// localStorage can throw (private mode / blocked storage), so wrap it.
const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, val) { try { localStorage.setItem(key, val); } catch { /* ignore */ } }
};

// Limits how often a function runs — used for scroll and search input.
function debounce(fn, wait = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

// Escape user-facing strings before putting them into innerHTML.
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

/* ---------- Data ---------- */
const EVENTS = [
  { id: 1, title: 'Web Dev from Zero', category: 'workshop', level: 'Beginner', day: 'Day 1', time: '10:00 AM', venue: 'Lab A', seats: 40,
    desc: 'Build and deploy your first responsive website with HTML, CSS and a sprinkle of JavaScript. You leave with a live link.' },
  { id: 2, title: 'Git & GitHub Bootcamp', category: 'workshop', level: 'Beginner', day: 'Day 1', time: '2:00 PM', venue: 'Lab B', seats: 6,
    desc: 'Branches, pull requests and merge conflicts — practised on a shared repo so the mistakes happen here, not at work.' },
  { id: 3, title: 'Intro to Machine Learning', category: 'workshop', level: 'Intermediate', day: 'Day 2', time: '10:00 AM', venue: 'Lab A', seats: 30,
    desc: 'Train, evaluate and compare simple models in Python with scikit-learn on a real dataset.' },
  { id: 4, title: '24-Hour Hackathon', category: 'competition', level: 'All levels', day: 'Day 1–2', time: '6:00 PM', venue: 'Main Hall', seats: 25,
    desc: 'Teams of up to four build a working prototype around a theme announced at the start. Mentors are around all night.' },
  { id: 5, title: 'Code Relay', category: 'competition', level: 'Intermediate', day: 'Day 1', time: '11:30 AM', venue: 'Lab C', seats: 4,
    desc: 'Teammates take turns solving parts of one problem without talking to each other. Clean code wins.' },
  { id: 6, title: 'UI Clone Challenge', category: 'competition', level: 'Beginner', day: 'Day 2', time: '1:00 PM', venue: 'Lab B', seats: 20,
    desc: 'Recreate a given screen as closely as you can in 90 minutes using only HTML and CSS.' },
  { id: 7, title: 'Shipping Your First Open-Source PR', category: 'talk', level: 'All levels', day: 'Day 1', time: '4:00 PM', venue: 'Auditorium', seats: 150,
    desc: 'A maintainer walks through how to find good first issues and write a PR that actually gets merged.' },
  { id: 8, title: 'Accessibility Is a Feature', category: 'talk', level: 'All levels', day: 'Day 2', time: '11:00 AM', venue: 'Auditorium', seats: 150,
    desc: 'Why keyboard navigation, contrast and screen-reader labels matter, with live demos of common mistakes.' },
  { id: 9, title: 'Careers Panel: First Year in Tech', category: 'talk', level: 'All levels', day: 'Day 2', time: '3:30 PM', venue: 'Auditorium', seats: 150,
    desc: 'Recent graduates talk honestly about interviews, internships and what they wish they had learned earlier.' }
];

const EVENT_DATE = new Date('2026-11-14T09:00:00+05:30');

/* =========================================================
   1. THEME TOGGLE
   ========================================================= */
const themeToggle = $('#themeToggle');
const root = document.documentElement;

function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  const isDark = theme === 'dark';
  $('.theme-icon', themeToggle).textContent = isDark ? '☀️' : '🌙';
  themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
}

// Saved choice first; otherwise follow the operating system setting.
const savedTheme = storage.get('spectra-theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

themeToggle.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  storage.set('spectra-theme', next);
});

/* =========================================================
   2. MOBILE MENU
   ========================================================= */
const navToggle = $('#navToggle');
const navMenu = $('#navMenu');

function setMenu(open) {
  navMenu.classList.toggle('open', open);
  navToggle.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}

navToggle.addEventListener('click', () => setMenu(!navMenu.classList.contains('open')));

// Close the menu after choosing a link, or when clicking outside it.
$$('.nav-link').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('click', e => {
  if (navMenu.classList.contains('open') && !e.target.closest('.nav')) setMenu(false);
});
// If the window is resized to desktop width, reset the menu.
window.addEventListener('resize', debounce(() => { if (window.innerWidth > 720) setMenu(false); }, 150));

/* =========================================================
   3. HEADER SHADOW + ACTIVE LINK + BACK TO TOP
   ========================================================= */
const header = $('#siteHeader');
const backToTop = $('#backToTop');

function onScroll() {
  const y = window.scrollY;
  header.classList.toggle('scrolled', y > 10);
  backToTop.classList.toggle('visible', y > 600);
}
window.addEventListener('scroll', debounce(onScroll, 50), { passive: true });
onScroll();

backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// Highlight the nav link of whichever section is in the middle of the screen.
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    $$('.nav-link').forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
    });
  });
}, { rootMargin: '-45% 0px -50% 0px' });

$$('main section[id]').forEach(sec => sectionObserver.observe(sec));

/* =========================================================
   4. TYPING EFFECT
   ========================================================= */
(function typingEffect() {
  const el = $('#typedText');
  const words = ['Learn.', 'Ship.', 'Repeat.'];
  let wordIndex = 0, charIndex = words[0].length, deleting = true;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function step() {
    const word = words[wordIndex];
    el.textContent = word.slice(0, charIndex);

    if (deleting) {
      charIndex--;
      if (charIndex < 0) { deleting = false; wordIndex = (wordIndex + 1) % words.length; charIndex = 0; }
    } else {
      charIndex++;
      if (charIndex > words[wordIndex].length) { deleting = true; setTimeout(step, 1400); return; }
    }
    setTimeout(step, deleting ? 60 : 110);
  }
  setTimeout(step, 1600);
})();

/* =========================================================
   5. COUNTDOWN
   ========================================================= */
const cd = { days: $('#cdDays'), hours: $('#cdHours'), mins: $('#cdMins'), secs: $('#cdSecs') };
const pad = n => String(n).padStart(2, '0');

function setCD(el, value) {
  if (el.textContent === value) return;          // only touch the DOM when the number changes
  el.textContent = value;
  el.classList.remove('tick');
  void el.offsetWidth;                           // restart the CSS animation
  el.classList.add('tick');
}

function updateCountdown() {
  const diff = EVENT_DATE - Date.now();
  if (diff <= 0) {
    $('#countdown').innerHTML = '<p class="hero-sub">Spectra is live — see you in the Main Hall!</p>';
    clearInterval(countdownTimer);
    return;
  }
  setCD(cd.days, pad(Math.floor(diff / 86400000)));
  setCD(cd.hours, pad(Math.floor(diff / 3600000) % 24));
  setCD(cd.mins, pad(Math.floor(diff / 60000) % 60));
  setCD(cd.secs, pad(Math.floor(diff / 1000) % 60));
}
const countdownTimer = setInterval(updateCountdown, 1000);
updateCountdown();

/* =========================================================
   6. STAT COUNTERS
   ========================================================= */
function animateCounter(el) {
  const target = Number(el.dataset.target);
  const duration = 1500;
  const start = performance.now();

  function frame(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);          // ease-out
    el.textContent = Math.floor(eased * target).toLocaleString('en-IN');
    if (progress < 1) requestAnimationFrame(frame);
    else el.textContent = target.toLocaleString('en-IN') + (target >= 100 ? '+' : '');
  }
  requestAnimationFrame(frame);
}

const counterObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      obs.unobserve(entry.target);                         // run once only
    }
  });
}, { threshold: 0.6 });
$$('.stat-num').forEach(el => counterObserver.observe(el));

/* =========================================================
   7. EVENTS: RENDER, FILTER, SEARCH
   ========================================================= */
const eventGrid = $('#eventGrid');
const emptyState = $('#emptyState');
const resultCount = $('#resultCount');
const searchInput = $('#eventSearch');
let activeFilter = 'all';

function eventCard(ev, index) {
  const lowSeats = ev.seats <= 10;
  return `
    <article class="event-card" style="animation-delay:${index * 60}ms">
      <span class="tag">${escapeHTML(ev.category)}</span>
      <h3>${escapeHTML(ev.title)}</h3>
      <p class="meta">${escapeHTML(ev.day)} · ${escapeHTML(ev.time)} · ${escapeHTML(ev.venue)}</p>
      <p class="meta">Level: ${escapeHTML(ev.level)}</p>
      <div class="card-actions">
        <span class="seats ${lowSeats ? 'low' : ''}">${lowSeats ? 'Only ' : ''}${ev.seats} seats left</span>
        <button class="details-btn" data-id="${ev.id}">Details →</button>
      </div>
    </article>`;
}

function renderEvents() {
  const query = searchInput.value.trim().toLowerCase();

  const list = EVENTS.filter(ev => {
    const matchesCategory = activeFilter === 'all' || ev.category === activeFilter;
    const matchesSearch = !query ||
      ev.title.toLowerCase().includes(query) ||
      ev.desc.toLowerCase().includes(query) ||
      ev.level.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  // Build one string and write to the DOM once, instead of once per card.
  eventGrid.innerHTML = list.map(eventCard).join('');
  emptyState.hidden = list.length > 0;
  resultCount.textContent = `Showing ${list.length} of ${EVENTS.length} events`;
}

$$('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.filter-btn').forEach(b => {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-selected', String(b === btn));
    });
    activeFilter = btn.dataset.filter;
    renderEvents();
  });
});

searchInput.addEventListener('input', debounce(renderEvents, 200));

// Event delegation: one listener on the grid handles every "Details" button,
// including cards that are re-rendered later.
eventGrid.addEventListener('click', e => {
  const btn = e.target.closest('.details-btn');
  if (btn) openModal(Number(btn.dataset.id), btn);
});

renderEvents();

/* =========================================================
   8. MODAL
   ========================================================= */
const modal = $('#modal');
let lastFocused = null;
let modalEventId = null;

function openModal(id, trigger) {
  const ev = EVENTS.find(item => item.id === id);
  if (!ev) return;
  modalEventId = id;
  lastFocused = trigger;

  $('#modalTag').textContent = ev.category;
  $('#modalTitle').textContent = ev.title;
  $('#modalMeta').textContent = `${ev.day} · ${ev.time} · ${ev.venue} · ${ev.level}`;
  $('#modalDesc').textContent = ev.desc;

  modal.hidden = false;
  document.body.classList.add('no-scroll');
  $('#modalClose').focus();
}

function closeModal() {
  modal.hidden = true;
  document.body.classList.remove('no-scroll');
  if (lastFocused) lastFocused.focus();               // send focus back where it was
}

$('#modalClose').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

document.addEventListener('keydown', e => {
  if (modal.hidden) return;
  if (e.key === 'Escape') closeModal();

  // Keep Tab focus inside the modal while it is open.
  if (e.key === 'Tab') {
    const focusables = $$('button', modal);
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

// "Register for this event" pre-selects the event in the form.
$('#modalRegister').addEventListener('click', () => {
  closeModal();
  eventSelect.value = String(modalEventId);
  validateField(eventSelect);
  $('#register').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => $('#fullName').focus({ preventScroll: true }), 600);
});

/* =========================================================
   9. FORM VALIDATION
   ========================================================= */
const form = $('#regForm');
const eventSelect = $('#eventSelect');
const message = $('#message');
const charCount = $('#charCount');

// Fill the dropdown from the same data used for the cards.
eventSelect.insertAdjacentHTML('beforeend',
  EVENTS.map(ev => `<option value="${ev.id}">${escapeHTML(ev.title)}</option>`).join(''));

// Each rule returns an error message, or '' when the value is fine.
const rules = {
  fullName: v => !v.trim() ? 'Please enter your name.'
    : !/^[A-Za-z][A-Za-z .'-]{1,49}$/.test(v.trim()) ? 'Use letters only (2–50 characters).' : '',
  email: v => !v.trim() ? 'Email is required.'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? 'That email doesn\'t look right.' : '',
  phone: v => !v ? 'Phone number is required.'
    : !/^[6-9]\d{9}$/.test(v) ? 'Enter a valid 10-digit Indian mobile number.' : '',
  college: v => v.trim().length < 3 ? 'Please enter your college name.' : '',
  eventSelect: v => !v ? 'Pick one event.' : '',
  agree: (_, el) => !el.checked ? 'Please accept the code of conduct.' : ''
};

function validateField(el) {
  const rule = rules[el.name];
  if (!rule) return true;
  const error = rule(el.value, el);
  const field = el.closest('.field');
  $('.error-msg', field).textContent = error;
  field.classList.toggle('invalid', !!error);
  field.classList.toggle('valid', !error && el.type !== 'checkbox');
  el.setAttribute('aria-invalid', String(!!error));
  return !error;
}

// Phone: strip anything that isn't a digit and cap at 10 digits.
// (Done here instead of maxlength so a pasted "98765 43210" still works.)
$('#phone').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10); });

// Validate on blur, then live while typing once a field has been flagged.
Object.keys(rules).forEach(name => {
  const el = form.elements[name];
  el.addEventListener('blur', () => validateField(el));
  el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', () => {
    if (el.closest('.field').classList.contains('invalid') || el.type === 'checkbox' || el.tagName === 'SELECT') validateField(el);
  });
});

message.addEventListener('input', () => {
  const len = message.value.length;
  charCount.textContent = len;
  charCount.parentElement.classList.toggle('near-limit', len >= 180);
});

form.addEventListener('submit', e => {
  e.preventDefault();
  const results = Object.keys(rules).map(name => validateField(form.elements[name]));

  if (results.includes(false)) {
    showToast('Please fix the highlighted fields.', 'error');
    $('.field.invalid input, .field.invalid select', form)?.focus();
    return;
  }

  // No backend for this task, so simulate a short network request.
  const btn = $('#submitBtn');
  btn.disabled = true;
  btn.textContent = 'Submitting…';

  setTimeout(() => {
    const name = form.elements.fullName.value.trim().split(' ')[0];
    showToast(`Thanks, ${name}! Your registration is confirmed.`, 'success');
    form.reset();
    charCount.textContent = '0';
    $$('.field', form).forEach(f => f.classList.remove('valid', 'invalid'));
    btn.disabled = false;
    btn.textContent = 'Submit registration';
  }, 900);
});

/* =========================================================
   10. FAQ ACCORDION (one open at a time)
   ========================================================= */
$$('.acc-header').forEach(header => {
  header.addEventListener('click', () => {
    const item = header.parentElement;
    const isOpen = item.classList.contains('open');

    $$('.acc-item').forEach(other => {
      other.classList.remove('open');
      $('.acc-header', other).setAttribute('aria-expanded', 'false');
      $('.acc-panel', other).style.maxHeight = null;
    });

    if (!isOpen) {
      item.classList.add('open');
      header.setAttribute('aria-expanded', 'true');
      const panel = $('.acc-panel', item);
      panel.style.maxHeight = panel.scrollHeight + 'px';   // animate to the real content height
    }
  });
});

/* =========================================================
   11. SCROLL REVEAL + TOAST
   ========================================================= */
const revealObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
$$('.reveal').forEach(el => revealObserver.observe(el));

let toastTimer;
function showToast(text, type = '') {
  const toast = $('#toast');
  toast.textContent = text;
  toast.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}
