// Target wedding date/time — update this when the real date is set.
const WEDDING_DATE = new Date('2027-01-02T12:00:00');

// Paste the deployed Google Apps Script web app URL here (see google-apps-script.gs).
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby02odtSkCjfWFs12fNB5d0zUEH94hBp7oVFfMYeDx0XAGn4rxDrbqkSEY4WnKoXYF76w/exec';

// --- Cover EN/ZH text swap -----------------------------------------------
const i18nSwapEls = document.querySelectorAll('.i18n-swap__inner');
let i18nShowZh = false;
function swapI18nText() {
  i18nShowZh = !i18nShowZh;
  i18nSwapEls.forEach((el) => {
    el.style.animation = 'i18n-slide-out 0.35s ease forwards';
    setTimeout(() => {
      el.textContent = i18nShowZh ? el.dataset.zh : el.dataset.en;
      el.style.animation = 'i18n-slide-in 0.35s ease forwards';
    }, 350);
  });
}
if (i18nSwapEls.length) {
  setInterval(swapI18nText, 5200);
}

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
}, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
revealItems.forEach((item) => observer.observe(item));

// --- Schedule timeline: reveals each row as the viewport's vertical
// midpoint passes it while scrolling, so rows above the midpoint are shown
// and rows below stay hidden until scrolled to --
const dayTimeline = document.querySelector('.day-timeline');
if (dayTimeline) {
  const cells = Array.from(dayTimeline.children);
  const rows = [];
  for (let i = 0; i < cells.length; i += 3) rows.push(cells.slice(i, i + 3));

  let tlTicking = false;
  function updateTimelineReveal() {
    const viewportMid = window.innerHeight / 2;
    rows.forEach((row) => {
      const dotRect = row[1].getBoundingClientRect();
      const shouldShow = dotRect.top + dotRect.height / 2 <= viewportMid;
      row.forEach((el) => el.classList.toggle('is-visible', shouldShow));
    });
    tlTicking = false;
  }
  function queueTimelineReveal() {
    if (!tlTicking) {
      tlTicking = true;
      requestAnimationFrame(updateTimelineReveal);
    }
  }
  window.addEventListener('scroll', queueTimelineReveal, { passive: true });
  window.addEventListener('resize', queueTimelineReveal);
  updateTimelineReveal();
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

// --- Background music player ------------------------------------------
const soundToggle = document.getElementById('soundToggle');
const bgAudio = document.getElementById('bgAudio');
const prevTrackBtn = document.getElementById('prevTrack');
const nextTrackBtn = document.getElementById('nextTrack');
const playerArt = document.getElementById('playerArt');
const playerTitle = document.getElementById('playerTitle');
const playerArtist = document.getElementById('playerArtist');

// TODO: swap in the real title/artist for each track (and a cover for dont_go.mp3).
const TRACKS = [
  { src: 'assets/audio/anyway.mp3', title: 'Anyway', artist: 'Nam Jong', art: 'assets/img/album/anyway.jpeg' },
  { src: 'assets/audio/love_wins_all.mp3', title: 'Love Wins All', artist: 'IU', art: 'assets/img/album/love_wins_all.jpeg' },
  { src: 'assets/audio/fanfare.mp3', title: 'Fanfare', artist: 'Davichi', art: 'assets/img/album/fanfare.jpg' },
  { src: 'assets/audio/dont_go.mp3', title: 'Don’t Go', artist: 'EXO', art: 'assets/img/album/dont_go.jpeg' },
  { src: 'assets/audio/dream.mp3', title: 'Dream', artist: 'Suzy, BAEKHYUN', art: 'assets/img/album/dream.jpeg' },
];

let currentTrackIndex = Math.floor(Math.random() * TRACKS.length);

function loadTrack(index, { autoplay = false } = {}) {
  currentTrackIndex = (index + TRACKS.length) % TRACKS.length;
  const track = TRACKS[currentTrackIndex];
  bgAudio.src = track.src;
  playerArt.src = track.art || '';
  playerArt.style.visibility = track.art ? 'visible' : 'hidden';
  playerTitle.textContent = track.title;
  playerArtist.textContent = track.artist;
  if (autoplay) {
    bgAudio.play().catch(() => {
      console.warn(`${bgAudio.src} not found or blocked by the browser.`);
    });
  }
}
loadTrack(currentTrackIndex);

prevTrackBtn.addEventListener('click', () => {
  loadTrack(currentTrackIndex - 1, { autoplay: !bgAudio.paused });
});
nextTrackBtn.addEventListener('click', () => {
  loadTrack(currentTrackIndex + 1, { autoplay: !bgAudio.paused });
});
bgAudio.addEventListener('ended', () => {
  loadTrack(currentTrackIndex + 1, { autoplay: true });
});

soundToggle.addEventListener('click', () => {
  if (bgAudio.paused) {
    bgAudio.play().catch(() => {
      console.warn(`${bgAudio.src} not found or blocked by the browser.`);
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
    console.warn(`${bgAudio.src} not found or blocked by the browser.`);
  });
  dismissEntryModal();
});
entryModalSkip.addEventListener('click', dismissEntryModal);

// --- RSVP form -> Google Sheet (via Google Apps Script web app) ------------
const rsvpForm = document.getElementById('rsvpForm');
const rsvpThanks = document.getElementById('rsvpThanks');
const rsvpError = document.getElementById('rsvpError');
const mailingAddressRow = document.getElementById('mailingAddressRow');
const guestEmailRow = document.getElementById('guestEmailRow');
const attendanceDetails = document.getElementById('attendanceDetails');
const attendanceDetailsParent = attendanceDetails.parentNode;
let attendanceDetailsNextSibling = attendanceDetails.nextSibling;
const mailingAddressInput = document.getElementById('mailingAddress');
const guestEmailInput = document.getElementById('guestEmail');

function updateNeedsCard() {
  const hide = document.getElementById('needsCardNo').checked;
  mailingAddressRow.hidden = hide;
  mailingAddressInput.required = !hide;
}

function updateNeedsEcard() {
  const hide = document.getElementById('needsEcardNo').checked;
  guestEmailRow.hidden = hide;
  guestEmailInput.required = !hide;
}

document.getElementsByName('needsCard').forEach((radio) => {
  radio.addEventListener('change', updateNeedsCard);
});

document.getElementsByName('needsEcard').forEach((radio) => {
  radio.addEventListener('change', updateNeedsEcard);
});

updateNeedsCard();
updateNeedsEcard();

document.getElementsByName('attending').forEach((radio) => {
  radio.addEventListener('change', () => {
    const notAttending = document.querySelector('input[name="attending"][value="not-attending"]').checked;
    // Toggling [hidden] on #attendanceDetails can leave Safari with a stale
    // flex-container height below its last fieldset. Removing the node from
    // the DOM and reinserting it (instead of just hiding it) guarantees
    // Safari lays it out fresh, since there's no old box to keep around.
    if (notAttending) {
      attendanceDetailsNextSibling = attendanceDetails.nextSibling;
      attendanceDetails.remove();
    } else if (!attendanceDetails.isConnected) {
      attendanceDetailsParent.insertBefore(attendanceDetails, attendanceDetailsNextSibling);
    }
  });
});

// --- RSVP form: multi-page navigation --------------------------------------
const rsvpPages = Array.from(rsvpForm.querySelectorAll('.rsvp-page'));
let rsvpPageIndex = 0;

// Only the current page stays in the DOM; switching removes the old page and
// appends the new one fresh, since toggling [hidden] alone can leave Safari
// with a stale flex-container height below the nav buttons (same issue as
// #attendanceDetails above).
rsvpPages.forEach((page, i) => {
  page.hidden = false;
  if (i !== rsvpPageIndex) page.remove();
});

function showRsvpPage(index) {
  rsvpPages[rsvpPageIndex].remove();
  rsvpPageIndex = index;
  rsvpForm.appendChild(rsvpPages[index]);
}

function validateRsvpPage(page) {
  const fields = page.querySelectorAll('input, select, textarea');
  for (const field of fields) {
    if (!field.reportValidity()) return false;
  }
  return true;
}

// Attach listeners via the retained page references, not rsvpForm.querySelectorAll —
// pages 2 and 3 are detached from the DOM at this point, so a live query would miss them.
rsvpPages.forEach((page) => {
  page.querySelectorAll('[data-next]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (validateRsvpPage(rsvpPages[rsvpPageIndex])) {
        showRsvpPage(rsvpPageIndex + 1);
      }
    });
  });
  page.querySelectorAll('[data-prev]').forEach((btn) => {
    btn.addEventListener('click', () => {
      showRsvpPage(rsvpPageIndex - 1);
    });
  });
});

// Resolve via the retained page references, not rsvpForm.querySelector — page 3
// (which holds the submit button) is detached from the DOM whenever a different
// page is showing, so a live query against rsvpForm would return null.
const rsvpSubmit = rsvpPages.map((page) => page.querySelector('.rsvp-card__submit')).find(Boolean);
const rsvpSubmitLabel = rsvpSubmit.textContent;

rsvpForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  rsvpError.hidden = true;

  // notAttending/needsCard/needsEcard live on pages 1/2, which are detached from
  // the document whenever page 3 is showing — document.querySelector/getElementById
  // would find nothing. Build formData first (it walks all rsvpPages directly,
  // not just what's attached) and read the values back out of it instead.
  const formData = new FormData();
  rsvpPages.forEach((page) => {
    page.querySelectorAll('input, select, textarea').forEach((field) => {
      if (!field.name) return;
      if ((field.type === 'radio' || field.type === 'checkbox') && !field.checked) return;
      formData.append(field.name, field.value);
    });
  });

  const notAttending = formData.get('attending') === 'not-attending';
  const needsCard = formData.get('needsCard') === 'yes';
  const needsEcard = formData.get('needsEcard') === 'yes';

  if (notAttending) {
    formData.set('adultCount', '0');
    formData.set('kidCount', '0');
    formData.set('vegCount', '0');
    formData.set('attendsCeremony', '');
  }
  if (!needsCard) {
    formData.set('mailingAddress', '');
  }
  if (!needsEcard) {
    formData.set('guestEmail', '');
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
