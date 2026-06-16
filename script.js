let currentPage = 1;
const totalPages = 11;

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

musicBtn.addEventListener("click", () => {
  if (bgMusic.paused) {
    bgMusic.play().catch(() => {});
    musicBtn.textContent = "♫ Playing";
  } else {
    bgMusic.pause();
    musicBtn.textContent = "♫ Music";
  }
});

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
