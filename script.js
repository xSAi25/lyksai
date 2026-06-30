let currentPage = 1;
const totalPages = 9;
const FLIP_DURATION = 1250;
let isTurning = false;
let touchStartX = 0;
let touchStartY = 0;
let touchDeltaX = 0;
let touchDragging = false;
let lastSwipeTime = 0;
let audioContextForFlip = null;

const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const noBtn = document.getElementById("noBtn");
const finalAnswer = document.getElementById("finalAnswer");
const musicBtn = document.getElementById("musicBtn");
const bgMusic = document.getElementById("bgMusic");
const app = document.querySelector(".app");
const envelopeIntro = document.getElementById("envelopeIntro");
let envelopeOpened = false;

function preloadAppAssets() {
  // Preload visible image assets while the envelope is still on screen.
  // This reduces the feeling of lag after the letter opens.
  const sources = Array.from(document.querySelectorAll("img, video[poster], source"))
    .map(el => el.getAttribute("src") || el.getAttribute("poster"))
    .filter(Boolean)
    .filter(src => !src.match(/\.(mp3|mp4)$/i));

  sources.forEach(src => {
    const img = new Image();
    img.decoding = "async";
    img.loading = "eager";
    img.src = src;
  });
}

preloadAppAssets();

function openEnvelope() {
  if (envelopeOpened) return;
  envelopeOpened = true;

  // Instant visual response first, so it never feels like the tap is delayed.
  document.body.classList.add("envelope-clicked");
  const wrap = document.querySelector(".envelope-wrap");
  if (wrap) wrap.setAttribute("aria-disabled", "true");

  window.requestAnimationFrame(() => {
    document.body.classList.add("envelope-opening");
  });

  // Smooth sequence: fixed wax seal press/crack -> flap -> letter -> controlled burst.
  window.setTimeout(() => document.body.classList.add("envelope-seal-broken"), 115);
  window.setTimeout(() => createEnvelopeBurst("spark"), 230);
  window.setTimeout(() => createEnvelopeBurst("main"), 420);
  window.setTimeout(() => createEnvelopeBurst("petals"), 650);

  window.setTimeout(playEnvelopeSparkleSound, 120);
  window.setTimeout(playPageTurnSound, 360);
  softVibrate();

  window.setTimeout(() => {
    document.body.classList.add("envelope-letter-released");
  }, 620);

  window.setTimeout(() => {
    if (envelopeIntro) envelopeIntro.classList.add("hide");
    document.body.classList.remove("envelope-locked");
    document.body.classList.add("envelope-opened");
    startBackgroundMusic();
  }, 1280);
}

function createEnvelopeBurst(mode = "main") {
  const scene = document.querySelector(".envelope-scene");
  if (!scene) return;

  const burst = document.createElement("div");
  burst.className = `envelope-burst envelope-burst-${mode}`;

  const sets = {
    spark: ["✨", "✦", "✧", "💫"],
    main: ["💗", "💕", "💖", "❤️", "🌸", "🌷", "🌹", "✨", "💐"],
    petals: ["🌸", "🌷", "🌹", "🌺", "💮", "✨"]
  };
  const total = mode === "spark" ? 18 : mode === "petals" ? 24 : 34;
  const symbols = sets[mode] || sets.main;

  for (let i = 0; i < total; i++) {
    const piece = document.createElement("span");
    piece.className = `burst-piece burst-piece-${mode}`;
    piece.textContent = symbols[Math.floor(Math.random() * symbols.length)];

    const spread = mode === "spark" ? 95 : mode === "petals" ? 155 : 185;
    const angle = (Math.PI * 2 * i) / total + (Math.random() - 0.5) * (mode === "petals" ? 0.95 : 0.55);
    const distance = (mode === "spark" ? 60 : 90) + Math.random() * spread;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance - (mode === "petals" ? 10 : 48);
    const size = mode === "spark" ? 12 + Math.random() * 12 : 15 + Math.random() * 17;
    const rotate = -220 + Math.random() * 440;
    const duration = mode === "spark" ? 850 + Math.random() * 350 : mode === "petals" ? 1500 + Math.random() * 700 : 1180 + Math.random() * 520;
    const delay = Math.random() * (mode === "spark" ? 80 : 130);

    piece.style.setProperty("--burst-x", `${x}px`);
    piece.style.setProperty("--burst-y", `${y}px`);
    piece.style.setProperty("--burst-r", `${rotate}deg`);
    piece.style.setProperty("--burst-size", `${size}px`);
    piece.style.setProperty("--burst-duration", `${duration}ms`);
    piece.style.setProperty("--burst-delay", `${delay}ms`);

    burst.appendChild(piece);
  }

  scene.appendChild(burst);
  window.setTimeout(() => burst.remove(), mode === "petals" ? 2700 : 2100);
}

function playEnvelopeSparkleSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    audioContextForFlip = audioContextForFlip || new AudioCtx();
    const ctx = audioContextForFlip;
    if (ctx.state === "suspended") ctx.resume();

    [0, 0.08, 0.16, 0.25].forEach((offset, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880 + index * 190, ctx.currentTime + offset);
      osc.frequency.exponentialRampToValueAtTime(1320 + index * 220, ctx.currentTime + offset + 0.12);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.055, ctx.currentTime + offset + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.20);
    });
  } catch (error) {
    // Silent fallback if browser blocks WebAudio.
  }
}

if (envelopeIntro) {
  envelopeIntro.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openEnvelope();
    }
  });
}


function createCurlOverlay(direction = "next", duration = FLIP_DURATION, fromPage = null, toPage = null) {
  if (!app) return;
  const old = app.querySelectorAll(".page-curl-overlay");
  old.forEach(el => el.remove());

  const overlay = document.createElement("div");
  overlay.className = `page-curl-overlay ${direction === "prev" ? "prev" : "next"}`;
  overlay.style.setProperty("--curl-time", `${duration}ms`);

  const shadow = document.createElement("div");
  shadow.className = "curl-ground-shadow";

  const sheet = document.createElement("div");
  sheet.className = "curl-sheet";

  const front = document.createElement("div");
  front.className = "curl-face curl-front";
  const back = document.createElement("div");
  back.className = "curl-face curl-back";

  if (fromPage) front.innerHTML = fromPage.innerHTML;
  if (toPage) back.innerHTML = toPage.innerHTML;

  sheet.appendChild(front);
  sheet.appendChild(back);
  overlay.appendChild(shadow);
  overlay.appendChild(sheet);
  app.appendChild(overlay);

  window.setTimeout(() => overlay.remove(), Math.max(900, duration + 60));
}

function ensureDragCurlOverlay(direction = "next", progress = 0) {
  if (!app) return;
  let overlay = app.querySelector(".drag-curl-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "drag-curl-overlay";
    const sheet = document.createElement("div");
    sheet.className = "curl-sheet";
    overlay.appendChild(sheet);
    app.appendChild(overlay);
  }
  overlay.classList.toggle("next", direction !== "prev");
  overlay.classList.toggle("prev", direction === "prev");
  overlay.style.setProperty("--drag-progress", String(Math.max(0, Math.min(1, progress))));
}

function removeDragCurlOverlay() {
  if (!app) return;
  app.querySelectorAll(".drag-curl-overlay").forEach(el => el.remove());
}


function playPageTurnSound() {
  // Small built-in paper-swish sound. No extra audio file needed.
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    audioContextForFlip = audioContextForFlip || new AudioCtx();
    const ctx = audioContextForFlip;
    if (ctx.state === "suspended") ctx.resume();

    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.42, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const fade = 1 - i / data.length;
      data[i] = (Math.random() * 2 - 1) * fade * 0.32;
    }

    const noise = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    noise.buffer = noiseBuffer;
    filter.type = "highpass";
    filter.frequency.setValueAtTime(620, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1850, ctx.currentTime + 0.32);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.42);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.44);
  } catch (error) {
    // Silent fallback if browser blocks WebAudio.
  }
}

function softVibrate() {
  if (navigator.vibrate) navigator.vibrate(18);
}

function updateProgress(page) {
  if (progressText) progressText.textContent = `${page} / ${totalPages}`;
  if (progressFill) progressFill.style.width = `${(page / totalPages) * 100}%`;
}

function showPage(page, direction = "next") {
  if (isTurning) return;
  const pages = document.querySelectorAll(".page");
  const previousPage = document.querySelector(".page.active");
  const nextPageEl = document.getElementById(`page${page}`);

  if (!nextPageEl || previousPage === nextPageEl) return;

  isTurning = true;
  playPageTurnSound();
  softVibrate();

  // V2 engine: show the next page immediately underneath, then animate a separate
  // curled sheet above it. This removes the blank/delay and restores real page curl.
  pages.forEach(section => {
    section.classList.remove("active", "turn-next", "turn-prev", "flip-out", "drag-preview", "settle-back", "page-under", "page-from");
    section.style.removeProperty("--drag-rotate");
    section.style.removeProperty("--drag-x");
    section.style.removeProperty("--drag-shadow");
  });

  if (previousPage) previousPage.classList.add("page-from");
  nextPageEl.classList.add("active", "page-under");

  document.body.classList.add("page-is-turning", "v2-curl-turning");
  document.body.classList.toggle("turning-prev", direction === "prev");
  document.body.classList.toggle("turning-next", direction !== "prev");

  createCurlOverlay(direction, FLIP_DURATION, previousPage, nextPageEl);

  window.setTimeout(() => {
    pages.forEach(section => {
      section.classList.remove("turn-next", "turn-prev", "flip-out", "drag-preview", "settle-back", "page-under", "page-from");
      section.style.removeProperty("--drag-rotate");
      section.style.removeProperty("--drag-x");
      section.style.removeProperty("--drag-shadow");
      if (section !== nextPageEl) section.classList.remove("active");
    });
    nextPageEl.classList.add("active");
    document.body.classList.remove("page-is-turning", "turning-prev", "turning-next", "v2-curl-turning");
    isTurning = false;
  }, FLIP_DURATION + 40);

  // Enable full-page mobile scrolling only on the long song/message pages.
  document.body.classList.toggle("long-scroll", page === 8 || page === 9);
  if (page === 8 || page === 9) {
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  updateProgress(page);
}

function nextPage() {
  if (isTurning) return;
  if (currentPage < totalPages) {
    currentPage++;
    showPage(currentPage, "next");
  }
}

function prevPage() {
  if (isTurning) return;
  if (currentPage > 1) {
    currentPage--;
    showPage(currentPage, "prev");
  }
}

function previewDrag(deltaX) {
  const active = document.querySelector(".page.active");
  if (!active || isTurning) return;

  const width = app ? app.clientWidth : window.innerWidth;
  const clamped = Math.max(-width * 0.42, Math.min(width * 0.42, deltaX));
  const progress = Math.min(Math.abs(clamped) / (width * 0.42), 1);
  const isLeft = clamped < 0;
  const rotate = (isLeft ? -1 : 1) * progress * 18;

  active.classList.add("drag-preview");
  active.style.setProperty("--drag-rotate", `${rotate}deg`);
  active.style.setProperty("--drag-x", `${clamped * 0.10}px`);
  active.style.setProperty("--drag-shadow", `${progress}`);
  ensureDragCurlOverlay(isLeft ? "next" : "prev", progress);
  document.body.classList.toggle("swiping-left", isLeft);
  document.body.classList.toggle("swiping-right", !isLeft);
}

function clearDragPreview(animateBack = true) {
  const active = document.querySelector(".page.active");
  if (!active) return;
  if (animateBack) {
    active.classList.add("settle-back");
    window.setTimeout(() => active.classList.remove("settle-back"), 260);
  }
  active.classList.remove("drag-preview");
  active.style.removeProperty("--drag-rotate");
  active.style.removeProperty("--drag-x");
  active.style.removeProperty("--drag-shadow");
  removeDragCurlOverlay();
  document.body.classList.remove("swiping-left", "swiping-right");
}

function setupSwipeNavigation() {
  if (!app) return;

  app.addEventListener("touchstart", (e) => {
    if (isTurning || e.touches.length !== 1) return;
    const target = e.target;
    if (target && ["AUDIO", "VIDEO", "BUTTON", "INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchDeltaX = 0;
    touchDragging = true;
  }, { passive: true });

  app.addEventListener("touchmove", (e) => {
    if (!touchDragging || isTurning || e.touches.length !== 1) return;
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    touchDeltaX = x - touchStartX;
    const deltaY = y - touchStartY;

    // Allow normal vertical scroll on long pages.
    if (Math.abs(deltaY) > Math.abs(touchDeltaX) * 1.25) return;
    if (Math.abs(touchDeltaX) > 12) {
      e.preventDefault();
      previewDrag(touchDeltaX);
    }
  }, { passive: false });

  app.addEventListener("touchend", () => {
    if (!touchDragging || isTurning) return;
    touchDragging = false;

    const now = Date.now();
    if (now - lastSwipeTime < 400) {
      clearDragPreview();
      return;
    }

    const width = app.clientWidth || window.innerWidth;
    const threshold = Math.max(72, width * 0.24);

    if (touchDeltaX <= -threshold && currentPage < totalPages) {
      clearDragPreview(false);
      lastSwipeTime = now;
      nextPage();
    } else if (touchDeltaX >= threshold && currentPage > 1) {
      clearDragPreview(false);
      lastSwipeTime = now;
      prevPage();
    } else {
      clearDragPreview(true);
    }

    touchDeltaX = 0;
  }, { passive: true });

  app.addEventListener("touchcancel", () => {
    touchDragging = false;
    touchDeltaX = 0;
    clearDragPreview(true);
  }, { passive: true });
}

setupSwipeNavigation();
function restart() {
  isTurning = false;
  currentPage = 1;
  if (finalAnswer) finalAnswer.textContent = "";
  if (noBtn) noBtn.style.transform = "translate(0, 0)";
  showPage(currentPage, "prev");
}

function flipReason(card) {
  card.classList.toggle("open");
}

function sayYes() {
  if (finalAnswer) finalAnswer.textContent = "You made my heart so happy. I love you 💖";
  heartRain();
}

if (noBtn) {
  noBtn.addEventListener("mouseover", () => {
    const x = Math.floor(Math.random() * 160) - 80;
    const y = Math.floor(Math.random() * 110) - 55;
    noBtn.style.transform = `translate(${x}px, ${y}px)`;
  });

  noBtn.addEventListener("click", () => {
    if (finalAnswer) finalAnswer.textContent = "No is not part of the choices today 😅";
  });
}



function heartRain() {
  for (let i = 0; i < 48; i++) {
    const heart = document.createElement("div");
    heart.textContent = ["💖", "💕", "💗", "🤍", "💘"][Math.floor(Math.random() * 5)];
    heart.style.position = "fixed";
    heart.style.left = Math.random() * 100 + "vw";
    heart.style.top = "-40px";
    heart.style.fontSize = Math.random() * 22 + 18 + "px";
    heart.style.pointerEvents = "none";
    heart.style.transition = "transform 3.1s ease, opacity 3.1s ease";
    heart.style.zIndex = "99";
    document.body.appendChild(heart);

    setTimeout(() => {
      heart.style.transform = `translateY(112vh) rotate(${Math.random() * 360}deg)`;
      heart.style.opacity = "0";
    }, 30);

    setTimeout(() => heart.remove(), 3300);
  }
}


const fallingContainer = document.getElementById("fallingContainer");

const romanticItems = [
  "💖", "💕", "💗", "💘", "🤍",
  "🌸", "🌸", "🌹", "🌷", "🌺",
  "🌼", "💐", "✨"
];

function createFallingItem() {
  if (!fallingContainer) return;

  const item = document.createElement("div");
  item.className = "falling-item";
  item.textContent = romanticItems[Math.floor(Math.random() * romanticItems.length)];

  const size = Math.random() * 20 + 18;
  const duration = Math.random() * 6 + 7;
  const left = Math.random() * 100;
  const drift = Math.random() * 90 - 45;
  const opacity = Math.random() * 0.35 + 0.35;

  item.style.left = `${left}vw`;
  item.style.fontSize = `${size}px`;
  item.style.animationDuration = `${duration}s`;
  item.style.setProperty("--fall-drift", `${drift}px`);
  item.style.setProperty("--fall-opacity", opacity);

  fallingContainer.appendChild(item);

  setTimeout(() => {
    item.remove();
  }, duration * 1000 + 500);
}

setInterval(createFallingItem, 430);

for (let i = 0; i < 16; i++) {
  setTimeout(createFallingItem, i * 180);
}


// PAGE 10 BACKGROUND MUSIC FADE SYSTEM
// Browser note: True sound autoplay can be blocked until the first tap/click.
// This code attempts autoplay immediately, then retries on the first user interaction.
const bgMusicAuto = document.getElementById("bgMusic");
const finalSongAuto = document.getElementById("finalSong");

let bgMusicStarted = false;
let bgMusicFading = false;
let finalSongStarted = false;

function startBackgroundMusic() {
  if (!bgMusicAuto || bgMusicFading) return;

  bgMusicAuto.loop = true;
  bgMusicAuto.volume = 1;

  const playPromise = bgMusicAuto.play();

  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        bgMusicStarted = true;
      })
      .catch(() => {
        // Browser blocked autoplay. It will retry after first tap/click/touch.
      });
  }
}

function fadeOutBackgroundMusicThenPlayFinalSong() {
  if (!bgMusicAuto || bgMusicFading) return;

  bgMusicFading = true;

  let volume = bgMusicAuto.volume || 1;
  const fadeInterval = setInterval(() => {
    volume -= 0.04;
    bgMusicAuto.volume = Math.max(volume, 0);

    if (volume <= 0) {
      clearInterval(fadeInterval);
      bgMusicAuto.pause();
      bgMusicAuto.currentTime = 0;

    }
  }, 220);
}

// Music starts after opening the envelope. Browser may still require the tap gesture.

// Retry after any first interaction if browser blocked autoplay.
["click", "touchstart", "keydown"].forEach((eventName) => {
  document.addEventListener(eventName, () => {
    if (!bgMusicStarted && !bgMusicFading) {
      startBackgroundMusic();
    }
  }, { once: true });
});

// Hook into the existing page navigation.
const originalShowPageForMusicFade = typeof showPage === "function" ? showPage : null;

if (originalShowPageForMusicFade) {
  showPage = function(page, direction = "next") {
    originalShowPageForMusicFade(page, direction);

    if (page === 5) {
      fadeOutBackgroundMusicThenPlayFinalSong();
    }
  };
}

// Small page numbers for a real scrapbook/book feeling.
document.querySelectorAll(".page").forEach((page, index) => {
  if (!page.querySelector(".page-number-corner")) {
    const num = document.createElement("span");
    num.className = "page-number-corner";
    num.textContent = `${index + 1}`;
    page.appendChild(num);
  }
});

// Desktop fallback: arrow keys also turn the book.
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") nextPage();
  if (e.key === "ArrowLeft") prevPage();
});
