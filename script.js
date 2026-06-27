let currentPage = 1;
const totalPages = 9;

const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const noBtn = document.getElementById("noBtn");
const finalAnswer = document.getElementById("finalAnswer");
const musicBtn = document.getElementById("musicBtn");
const bgMusic = document.getElementById("bgMusic");

function showPage(page) {
  document.querySelectorAll(".page").forEach(section => {
    section.classList.remove("active");
  });

  document.getElementById(`page${page}`).classList.add("active");

  // Enable full-page mobile scrolling only on the long song/message pages.
  // This fixes Android Chrome when the message is longer than the screen.
  document.body.classList.toggle("long-scroll", page === 8 || page === 9);
  if (page === 8 || page === 9) {
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  progressText.textContent = `${page} / ${totalPages}`;
  progressFill.style.width = `${(page / totalPages) * 100}%`;
}

function nextPage() {
  if (currentPage < totalPages) {
    currentPage++;
    showPage(currentPage);
  }
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    showPage(currentPage);
  }
}

function restart() {
  currentPage = 1;
  if (finalAnswer) finalAnswer.textContent = "";
  if (noBtn) noBtn.style.transform = "translate(0, 0)";
  showPage(currentPage);
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

// Attempt autoplay immediately.
window.addEventListener("load", () => {
  startBackgroundMusic();
});

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
  showPage = function(page) {
    originalShowPageForMusicFade(page);

    if (page === 5) {
      fadeOutBackgroundMusicThenPlayFinalSong();
    }
  };
}
