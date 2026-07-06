// Target wedding date/time — update this when the real date is set.
const WEDDING_DATE = new Date('2027-01-02T12:00:00');

// Paste the deployed Google Apps Script web app URL here (see google-apps-script.gs).
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzexyULccbX-c7rB1-sLvkLaA1VdeKaoH6IPU7Pddmt3zsKHP-bc6dFJ3Z0X_ZY8CfCXQ/exec';

// --- Nav scroll progress ------------------------------------------------
const navProgressFill = document.getElementById('navProgressFill');

function updateNavProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
  navProgressFill.style.width = `${Math.min(100, Math.max(0, progress * 100)) }%`;
}
window.addEventListener('scroll', updateNavProgress, { passive: true });
updateNavProgress();

// --- Scroll reveal -------------------------------------------------------
const revealItems = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealItems.forEach((item) => observer.observe(item));

// --- Schedule timeline: cascading reveal + growing spine as it scrolls into view;
// reverts to hidden when scrolled back out, so it replays each time --
const dayTimeline = document.querySelector('.day-timeline');
if (dayTimeline) {
  const cells = Array.from(dayTimeline.children);
  const rows = [];
  for (let i = 0; i < cells.length; i += 3) rows.push(cells.slice(i, i + 3));

  const timelineObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        rows.forEach((row, i) => {
          row.forEach((el) => {
            clearTimeout(el._tlTimer);
            el._tlTimer = setTimeout(() => el.classList.add('is-visible'), i * 450);
          });
        });
      } else {
        rows.forEach((row) => {
          row.forEach((el) => {
            clearTimeout(el._tlTimer);
            el.classList.remove('is-visible');
          });
        });
      }
    });
  }, { threshold: 0.2 });
  timelineObserver.observe(dayTimeline);
}

// --- Magazine gallery masonry (column-balanced, preserves every photo's
// native aspect ratio — no cropping, and columns settle to an even height) --
const magGrid = document.getElementById('magGrid');
if (magGrid) {
  const tiles = Array.from(magGrid.children);
  let currentCols = 0;

  function columnCountFor(width) {
    if (width < 560) return 1;
    if (width < 900) return 2;
    if (width < 1300) return 3;
    return 4;
  }

  function layoutMasonry() {
    const width = magGrid.getBoundingClientRect().width || window.innerWidth;
    const cols = columnCountFor(width);
    if (cols === currentCols) return;
    currentCols = cols;

    const columns = Array.from({ length: cols }, () => {
      const col = document.createElement('div');
      col.className = 'mag-col';
      return col;
    });
    const heights = new Array(cols).fill(0);

    tiles.forEach((tile) => {
      const img = tile.querySelector('img');
      const w = parseFloat(img.getAttribute('width')) || 1;
      const h = parseFloat(img.getAttribute('height')) || 1;
      let shortest = 0;
      for (let i = 1; i < cols; i++) {
        if (heights[i] < heights[shortest]) shortest = i;
      }
      heights[shortest] += h / w;
      columns[shortest].appendChild(tile);
    });

    magGrid.innerHTML = '';
    columns.forEach((col) => magGrid.appendChild(col));
  }

  layoutMasonry();
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layoutMasonry, 200);
  });
}

// --- Smooth scroll for nav + cover button --------------------------------
document.querySelectorAll('[data-scroll], [data-scroll-to]').forEach((el) => {
  el.addEventListener('click', (event) => {
    const targetSelector = el.getAttribute('href') || el.getAttribute('data-scroll-to');
    const target = document.querySelector(targetSelector);
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
      document.getElementById('navLinks').classList.remove('is-open');
    }
  });
});

// --- Mobile nav toggle -----------------------------------------------------
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

// --- Countdown -------------------------------------------------------------
const cdDays = document.getElementById('cdDays');
const cdHours = document.getElementById('cdHours');
const cdMins = document.getElementById('cdMins');
const cdSecs = document.getElementById('cdSecs');

function pad(n) {
  return String(n).padStart(2, '0');
}

function updateCountdown() {
  const diff = WEDDING_DATE.getTime() - Date.now();
  if (diff <= 0) {
    cdDays.textContent = cdHours.textContent = cdMins.textContent = cdSecs.textContent = '00';
    return;
  }
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  cdDays.textContent = pad(days);
  cdHours.textContent = pad(hours);
  cdMins.textContent = pad(mins);
  cdSecs.textContent = pad(secs);
}
updateCountdown();
setInterval(updateCountdown, 1000);

// --- Background music toggle ------------------------------------------
const soundToggle = document.getElementById('soundToggle');
const bgAudio = document.getElementById('bgAudio');
soundToggle.addEventListener('click', () => {
  if (bgAudio.paused) {
    bgAudio.play().catch(() => {
      console.warn('assets/audio/love_wins_all.mp3 not found or blocked by the browser.');
    });
  } else {
    bgAudio.pause();
  }
});
bgAudio.addEventListener('play', () => {
  soundToggle.classList.add('is-playing');
  soundToggle.setAttribute('aria-pressed', 'true');
  soundToggle.setAttribute('aria-label', 'Pause background music');
});
bgAudio.addEventListener('pause', () => {
  soundToggle.classList.remove('is-playing');
  soundToggle.setAttribute('aria-pressed', 'false');
  soundToggle.setAttribute('aria-label', 'Play background music');
});

// --- Entry modal: ask whether to play music before revealing the page -----
const entryModal = document.getElementById('entryModal');
const entryModalPlay = document.getElementById('entryModalPlay');
const entryModalSkip = document.getElementById('entryModalSkip');

document.body.style.overflow = 'hidden';

function dismissEntryModal() {
  entryModal.classList.add('is-hidden');
  document.body.style.overflow = '';
  setTimeout(() => { entryModal.hidden = true; }, 500);
}

entryModalPlay.addEventListener('click', () => {
  bgAudio.play().catch(() => {
    console.warn('assets/audio/anyway.mp3 not found or blocked by the browser.');
  });
  dismissEntryModal();
});
entryModalSkip.addEventListener('click', dismissEntryModal);

// --- RSVP form -> Google Sheet (via Google Apps Script web app) ------------
const rsvpForm = document.getElementById('rsvpForm');
const rsvpThanks = document.getElementById('rsvpThanks');
const rsvpError = document.getElementById('rsvpError');
const mailingAddressRow = document.getElementById('mailingAddressRow');
const attendanceDetails = document.getElementById('attendanceDetails');

document.getElementsByName('needsCard').forEach((radio) => {
  radio.addEventListener('change', () => {
    mailingAddressRow.hidden = document.getElementById('needsCardNo').checked;
  });
});

document.getElementsByName('attending').forEach((radio) => {
  radio.addEventListener('change', () => {
    attendanceDetails.hidden = document.querySelector('input[name="attending"][value="not-attending"]').checked;
  });
});

const rsvpSubmit = rsvpForm.querySelector('.rsvp-card__submit');
const rsvpSubmitLabel = rsvpSubmit.textContent;

rsvpForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  rsvpError.hidden = true;

  const notAttending = document.querySelector('input[name="attending"][value="not-attending"]').checked;
  const needsCard = document.getElementById('needsCardYes').checked;

  const formData = new FormData(rsvpForm);
  if (notAttending) {
    formData.set('adultCount', '0');
    formData.set('kidCount', '0');
    formData.set('vegCount', '0');
  }
  if (!needsCard) {
    formData.set('mailingAddress', '');
  }

  rsvpSubmit.disabled = true;
  rsvpSubmit.textContent = 'Sending…';

  try {
    // Apps Script web apps generally don't return CORS headers, so the
    // response body isn't readable from here — 'no-cors' lets the request
    // through and we treat a resolved fetch as success.
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: formData,
    });
    rsvpForm.hidden = true;
    rsvpThanks.hidden = false;
  } catch (err) {
    rsvpError.hidden = false;
    rsvpSubmit.disabled = false;
    rsvpSubmit.textContent = rsvpSubmitLabel;
  }
});
