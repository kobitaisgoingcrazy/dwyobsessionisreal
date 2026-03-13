const bgm = document.getElementById("bgm");
let audioStopTimer;
const AUDIO_PREVIEW_MS = 6500;
let audioPreviewActive = false;
const playlistPrev = document.getElementById("playlistPrev");
const playlistNext = document.getElementById("playlistNext");
const playlistTrack = document.getElementById("playlistTrack");
const playlistArtist = document.getElementById("playlistArtist");
const playlistCover = document.getElementById("playlistCover");
const draggableIpod = document.getElementById("draggableIpod");
const ipodStage = document.querySelector(".ipod-footer");
const revealNodes = document.querySelectorAll(".reveal");
const pollFills = document.querySelectorAll(".poll-fill");
const cameraLaunch = document.getElementById("cameraLaunch");
const cameraPlayer = document.getElementById("cameraPlayer");
const cameraIframe = document.getElementById("cameraIframe");

const playlistTracks = [
  { title: "จบไม่จบ (Someday, Say Yes)", artist: "PROXIE", art: "url('/static/images/covers/Screenshot 2026-03-10 205056.png') center/cover no-repeat" },
  { title: "Take Our Time", artist: "JINWOOK OF BUS, PHUTATCHAI OF BUS", art: "url('/static/images/covers/Screenshot 2026-03-10 205826.png') center/cover no-repeat" },
  { title: "ไม่สู้แต่ไม่ถอย (Don't Give Up)", artist: "TEETEE", art: "url('/static/images/covers/Screenshot 2026-03-10 205913.png') center/cover no-repeat" },
  { title: "BOOM 1000%", artist: "TEETEE, North Chatchapon, Wave Thanapon", art: "url('/static/images/covers/Screenshot 2026-03-10 205940.png') center/cover no-repeat" },
  { title: "จังหวะยอมรัก (Heart's Timing)", artist: "Por Suppakarn", art: "url('/static/images/covers/Screenshot 2026-03-10 210019.png') center/cover no-repeat" },
  { title: "สิ่งที่แสนดี", artist: "Tattoo Colour", art: "url('/static/images/covers/sing-tee-saen-dee.png') center/cover no-repeat" },
  { title: "จะรักฉันอยู่ไหม", artist: "NuNew", art: "url('/static/images/covers/Screenshot 2026-03-10 210054.png') center/cover no-repeat" },
  { title: "ใกล้ใจ", artist: "Por Suppakarn", art: "url('/static/images/covers/Screenshot 2026-03-10 210110.png') center/cover no-repeat" },
  { title: "17", artist: "Dept", art: "url('/static/images/covers/Screenshot 2026-03-10 210123.png') center/cover no-repeat" },
  { title: "Her", artist: "YENTED, ARARYOZI, Chocolate - t", art: "url('/static/images/covers/Screenshot 2026-03-10 210139.png') center/cover no-repeat" },
  { title: "น้อมรับคำทำนาย - THE SUN", artist: "Praesun, GUYGEEGEE", art: "url('/static/images/covers/Screenshot 2026-03-10 210151.png') center/cover no-repeat" },
  { title: "เธอ ๆ เพื่อนเราชอบ (Guess Who?)", artist: "SERIOUS BACON", art: "url('/static/images/covers/Screenshot 2026-03-10 210201.png') center/cover no-repeat" },
  { title: "Someone Someday", artist: "PROXIE", art: "url('/static/images/covers/Screenshot 2026-03-10 210210.png') center/cover no-repeat" },
  { title: "14CM.", artist: "Polycat", art: "url('/static/images/covers/Screenshot 2026-03-10 210221.png') center/cover no-repeat" },
  { title: "ใจเย็น", artist: "Pancake", art: "url('/static/images/covers/Screenshot 2026-03-10 210231.png') center/cover no-repeat" },
  { title: "วันศุกร์", artist: "Plastic Plastic", art: "url('/static/images/covers/Screenshot 2026-03-10 210242.png') center/cover no-repeat" },
  { title: "ว้าวุ่น (On A Date)", artist: "YENTED", art: "url('/static/images/covers/Screenshot 2026-03-10 210253.png') center/cover no-repeat" },
  { title: "Baby", artist: "ADOY", art: "url('/static/images/covers/Screenshot 2026-03-10 210303.png') center/cover no-repeat" },
  { title: "ให้ฉันดูแลเธอ", artist: "รถแห่วงคาราวาน", art: "url('/static/images/covers/Screenshot 2026-03-10 210315.png') center/cover no-repeat" },
  { title: "Obsessed", artist: "PUN, Jaonaay", art: "url('/static/images/covers/Screenshot 2026-03-10 210326.png') center/cover no-repeat" },
  { title: "ปฏิเสธไม่ไหว", artist: "Lipta, No One Else", art: "url('/static/images/covers/Screenshot 2026-03-10 210336.png') center/cover no-repeat" },
  { title: "It's Always You", artist: "Chet Baker", art: "url('/static/images/covers/Screenshot 2026-03-10 210349.png') center/cover no-repeat" },
  { title: "อีกแล้ว", artist: "MEYOU", art: "url('/static/images/covers/Screenshot 2026-03-10 210358.png') center/cover no-repeat" },
  { title: "ชาติหน้าช้าไป (K.O.)", artist: "Dept", art: "url('/static/images/covers/Screenshot 2026-03-10 210409.png') center/cover no-repeat" },
  { title: "เวลา", artist: "Pop Pongkool", art: "url('/static/images/covers/Screenshot 2026-03-10 210422.png') center/cover no-repeat" },
  { title: "เพราะเธอนั้นเป็นเหมือนดั่งโลกทั้งใบ", artist: "Dept", art: "url('/static/images/covers/Screenshot 2026-03-10 210434.png') center/cover no-repeat" },
  { title: "คนเดียวบนโลก (U)", artist: "Anatomy Rabbit", art: "url('/static/images/covers/Screenshot 2026-03-10 210443.png') center/cover no-repeat" },
  { title: "ฟ้าครึ้ม ๆ", artist: "SCRUBB", art: "url('/static/images/covers/Screenshot 2026-03-10 210453.png') center/cover no-repeat" }
];
let playlistIndex = 0;

function updateMusicToggle() {
  return;
}

function renderPlaylistTrack() {
  if (!playlistTrack || !playlistArtist || !playlistCover || !playlistTracks.length) return;
  const currentTrack = playlistTracks[playlistIndex];
  playlistTrack.textContent = currentTrack.title;
  playlistArtist.textContent = currentTrack.artist;
  playlistCover.style.background = currentTrack.art;
}

function stopAudioPreview() {
  clearTimeout(audioStopTimer);
  audioPreviewActive = false;
  if (!bgm) return;
  bgm.pause();
  bgm.currentTime = 0;
  updateMusicToggle();
}

function startAudio() {
  if (!bgm) return;
  clearTimeout(audioStopTimer);
  bgm.pause();
  bgm.currentTime = 0;
  bgm.volume = 0.35;

  const beginPreview = () => {
    audioPreviewActive = true;
    bgm.play().then(() => {
      audioStopTimer = setTimeout(stopAudioPreview, AUDIO_PREVIEW_MS);
      updateMusicToggle();
    }).catch(() => {
      audioPreviewActive = false;
    });
  };

  if (bgm.readyState >= 2) {
    beginPreview();
    return;
  }

  audioPreviewActive = true;
  bgm.addEventListener("canplaythrough", beginPreview, { once: true });
  bgm.load();
}

function spawn(char) {
  const el = document.createElement("div");
  el.className = "float";
  el.textContent = char;
  el.style.left = `${Math.random() * 95}vw`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

let love = 18;
const fill = document.getElementById("fill");
const meterText = document.getElementById("meterText");
const secret = document.getElementById("secret");

document.getElementById("addLove").onclick = () => {
  startAudio();
  love = Math.min(100, love + 7);
  fill.style.width = `${love}%`;
  meterText.textContent = `Love Level: ${love}%`;
  spawn("\uD83D\uDC0B");
  if (love >= 90) secret.style.display = "block";
};

document.getElementById("heartBtn").onclick = () => {
  startAudio();
  const chars = ["\uD83D\uDC97", "\uD83D\uDC95", "\u2728"];
  for (let i = 0; i < 12; i++) {
    setTimeout(() => spawn(chars[i % chars.length]), i * 80);
  }
};

if (playlistPrev && playlistNext) {
  renderPlaylistTrack();

  const showPrevTrack = () => {
    playlistIndex = (playlistIndex - 1 + playlistTracks.length) % playlistTracks.length;
    renderPlaylistTrack();
  };

  const showNextTrack = () => {
    playlistIndex = (playlistIndex + 1) % playlistTracks.length;
    renderPlaylistTrack();
  };

  playlistPrev.addEventListener("pointerup", showPrevTrack);
  playlistNext.addEventListener("pointerup", showNextTrack);
  playlistPrev.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") showPrevTrack();
  });
  playlistNext.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") showNextTrack();
  });
}

if (draggableIpod && ipodStage) {
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let initialLeft = 0;
  let initialTop = 0;

  const clampPosition = (left, top) => {
    const maxLeft = Math.max(0, ipodStage.clientWidth - draggableIpod.offsetWidth);
    const maxTop = Math.max(0, ipodStage.clientHeight - draggableIpod.offsetHeight);
    return {
      left: Math.min(Math.max(0, left), maxLeft),
      top: Math.min(Math.max(0, top), maxTop)
    };
  };

  const updatePosition = (clientX, clientY) => {
    if (!dragging) return;
    const next = clampPosition(initialLeft + (clientX - startX), initialTop + (clientY - startY));
    draggableIpod.style.left = `${next.left}px`;
    draggableIpod.style.top = `${next.top}px`;
    draggableIpod.style.transform = "none";
  };

  const startDrag = (clientX, clientY) => {
    dragging = true;
    draggableIpod.classList.add("dragging");
    startX = clientX;
    startY = clientY;
    initialLeft = draggableIpod.offsetLeft;
    initialTop = draggableIpod.offsetTop;
  };

  const stopDrag = () => {
    dragging = false;
    draggableIpod.classList.remove("dragging");
  };

  draggableIpod.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".ipod-hotspot")) return;
    startDrag(event.clientX, event.clientY);
  });

  window.addEventListener("pointermove", (event) => updatePosition(event.clientX, event.clientY));
  window.addEventListener("pointerup", stopDrag);
  window.addEventListener("pointercancel", stopDrag);
}

if (bgm) {
  bgm.addEventListener("ended", () => {
    clearTimeout(audioStopTimer);
    audioPreviewActive = false;
    updateMusicToggle();
  });
}

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
  if (type === "duang") d += 1; else qn += 1;
  qi += 1;
  if (qi < qs.length) {
    renderQ();
    return;
  }
  aBtn.style.display = "none";
  bBtn.style.display = "none";
  qText.textContent = "Quiz complete!";
  qResult.textContent = d >= qn ? "Result: DUANG energy 💙" : "Result: QUIN energy ❤️";
}

aBtn.onclick = () => pick(qs[qi].a[1]);
bBtn.onclick = () => pick(qs[qi].b[1]);
renderQ();

let t = 0;
document.getElementById("title").onclick = () => {
  startAudio();
  t += 1;
  spawn("✨");
  if (t === 5) {
    alert("Easter Egg: duangquin teeteeetee duang!");
    t = 0;
  }
};

const notePool = [
  "Duang: Qin, drink this first. You look tired. Qin: You noticed again.",
  "Qin: Why are you smiling at me? Duang: Seeing you is already a good day.",
  "Duang: Come here, Qin. I owe you one warm hug and one silly joke.",
  "Qin: You are clingy today. Duang: Only because you are my calm place.",
  "Duang: If your heart feels loud, hold my hand until it slows down.",
  "Qin: Do not overdo things for me. Duang: Too late, I love doing them.",
  "Duang: You look cute in my shirt. Qin: Then stop staring and zip it for me.",
  "Qin: Why count everything I say? Duang: Because every word from you matters.",
  "Duang: If it rains, we stay in, share snacks, and be dramatic together.",
  "Qin: You are impossible. Duang: Correct, but only with you.",
  "Duang: Tell me honestly, are you upset? Qin: A little. Stay close.",
  "Qin: Do not get sick again. Duang: Then keep taking care of me forever.",
  "Duang: Your voice is my favorite evening song, Qin.",
  "Qin: You really are soft with me. Duang: Because you are my person.",
  "Duang: You nag like a wife. Qin: And you still smile every time.",
  "Qin: Why are you so patient today? Duang: Loving you taught me patience.",
  "Duang: If the world gets noisy, we choose quiet together.",
  "Qin: Stop flirting in public. Duang: Then walk closer so I can whisper.",
  "Duang: I brought your favorite drink. Qin: You always remember the small things.",
  "Qin: You look proud. Duang: I am proud to be yours.",
  "Duang: Give me one minute of your time. Qin: Take all of it.",
  "Qin: Why are your ears red? Duang: You called my name too gently.",
  "Duang: You make ordinary days feel like a festival, Qin.",
  "Qin: Should we act normal? Duang: We can try tomorrow.",
  "Duang: Hold still, Qin. Let me fix your hair.",
  "Qin: Are you jealous? Duang: I am human, but I trust you.",
  "Duang: Sit by me while I work. Qin: I only came to steal your shoulder.",
  "Qin: You are laughing alone again. Duang: I remembered your sleepy face.",
  "Duang: Promise me soft love, honest words, and silly nights.",
  "Qin: I missed you. Duang: I counted minutes until this hug.",
  "Duang: If you are hurt, tell me first. Qin: If you are hurt, same rule.",
  "Qin: You always say I am cute. Duang: Because you always are.",
  "Duang: Let me drive, Qin. You rest and hold my hand.",
  "Qin: Do not spoil me too much. Duang: I plan to spoil you more.",
  "Duang: Your smile is dangerous. Qin: Dangerous how? Duang: I lose focus.",
  "Qin: You are staring again. Duang: I am memorizing home.",
  "Duang: Tonight we heal with tea, music, and no overthinking.",
  "Qin: Can we stay like this a bit longer? Duang: As long as you want.",
  "Duang: Even your silence is kind to me, Qin.",
  "Qin: Why do I feel safe here? Duang: Because I will not let go."
];

const allImages = JSON.parse(document.getElementById("images-data").textContent).filter((item) => item && item.file);
const gallery = document.getElementById("gallery");
const trigger = document.getElementById("scrollTrigger");
let idx = 0;
const batchSize = 12;
let io;
let noteIdx = 0;

function attachDoubleTap(card) {
  let lastTap = 0;
  const toggle = () => card.classList.toggle("show-note");
  card.addEventListener("dblclick", toggle);
  card.addEventListener("touchend", () => {
    const now = Date.now();
    if (now - lastTap < 320) toggle();
    lastTap = now;
  }, { passive: true });
  card.querySelector(".note-hint").addEventListener("click", toggle);
}

function addBatch() {
  if (!allImages.length || idx >= allImages.length) return;

  for (let n = 0; n < batchSize && idx < allImages.length; n += 1) {
    const image = allImages[idx++];
    const note = notePool[noteIdx % notePool.length];
    noteIdx += 1;
    const card = document.createElement("article");
    card.className = "photo-card";
    card.style.setProperty("--tilt", `${(Math.random() * 8 - 4).toFixed(2)}deg`);
    card.style.setProperty("--delay", `${(Math.random() * 1.8).toFixed(2)}s`);
    const cardIndex = idx - 1;
    if (cardIndex % 7 === 0) card.classList.add("is-featured");
    else if (cardIndex % 5 === 0) card.classList.add("is-wide");
    else if (cardIndex % 4 === 0) card.classList.add("is-tall");
    card.innerHTML = `
      <span class="ribbon" aria-hidden="true"></span>
      <img src="/static/images/${encodeURIComponent(image.file)}" alt="${image.alt}">
      <p>${image.title}</p>
      <button type="button" class="note-hint">Tap it for your own good^^</button>
      <div class="love-note">${image.caption}<br><br>${note}</div>
    `;
    attachDoubleTap(card);
    gallery.appendChild(card);
  }

  if (idx >= allImages.length && io) io.disconnect();
}

shuffleList(allImages);
shuffleList(notePool);
addBatch();

io = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) addBatch();
}, { rootMargin: "260px" });
io.observe(trigger);

pollFills.forEach((fillBar) => {
  requestAnimationFrame(() => {
    fillBar.style.width = `${fillBar.dataset.width}%`;
  });
});

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");
    observer.unobserve(entry.target);
  });
}, { threshold: 0.16, rootMargin: "0px 0px -40px 0px" });
revealNodes.forEach((node) => revealObserver.observe(node));

if (cameraLaunch && cameraPlayer && cameraIframe) {
  cameraLaunch.addEventListener("click", () => {
    const embedUrl = cameraLaunch.dataset.embedUrl;
    if (!embedUrl) return;
    cameraIframe.src = embedUrl;
    cameraPlayer.classList.remove("is-hidden");
    cameraLaunch.classList.add("is-hidden");
  });
}

document.querySelectorAll("form[data-persist-key]").forEach((form) => {
  const persistKey = form.dataset.persistKey;
  const storageKey = `duang_with_you_${persistKey}`;
  if (window.localStorage.getItem(storageKey)) {
    form.querySelectorAll("button").forEach((button) => {
      button.disabled = true;
      button.textContent = persistKey === "vote" ? "Vote saved on this device" : "Reaction saved on this device";
    });
  }

  form.addEventListener("submit", () => {
    window.localStorage.setItem(storageKey, "1");
  });
});
