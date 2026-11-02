(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Barre de navigation opaque dès qu'on défile
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 30);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Apparitions au défilement, décalées dans chaque groupe
  const groups = new Map();
  for (const el of document.querySelectorAll(".reveal")) {
    const parent = el.parentElement;
    const i = groups.get(parent) ?? 0;
    groups.set(parent, i + 1);
    el.style.setProperty("--d", `${Math.min(i, 8) * 0.07}s`);
  }
  const seen = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("in");
      seen.unobserve(e.target);
    }
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal").forEach((el) => seen.observe(el));

  // Étoiles scintillantes
  const canvas = document.getElementById("stars");
  const ctx = canvas.getContext("2d");
  let stars = [];
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round((innerWidth * innerHeight) / 9000);
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      r: Math.random() * 1.2 + 0.2,
      t: Math.random() * Math.PI * 2,
      s: Math.random() * 0.02 + 0.005,
    }));
  };
  const draw = () => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const s of stars) {
      s.t += s.s;
      ctx.globalAlpha = 0.25 + Math.sin(s.t) * 0.25 + 0.2;
      ctx.beginPath();
      ctx.arc(s.x, s.y - (scrollY * 0.05) % innerHeight, s.r, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
    }
    if (!reduced) requestAnimationFrame(draw);
  };
  addEventListener("resize", resize);
  resize();
  draw();

  // Lecteur : inclinaison au survol, progression et titres qui changent
  const player = document.getElementById("player");
  const visual = player.parentElement;
  if (!reduced && matchMedia("(pointer: fine)").matches) {
    visual.addEventListener("pointermove", (e) => {
      const r = visual.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      player.style.setProperty("--ry", `${x * 22}deg`);
      player.style.setProperty("--rx", `${-y * 18}deg`);
    });
    visual.addEventListener("pointerleave", () => {
      player.style.removeProperty("--ry");
      player.style.removeProperty("--rx");
    });
  }
  const tracks = [
    ["Nuages de minuit", "Les Rêveurs Électriques", 228],
    ["Cumulus", "Orchestre de Poche", 194],
    ["Pluie sur le toit", "Marie et les Ondes", 251],
    ["Altitude", "Soleil Binaire", 207],
  ];
  const bar = document.getElementById("bar");
  const elapsed = document.getElementById("elapsed");
  const title = document.getElementById("track");
  const artist = document.getElementById("artist");
  const total = player.querySelector(".times span:last-child");
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  let ti = 0;
  let pos = 72;
  setInterval(() => {
    const [, , len] = tracks[ti];
    pos += reduced ? 0 : 1.5;
    if (pos >= len) {
      ti = (ti + 1) % tracks.length;
      pos = 0;
      title.style.opacity = artist.style.opacity = 0;
      setTimeout(() => {
        title.textContent = tracks[ti][0];
        artist.textContent = tracks[ti][1];
        total.textContent = fmt(tracks[ti][2]);
        title.style.opacity = artist.style.opacity = 1;
      }, 400);
    }
    bar.style.width = `${(pos / tracks[ti][2]) * 100}%`;
    elapsed.textContent = fmt(pos);
  }, 100);

  // Halo qui suit le pointeur sur les cartes
  for (const card of document.querySelectorAll(".card")) {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  }

  // Terminal : les commandes se tapent quand il devient visible, l'étape correspondante s'allume
  const term = document.getElementById("term");
  const steps = document.querySelectorAll(".step");
  const script = [
    { step: 0, c: "# 1. Récupérer le déploiement" },
    { step: 0, cmd: "git clone https://github.com/SonNuage/sonnuage.git" },
    { step: 0, cmd: "cd sonnuage/deploy && cp .env.example .env" },
    { step: 1, c: "# 2. Votre musique, votre mot de passe, votre tunnel" },
    { step: 1, cmd: "nano .env" },
    { step: 1, kv: ["MUSIC_DIR", "/srv/musique"] },
    { step: 1, kv: ["SONNUAGE_ADMIN_PASSWORD", "••••••••••••"] },
    { step: 1, kv: ["CLOUDFLARE_TUNNEL_TOKEN", "eyJhIjoi…"] },
    { step: 2, c: "# 3. Démarrer" },
    { step: 2, cmd: "docker compose up -d" },
    { step: 2, ok: " ✔ Container sonnuage          Healthy" },
    { step: 2, ok: " ✔ Container sonnuage-tunnel   Started" },
    { step: 2, out: "\n→ Ouvrez https://musique.mondomaine.fr : c'est prêt." },
  ];
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const lineHtml = (l, text) => {
    if (l.c) return `<span class="c">${esc(text)}</span>`;
    if (l.cmd) return `<span class="p">$</span> ${esc(text)}`;
    if (l.kv) return `  <span class="k">${l.kv[0]}</span>=<span class="v">${esc(text)}</span>`;
    if (l.ok) return `<span class="ok">${esc(text)}</span>`;
    return esc(text);
  };
  const full = (l) => l.c ?? l.cmd ?? (l.kv ? l.kv[1] : null) ?? l.ok ?? l.out;
  const light = (i) => steps.forEach((s, j) => s.classList.toggle("active", j === i));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const play = async () => {
    if (reduced) {
      term.innerHTML = script.map((l) => lineHtml(l, full(l))).join("\n");
      return;
    }
    let done = "";
    for (const l of script) {
      light(l.step);
      const text = full(l);
      const typed = l.cmd || l.kv;
      if (typed) {
        for (let i = 1; i <= text.length; i++) {
          term.innerHTML = done + lineHtml(l, text.slice(0, i)) + '<span class="cursor"></span>';
          await sleep(l.kv ? 22 : 34);
        }
        await sleep(l.cmd ? 380 : 120);
      } else {
        await sleep(l.ok ? 520 : 200);
      }
      done += lineHtml(l, text) + "\n";
      term.innerHTML = done + '<span class="cursor"></span>';
    }
    await sleep(5000);
    term.innerHTML = "";
    play();
  };
  new IntersectionObserver((entries, obs) => {
    if (entries.some((e) => e.isIntersecting)) {
      obs.disconnect();
      play();
    }
  }, { threshold: 0.4 }).observe(term);

  // Compteurs
  const counter = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      counter.unobserve(e.target);
      const el = e.target;
      const to = Number(el.dataset.to);
      const from = Number(el.dataset.from ?? 0);
      if (reduced) { el.textContent = to; continue; }
      const t0 = performance.now();
      const tick = (now) => {
        const k = Math.min((now - t0) / 1400, 1);
        const eased = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(from + (to - from) * eased);
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, { threshold: 0.6 });
  document.querySelectorAll(".count").forEach((el) => counter.observe(el));
})();
