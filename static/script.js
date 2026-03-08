const bgm = document.getElementById("bgm");
let started = false;

function startAudio() {
  if (started) return;
  bgm.volume = 0.35;
  bgm.play().catch(() => {});
  started = true;
}

function spawn(char) {
  const el = document.createElement("div");
  el.className = "float";
  el.textContent = char;
  el.style.left = Math.random() * 95 + "vw";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// Love meter
let love = 18;
const fill = document.getElementById("fill");
const meterText = document.getElementById("meterText");
const secret = document.getElementById("secret");

document.getElementById("addLove").onclick = () => {
  startAudio();
  love = Math.min(100, love + 7);
  fill.style.width = love + "%";
  meterText.textContent = `Love Level: ${love}%`;
  spawn("*");
  if (love >= 90) secret.style.display = "block";
};

document.getElementById("heartBtn").onclick = () => {
  startAudio();
  const chars = ["<3", "o", "*"];
  for (let i = 0; i < 12; i++) {
    setTimeout(() => spawn(chars[i % chars.length]), i * 80);
  }
};

// Quiz
const qs = [
  { q: "Crush seen with someone else?", a: ["Act calm, overthink later", "duang"], b: ["Instant jealousy mode", "quin"] },
  { q: "No reply for hours?", a: ["Pretend okay", "duang"], b: ["Double text now", "quin"] },
  { q: "They post a selfie?", a: ["Like quietly", "duang"], b: ["Zoom + investigate", "quin"] },
  { q: "They said 'we need to talk'?", a: ["Breathe + stay soft", "duang"], b: ["Panic mode immediately", "quin"] },
  { q: "They liked your old photo?", a: ["Smile and move on", "duang"], b: ["Overanalyze meaning", "quin"] },
  { q: "Date night plan canceled?", a: ["Suggest another day", "duang"], b: ["Assume worst case", "quin"] },
  { q: "You saw them online at 2AM?", a: ["Ignore and rest", "duang"], b: ["Ask who they chatted with", "quin"] },
  { q: "Gift from them arrives?", a: ["Treasure it quietly", "duang"], b: ["Post 10 stories now", "quin"] },
  { q: "They say 'I miss you'?", a: ["Reply sweetly", "duang"], b: ["Reply in all caps", "quin"] },
  { q: "You two argue a bit?", a: ["Talk calmly later", "duang"], b: ["Send 7 long texts", "quin"] },
  { q: "They forgot a tiny detail?", a: ["Let it slide", "duang"], b: ["Bring receipts", "quin"] },
  { q: "You hear a rumor?", a: ["Ask directly, kindly", "duang"], b: ["Stalk for clues", "quin"] },
  { q: "They call you cute nickname?", a: ["Blush quietly", "duang"], b: ["Replay it 40 times", "quin"] },
  { q: "Rainy day together?", a: ["Tea and chill", "duang"], b: ["Dramatic movie mode", "quin"] },
  { q: "They are busy all day?", a: ["Cheer them on", "duang"], b: ["Countdown each minute", "quin"] },
  { q: "Message seen, no reply?", a: ["Wait patiently", "duang"], b: ["Send '?' then 'hello??'", "quin"] },
  { q: "They compliment your look?", a: ["Say thanks softly", "duang"], b: ["Never stop smiling", "quin"] },
  { q: "You pick couple song?", a: ["Calm love song", "duang"], b: ["Maximum heartbreak anthem", "quin"] },
  { q: "They need space tonight?", a: ["Respect and trust", "duang"], b: ["Think they hate me", "quin"] },
  { q: "You see their ex name?", a: ["Stay secure", "duang"], b: ["Internal sirens on", "quin"] },
  { q: "They send one heart emoji?", a: ["Happy enough", "duang"], b: ["Need five more hearts", "quin"] },
  { q: "Long distance day?", a: ["Plan next call", "duang"], b: ["Cry to playlist", "quin"] },
  { q: "They say 'good night' early?", a: ["Wish sweet dreams", "duang"], b: ["Read tone like detective", "quin"] },
  { q: "You miss them badly?", a: ["Write cute note", "duang"], b: ["Book flight immediately", "quin"] }
];

function shuffleList(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

shuffleList(qs);
let qi = 0;
let d = 0;
let qn = 0;
const qText = document.getElementById("qText");
const aBtn = document.getElementById("aBtn");
const bBtn = document.getElementById("bBtn");
const qResult = document.getElementById("qResult");

function renderQ() {
  qText.textContent = qs[qi].q;
  aBtn.textContent = qs[qi].a[0];
  bBtn.textContent = qs[qi].b[0];
  qResult.textContent = `Question ${qi + 1} of ${qs.length}`;
}

function pick(type) {
  startAudio();
  if (type === "duang") d++; else qn++;
  qi++;
  if (qi < qs.length) return renderQ();
  aBtn.style.display = "none";
  bBtn.style.display = "none";
  qText.textContent = "Quiz complete!";
  qResult.textContent = d >= qn ? "Result: DUANG energy" : "Result: QUIN energy";
}

aBtn.onclick = () => pick(qs[qi].a[1]);
bBtn.onclick = () => pick(qs[qi].b[1]);
renderQ();

// Title easter egg
let t = 0;
document.getElementById("title").onclick = () => {
  startAudio();
  t++;
  spawn("*");
  if (t === 5) {
    alert("Easter Egg: duangquin teeteeetee duang!");
    t = 0;
  }
};

// Polaroid notes
const notePool = [
  "Duang: If you are tired, come sit here. Me: Only if I can keep your hand.",
  "Duang: We should act normal. Me: Too late, my smile already told on us.",
  "Duang: You look serious today. Me: I am serious about loving you.",
  "Duang: One kiss? Me: Approved. But interest grows every minute.",
  "Duang: Why are you staring? Me: I am collecting comfort for rainy days.",
  "Duang: I brought snacks. Me: Perfect, now bring your shoulder too.",
  "Duang: Be honest, am I dramatic? Me: Yes, and that is my favorite genre.",
  "Duang: Promise me forever? Me: I already wrote your name on it.",
  "Duang: I missed you. Me: I counted every minute like a tiny poem.",
  "Duang: We should sleep early. Me: After one more silly conversation.",
  "Duang: Why are you smiling like that? Me: Because you exist.",
  "Duang: What is your safe place? Me: Right beside your heartbeat."
];

// Infinite floating polaroid gallery
const allImages = JSON.parse(document.getElementById("images-data").textContent);
const gallery = document.getElementById("gallery");
const trigger = document.getElementById("scrollTrigger");
let idx = 0;
const batchSize = 12;
let io;

function attachDoubleTap(card) {
  let lastTap = 0;

  const toggle = () => {
    card.classList.toggle("show-note");
    startAudio();
  };

  card.addEventListener("dblclick", toggle);

  card.addEventListener("touchend", () => {
    const now = Date.now();
    if (now - lastTap < 320) toggle();
    lastTap = now;
  }, { passive: true });

  const hintBtn = card.querySelector(".note-hint");
  hintBtn.addEventListener("click", toggle);
}

function addBatch() {
  if (!allImages.length || idx >= allImages.length) return;

  for (let n = 0; n < batchSize && idx < allImages.length; n++) {
    const file = allImages[idx++];
    const note = notePool[Math.floor(Math.random() * notePool.length)];

    const card = document.createElement("article");
    card.className = "photo-card";
    card.style.setProperty("--tilt", `${(Math.random() * 8 - 4).toFixed(2)}deg`);
    card.style.setProperty("--delay", `${(Math.random() * 1.8).toFixed(2)}s`);
    card.innerHTML = `
      <span class="ribbon" aria-hidden="true"></span>
      <img src="/static/images/${encodeURIComponent(file)}" alt="${file}">
      <p>Duang With You</p>
      <button type="button" class="note-hint">Double tap for a note</button>
      <div class="love-note">${note}</div>
    `;

    attachDoubleTap(card);
    gallery.appendChild(card);
  }

  if (idx >= allImages.length) {
    if (io) io.disconnect();
  }
}

shuffleList(allImages);
addBatch();

io = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) addBatch();
}, { rootMargin: "260px" });

io.observe(trigger);



