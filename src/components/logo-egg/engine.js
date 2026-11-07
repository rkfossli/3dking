// Påskeegget i logoen.
// Trykk 1: sprekk. Trykk 2: en bit faller litt ned. Trykk 3: hele logoen raser ned til bunnen av skjermen.
// Etter 5 sekunder kommer den tilbake gjennom røyk.
// Det finnes tre varianter (Knust glass, Feilprint og Krona faller), og hver gang velges en tilfeldig.
//
// Slik virker det: vi legger et lag over hele skjermen (pointer-events: none, så trykk går gjennom).
// Logoen deles opp i biter (div-er som viser hver sin del av logobildet), og bitene flyttes med
// enkel fysikk: fart, tyngdekraft og sprett mot "gulvet" nederst på skjermen.
// Røyk, gnister og sand tegnes på et <canvas>.
//
// Alle mål inne i "verden" er i logoens egne piksler: logoen er 600 x 314.

const LW = 600;
const LH = 314;
const KINDS = ["glass", "voxel", "crown"];
let lastKind = null;

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const E = {
  io: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: (t) => 1 - Math.pow(1 - t, 3),
  lin: (t) => t,
  bounce: (t) => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  },
};
function tween(ms, fn, ease = E.io) {
  return new Promise((res) => {
    const t0 = performance.now();
    const f = (now) => {
      const t = Math.min(1, (now - t0) / ms);
      fn(ease(t), t);
      if (t < 1) requestAnimationFrame(f);
      else res();
    };
    requestAnimationFrame(f);
  });
}
function buzz(ms) {
  try {
    navigator.vibrate?.(ms);
  } catch {}
}

// Er punktet (x, y) inne i mangekanten pts?
function pip(x, y, pts) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

// Mykt, rundt røykbilde som tegnes mange ganger.
function sprite(rgb) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, `rgba(${rgb},1)`);
  gr.addColorStop(0.45, `rgba(${rgb},.45)`);
  gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return c;
}
function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "13,247,98";
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

/**
 * Starter påskeegget for et logobilde. Returnerer { tap } som kalles for hvert trykk.
 * onDone kalles når logoen er tilbake og alt er ryddet bort.
 */
export function createEgg(img, onDone) {
  const kinds = KINDS.filter((k) => k !== lastKind);
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  lastKind = kind;
  return new Egg(img, kind, onDone);
}

class Egg {
  constructor(img, kind, onDone) {
    this.img = img;
    this.kind = kind;
    this.onDone = onDone;
    this.state = 0;
    this.locked = false;
    this.alive = true;
    this.pieces = [];
    this.smoke = [];
    this.sparks = [];
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Pikseldata fra logoen, så vi vet hvor det faktisk er tegnet noe.
    const c = document.createElement("canvas");
    c.width = LW;
    c.height = LH;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(img, 0, 0, LW, LH);
    this.px = g.getImageData(0, 0, LW, LH).data;

    // Skala: hvor mange skjermpiksler én logopiksel er nå.
    this.s = img.getBoundingClientRect().width / LW;
    // U gjør fart og størrelser like store på skjermen uansett hvor stor logoen er.
    this.U = 0.65 / this.s;
    this.G = 2300 * this.U;

    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent") || "#0df762";
    this.accent = hexToRgb(accent);
    this.SMOKE = sprite("150,160,155");
    this.SMOKE_A = sprite(this.accent);

    // Laget over skjermen
    this.root = document.createElement("div");
    this.root.className = "egg";
    this.root.style.setProperty("--egg-logo", `url(${img.currentSrc || img.src})`);
    this.root.innerHTML =
      '<div class="egg-world"><div class="egg-layer"></div>' +
      '<svg class="egg-cracks" viewBox="0 0 600 314"></svg></div><canvas class="egg-fx"></canvas>';
    this.world = this.root.querySelector(".egg-world");
    this.layer = this.root.querySelector(".egg-layer");
    this.svg = this.root.querySelector("svg");
    this.canvas = this.root.querySelector("canvas");
    this.ctx = this.canvas.getContext("2d");
    document.body.appendChild(this.root);

    this.build();
    this.place();
    this.last = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  A(x, y) {
    x |= 0;
    y |= 0;
    return x < 0 || y < 0 || x >= LW || y >= LH ? 0 : this.px[(y * LW + x) * 4 + 3];
  }

  // Finn boksen rundt det som faktisk er tegnet inni mangekanten.
  contentBox(pts, step = 3, th = 10) {
    let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
    for (const [x, y] of pts) {
      bx0 = Math.min(bx0, x); by0 = Math.min(by0, y); bx1 = Math.max(bx1, x); by1 = Math.max(by1, y);
    }
    bx0 = clamp(bx0, 0, LW); bx1 = clamp(bx1, 0, LW); by0 = clamp(by0, 0, LH); by1 = clamp(by1, 0, LH);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let y = by0; y < by1; y += step)
      for (let x = bx0; x < bx1; x += step)
        if (this.A(x, y) > th && pip(x, y, pts)) {
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
    if (x0 === Infinity) return null;
    return {
      x0: Math.max(bx0, Math.floor(x0 - step)), y0: Math.max(by0, Math.floor(y0 - step)),
      x1: Math.min(bx1, Math.ceil(x1 + step)), y1: Math.min(by1, Math.ceil(y1 + step)),
    };
  }

  makePiece(box, pts) {
    const el = document.createElement("div");
    el.className = "egg-piece";
    const w = box.x1 - box.x0, h = box.y1 - box.y0;
    el.style.cssText = `left:${box.x0}px;top:${box.y0}px;width:${w}px;height:${h}px;background-position:${-box.x0}px ${-box.y0}px`;
    if (pts)
      el.style.clipPath = `polygon(${pts.map((p) => `${(p[0] - box.x0).toFixed(1)}px ${(p[1] - box.y0).toFixed(1)}px`).join(",")})`;
    this.layer.appendChild(el);
    return { el, cx: (box.x0 + box.x1) / 2, cy: (box.y0 + box.y1) / 2, hw: w / 2, hh: h / 2,
      x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0, o: 1, dyn: false, done: false, delay: 0 };
  }

  // Plasser verden oppå logoen (følger med hvis siden scrolles).
  place() {
    const r = this.img.getBoundingClientRect();
    this.rect = r;
    const s = r.width / LW;
    this.sNow = s;
    this.world.style.transform = `translate(${r.left}px,${r.top}px) scale(${s})`;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cw = Math.round(innerWidth * dpr), ch = Math.round(innerHeight * dpr);
    if (this.canvas.width !== cw || this.canvas.height !== ch) {
      this.canvas.width = cw;
      this.canvas.height = ch;
    }
    this.dpr = dpr;
    // Gulvet: nederst på skjermen, over infolinja.
    const bar = document.querySelector(".info-bar");
    const floorScreen = (bar ? bar.getBoundingClientRect().top : innerHeight) - 6;
    this.FLOOR = (floorScreen - r.top) / s;
    this.WALL_L = -r.left / s;
    this.WALL_R = (innerWidth - r.left) / s;
  }

  // ---------- trykk ----------
  tap() {
    if (this.locked || this.state >= 3) return;
    this.state++;
    if (this.state === 1) {
      this.img.classList.add("egg-hidden");
      this.layer.hidden = false;
    }
    this[`${this.kind}${this.state}`]();
    buzz(this.state === 3 ? [30, 40, 60] : 15);
    if (this.state === 3) {
      this.locked = true;
      this.countdown();
    }
  }

  async countdown() {
    await wait(5000);
    try {
      await this[`${this.kind}Back`]();
    } finally {
      this.finish();
    }
  }

  finish() {
    this.alive = false;
    this.img.classList.remove("egg-hidden");
    this.img.style.clipPath = "";
    this.layer.hidden = true;
    this.pulse();
    // La røyken bli ferdig før laget fjernes
    setTimeout(() => {
      this.root.remove();
      this.onDone?.();
    }, 900);
  }

  pulse() {
    this.img.classList.remove("egg-pulse");
    void this.img.offsetWidth;
    this.img.classList.add("egg-pulse");
  }

  shake(k = 1) {
    if (this.reduced) return;
    const f = [];
    for (let i = 0; i < 8; i++) {
      const a = (1 - i / 8) * 5 * k;
      f.push({ transform: `translate(${rand(-a, a)}px,${rand(-a, a)}px)` });
    }
    f.push({ transform: "translate(0,0)" });
    document.body.animate(f, { duration: 380 * Math.sqrt(k) });
  }

  // Tegn en sprekk som "vokser" frem
  crack(pts, delay = 0, dur = 260) {
    const d = "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L");
    for (const [stroke, w] of [["#050605", 3.4], ["rgba(235,255,240,.9)", 1]]) {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", d);
      p.setAttribute("stroke", stroke);
      p.setAttribute("stroke-width", String(w * Math.min(this.U, 2.2)));
      this.svg.appendChild(p);
      const L = p.getTotalLength();
      p.style.strokeDasharray = String(L);
      p.style.strokeDashoffset = String(L);
      p.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], {
        duration: dur, delay, easing: "cubic-bezier(.2,.8,.3,1)", fill: "forwards",
      });
    }
  }

  puff(x, y, n, o = {}) {
    const U = this.U;
    for (let i = 0; i < n; i++)
      this.smoke.push({
        x: x + rand(-(o.sx || 0), o.sx || 0), y: y + rand(-(o.sy || 0), o.sy || 0),
        vx: (rand(-40, 40) + (o.vx || 0)) * U, vy: (rand(-70, -15) + (o.vy || 0)) * U,
        r: rand(o.r0 || 18, o.r1 || 42) * U, gr: rand(25, 70) * (o.grow || 1) * U,
        life: rand(1.1, 2.2) * (o.life || 1), t: 0, a: o.a || 0.5,
        img: Math.random() < (o.green ?? 0.12) ? this.SMOKE_A : this.SMOKE, swirl: o.swirl || 0,
      });
  }

  spark(x, y, n, o = {}) {
    const U = this.U;
    for (let i = 0; i < n; i++) {
      const a = o.dir != null ? o.dir + rand(-(o.spread || 0.6), o.spread || 0.6) : rand(0, Math.PI * 2);
      const sp = rand(o.s0 || 80, o.s1 || 380) * U;
      this.sparks.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 0) * U,
        life: rand(0.35, 0.9) * (o.life || 1), t: 0, size: rand(1.2, 2.8) * U,
        c: o.c || (Math.random() < 0.7 ? this.accent : "235,255,240"), g: o.g ?? 1,
      });
    }
  }

  // Roter en bit rundt et felles punkt (brukes når en hel gruppe tipper)
  aroundPivot(p, px, py, deg, dy = 0, bx = 0) {
    const a = (deg * Math.PI) / 180, rx = p.cx + bx - px, ry = p.cy - py;
    p.x = px + rx * Math.cos(a) - ry * Math.sin(a) - p.cx;
    p.y = py + rx * Math.sin(a) + ry * Math.cos(a) - p.cy + dy;
    p.r = deg;
    apply(p);
  }

  async homeAll(ms, list, spread = 0.3, lift = 0) {
    for (const p of list) {
      p.dyn = false; p.sx = p.x; p.sy = p.y; p.sr = p.r; p.d = Math.random() * spread;
    }
    await tween(ms, (_, t) => {
      for (const p of list) {
        const e = E.io(clamp((t - p.d) / (1 - spread), 0, 1));
        p.x = p.sx * (1 - e);
        p.y = p.sy * (1 - e) - Math.sin(Math.PI * e) * lift;
        p.r = p.sr * (1 - e);
        apply(p);
      }
    }, E.lin);
  }

  // ---------- hver frame ----------
  loop(now) {
    const dt = Math.min(0.033, (now - this.last) / 1000);
    this.last = now;
    this.place();
    this.physics(dt);
    this.draw(dt);
    if (this.root.isConnected) requestAnimationFrame((t) => this.loop(t));
  }

  physics(dt) {
    if (this.kind === "voxel" && this.state === 3 && this.hm) return this.voxelPhysics(dt);
    for (const p of this.pieces) {
      if (!p.dyn || p.done) continue;
      if (p.delay > 0) { p.delay -= dt; continue; }
      p.vy += this.G * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
      const a = (p.r * Math.PI) / 180;
      const ext = Math.abs(p.hw * Math.sin(a)) + Math.abs(p.hh * Math.cos(a));
      if (p.cy + p.y + ext > this.FLOOR) {
        p.y = this.FLOOR - ext - p.cy;
        if (p.vy > 420 * this.U) this.impact(p);
        if (p.vy > 0) p.vy *= -0.3;
        p.vx *= 0.72; p.vr *= 0.55;
        if (Math.abs(p.vy) < 60 * this.U) {
          p.vy = 0; p.vx *= 0.8; p.vr *= 0.7;
          if (Math.abs(p.vx) < 4 * this.U && Math.abs(p.vr) < 4) p.done = true;
        }
      }
      const wx = p.cx + p.x;
      if ((wx - p.hw < this.WALL_L && p.vx < 0) || (wx + p.hw > this.WALL_R && p.vx > 0)) p.vx *= -0.5;
      apply(p);
    }
  }

  impact(p) {
    if (this.kind === "glass" && Math.random() < 0.5)
      this.spark(p.cx + p.x, this.FLOOR - 2, 3, { dir: -Math.PI / 2, spread: 1.1, s0: 60, s1: 220, c: "235,255,240" });
    if (this.kind === "crown") this.puff(p.cx + p.x, this.FLOOR - 6, 3, { r0: 12, r1: 26, a: 0.4, sx: 30, vy: -10 });
  }

  draw(dt) {
    const c = this.ctx, s = this.sNow, d = this.dpr, r = this.rect;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    c.setTransform(d * s, 0, 0, d * s, d * r.left, d * r.top);
    if (this.kind === "crown") this.drawSand(c, dt);
    for (let i = this.smoke.length - 1; i >= 0; i--) {
      const p = this.smoke[i];
      p.t += dt;
      if (p.t > p.life) { this.smoke.splice(i, 1); continue; }
      p.vx *= 0.985; p.vy = p.vy * 0.985 - 12 * this.U * dt;
      if (p.swirl) p.vx += Math.cos(p.t * 3 + p.swirl) * 90 * this.U * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.gr * dt;
      const k = p.t / p.life;
      c.globalAlpha = p.a * Math.min(1, p.t / 0.18) * (1 - k) * (1 - k * 0.3);
      c.drawImage(p.img, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    c.globalCompositeOperation = "lighter";
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const p = this.sparks[i];
      p.t += dt;
      if (p.t > p.life) { this.sparks.splice(i, 1); continue; }
      p.vy += this.G * 0.55 * p.g * dt; p.vx *= 0.98; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.y > this.FLOOR) { p.y = this.FLOOR; p.vy *= -0.35; }
      c.globalAlpha = 1 - p.t / p.life;
      c.fillStyle = `rgb(${p.c})`;
      c.fillRect(p.x, p.y, p.size, p.size);
    }
    c.globalCompositeOperation = "source-over";
    c.globalAlpha = 1;
  }

  build() {
    this.layer.hidden = true;
    if (this.kind === "glass") this.glassBuild();
    if (this.kind === "voxel") this.voxelBuild();
    if (this.kind === "crown") this.crownBuild();
  }

  // =============== 1: KNUST GLASS ===============
  glassBuild() {
    const P = [300, 168], N = 12, R = [0, 58, 140, 270, 800];
    this.P = P;
    const ang = [...Array(N)].map((_, i) => (i / N) * Math.PI * 2 + rand(-0.17, 0.17));
    this.V = ang.map((a) =>
      R.map((r, j) => {
        if (!j) return P;
        const rr = j == 4 ? r : r * rand(0.85, 1.15), aa = a + (j == 4 ? 0 : rand(-0.09, 0.09));
        return [P[0] + Math.cos(aa) * rr, P[1] + Math.sin(aa) * rr];
      }),
    );
    const V = this.V;
    for (let i = 0; i < N; i++) {
      const k = (i + 1) % N;
      for (let j = 0; j < 4; j++) {
        const pts = j == 0 ? [P, V[i][1], V[k][1]] : [V[i][j], V[k][j], V[k][j + 1], V[i][j + 1]];
        const box = this.contentBox(pts);
        if (!box) continue;
        const p = this.makePiece(box, pts);
        p.ring = j;
        this.pieces.push(p);
      }
    }
  }
  glass1() {
    const V = this.V, N = V.length;
    V.forEach((v, i) => this.crack([v[0], v[1], v[2], v[3]], i * 14, 300));
    for (let i = 0; i < N; i++) this.crack([V[i][1], V[(i + 1) % N][1]], 230 + i * 10, 140);
    this.spark(this.P[0], this.P[1], 26, { c: "235,255,240", s0: 60, s1: 300, g: 0.4 });
    this.shake(0.8);
  }
  glass2() {
    const V = this.V, N = V.length;
    for (let i = 0; i < N; i++) if (Math.random() < 0.75) this.crack([V[i][2], V[(i + 1) % N][2]], i * 12, 160);
    let best = null, bd = 1e9;
    for (const p of this.pieces)
      if (p.ring == 2) {
        const d = Math.hypot(p.cx - 470, p.cy - 235);
        if (d < bd) { bd = d; best = p; }
      }
    if (best) {
      tween(700, (e) => { best.y = 24 * e; best.r = 8 * e; apply(best); }, E.bounce);
      setTimeout(() => this.spark(best.cx, best.cy + best.hh, 10, { dir: Math.PI / 2, spread: 1.2, s0: 40, s1: 160, c: "235,255,240" }), 220);
    }
    this.shake(0.5);
  }
  glass3() {
    this.svg.style.opacity = "0";
    const [px, py] = this.P, U = this.U;
    for (const p of this.pieces) {
      const dx = p.cx - px, dy = p.cy - py, d = Math.hypot(dx, dy) || 1, sp = rand(140, 420) * U;
      p.vx = (dx / d) * sp; p.vy = (dy / d) * sp - rand(150, 380) * U; p.vr = rand(-380, 380);
      p.dyn = true; p.done = false;
    }
    this.spark(px, py, 60, { c: "235,255,240", s0: 120, s1: 520 });
    this.shake(2.2);
  }
  async glassBack() {
    const U = this.U;
    for (let i = 0; i < 14; i++) this.puff(rand(40, 560), this.FLOOR - rand(0, 40) * U, 2, { r0: 24, r1: 50, a: 0.55, green: 0.2, sx: 60 * U });
    for (let i = 0; i < 10; i++) this.puff(rand(120, 480), rand(60, 260), 1, { r0: 30, r1: 60, a: 0.35 });
    await wait(380);
    await this.homeAll(1300, this.pieces, 0.35, 40 * U);
    this.spark(300, 165, 40, { s0: 200, s1: 460, g: 0.25 });
    this.puff(300, 165, 6, { sx: 200, sy: 80, r0: 20, r1: 40, a: 0.25, green: 0.6 });
  }

  // =============== 2: FEILPRINT ===============
  voxelBuild() {
    // Kubene skal være omtrent 6 skjermpiksler store
    const T = Math.max(12, Math.round(6 / this.s));
    this.T = T;
    for (let ty = 0; ty < LH; ty += T)
      for (let tx = 0; tx < LW; tx += T) {
        let hit = false;
        for (let y = ty; y < ty + T && !hit; y += 2)
          for (let x = tx; x < tx + T; x += 2)
            if (this.A(x, y) > 14) { hit = true; break; }
        if (!hit) continue;
        const p = this.makePiece({ x0: tx, y0: ty, x1: Math.min(tx + T, LW), y1: Math.min(ty + T, LH) });
        p.crown = ty + T <= 170;
        this.pieces.push(p);
      }
    this.crown = this.pieces.filter((p) => p.crown);
    this.nozzle = document.createElement("div");
    this.nozzle.className = "egg-nozzle";
    this.nozzle.innerHTML = "<i></i><b></b><span></span>";
    this.nozzle.hidden = true;
    this.line = document.createElement("div");
    this.line.className = "egg-layerline";
    this.line.hidden = true;
    this.world.append(this.line, this.nozzle);
  }
  voxel1() {
    tween(420, (e, t) => {
      for (const p of this.crown) { p.x = 12 * e + (t < 0.75 ? rand(-2.5, 2.5) : 0); apply(p); }
    }, E.out);
    this.shake(0.6);
  }
  voxel2() {
    const px = Math.min(...this.crown.map((p) => p.cx - p.hw)) + 12;
    tween(800, (e) => { for (const p of this.crown) this.aroundPivot(p, px, 168, 8 * e, 9 * e, 12); }, E.bounce);
    setTimeout(() => this.puff(470, 175, 4, { r0: 8, r1: 16, a: 0.35, life: 0.6, vy: -20 }), 300);
  }
  voxel3() {
    const U = this.U;
    this.hmL = this.WALL_L;
    this.hm = Array(Math.ceil((this.WALL_R - this.WALL_L) / this.T) + 1).fill(this.FLOOR);
    for (const p of this.pieces) {
      p.dyn = true; p.done = false;
      p.delay = rand(0, 0.32) + (p.crown ? 0.05 : 0.12) * (1 - p.cy / LH);
      p.vx = rand(-80, 80) * U; p.vy = rand(-160, 0) * U; p.vr = rand(-320, 320);
    }
    this.shake(1.8);
  }
  voxelPhysics(dt) {
    const T = this.T, hm = this.hm, n = hm.length;
    for (const p of this.pieces) {
      if (!p.dyn || p.done) continue;
      if (p.delay > 0) { p.delay -= dt; continue; }
      p.vy += this.G * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
      const b = clamp(Math.floor((p.cx + p.x - this.hmL) / T), 0, n - 1);
      if (p.cy + p.y + T / 2 >= hm[b]) {
        // Rull ned til siden hvis naboen er lavere, ellers bli liggende
        if (b > 0 && hm[b - 1] > hm[b] + T) { p.x -= T * 0.5; continue; }
        if (b < n - 1 && hm[b + 1] > hm[b] + T) { p.x += T * 0.5; continue; }
        p.y = hm[b] - T / 2 - p.cy;
        hm[b] -= T;
        p.x = this.hmL + b * T + T / 2 - p.cx;
        p.r = Math.round(p.r / 90) * 90 + rand(-5, 5);
        p.done = true;
        if (Math.random() < 0.08) this.puff(p.cx + p.x, p.cy + p.y, 1, { r0: 6, r1: 14, a: 0.3, life: 0.6 });
      }
      apply(p);
    }
  }
  async voxelBack() {
    const T = this.T;
    for (let b = 0; b < this.hm.length; b += 2)
      if (this.hm[b] < this.FLOOR) this.puff(this.hmL + b * T, this.hm[b], 1, { r0: 22, r1: 44, a: 0.5 });
    await tween(450, (e) => { for (const p of this.pieces) { p.o = 1 - e; apply(p); } });
    this.layer.hidden = true;
    // Dysa printer logoen på nytt nedenfra, lag for lag
    const img = this.img, U = Math.min(this.U, 3);
    img.style.clipPath = "inset(100% 0 0 0)";
    img.classList.remove("egg-hidden");
    this.nozzle.hidden = false;
    this.line.hidden = false;
    this.line.style.height = `${2 * U}px`;
    const top0 = 294, top1 = 28;
    let nx = 300;
    await tween(2700, (e, t) => {
      const top = top0 - (top0 - top1) * e;
      img.style.clipPath = `inset(${(top / LH) * 100}% 0 0 0)`;
      this.line.style.top = `${top - U}px`;
      nx = 300 + 238 * Math.sin(t * Math.PI * 2 * 10);
      this.nozzle.style.transform = `translate(${nx}px,${top}px) scale(${U})`;
      if (Math.random() < 0.35) this.puff(nx, top - 6 * U, 1, { r0: 4, r1: 9, grow: 0.35, a: 0.35, life: 0.55, vy: -30 });
    }, E.lin);
    this.line.hidden = true;
    img.style.clipPath = "";
    tween(500, (e) => { this.nozzle.style.transform = `translate(${nx}px,${top1 - 160 * U * e}px) scale(${U})`; }).then(() => {
      this.nozzle.hidden = true;
    });
    this.spark(300, 40, 24, { s0: 120, s1: 360, g: 0.3 });
  }

  // =============== 3: KRONA FALLER ===============
  crownBuild() {
    const C = [[298, 36], [287, 68], [307, 94], [291, 121], [303, 158]];
    this.C = C;
    const L = [[0, 0], [298, 0], ...C, [303, 172], [0, 172]];
    const R = [[298, 0], [600, 0], [600, 172], [303, 172], ...[...C].reverse()];
    this.cl = this.makePiece(this.contentBox(L), L);
    this.cr = this.makePiece(this.contentBox(R), R);
    const XS = [0, 131, 229, 332, 366, 456, 600];
    this.letters = [];
    for (let i = 0; i < 6; i++) {
      const pts = [[XS[i], 172], [XS[i + 1], 172], [XS[i + 1], LH], [XS[i], LH]];
      this.letters.push(this.makePiece(this.contentBox(pts), pts));
    }
    this.pieces = [this.cl, this.cr, ...this.letters];
    // Sandkorn: ca. 2 skjermpiksler store, tatt fra pikslene i bokstavene
    const g = Math.max(3, Math.round(2 / this.s));
    this.g = g;
    this.sand = [];
    for (let y = 172; y < LH - 1; y += g)
      for (let x = 0; x < LW - 1; x += g) {
        const i = ((y + 1) * LW + x + 1) * 4;
        if (this.px[i + 3] < 140) continue;
        const lum = this.px[i] * 0.3 + this.px[i + 1] * 0.6 + this.px[i + 2] * 0.1;
        const li = XS.findIndex((v, k) => x >= v && x < XS[k + 1]);
        this.sand.push({ hx: x, hy: y, x: 0, y: 0, vx: 0, vy: 0, c: lum > 80 ? 0 : 1, li, st: 0 });
      }
  }
  crown1() {
    this.crack(this.C, 0, 340);
    this.crack([[307, 94], [331, 103], [340, 99]], 220, 160);
    this.spark(298, 40, 14, { s0: 40, s1: 180, up: 120, g: 0.8 });
    this.shake(0.7);
  }
  crown2() {
    tween(750, (e) => this.aroundPivot(this.cr, 303, 158, 13 * e, 5 * e), E.bounce);
    setTimeout(() => this.spark(300, 150, 16, { dir: Math.PI / 2, spread: 0.7, s0: 30, s1: 140, g: 1 }), 180);
    this.shake(0.4);
  }
  crown3() {
    const U = this.U;
    this.svg.style.opacity = "0";
    this.sandL = this.WALL_L;
    this.hm = Array(Math.ceil((this.WALL_R - this.WALL_L) / this.g) + 1).fill(this.FLOOR);
    this.letters.forEach((l, i) =>
      setTimeout(() => {
        l.el.hidden = true;
        for (const s of this.sand)
          if (s.li === i) { s.x = s.hx; s.y = s.hy; s.vx = rand(-45, 45) * U; s.vy = rand(-90, 10) * U; s.st = 1; }
        this.puff(l.cx, l.cy + 20, 2, { r0: 14, r1: 30, a: 0.3 });
      }, i * 80),
    );
    Object.assign(this.cl, { dyn: true, done: false, vx: -70 * U, vy: -140 * U, vr: -150 });
    Object.assign(this.cr, { dyn: true, done: false, vx: 110 * U, vy: -60 * U, vr: 240 });
    this.shake(2);
  }
  drawSand(c, dt) {
    if (!this.sand || this.state !== 3) return;
    const hm = this.hm, g = this.g, n = hm ? hm.length : 0;
    if (!this.homing)
      for (const s of this.sand) {
        if (s.st !== 1) continue;
        s.vy += this.G * dt; s.vx *= 0.99; s.x += s.vx * dt; s.y += s.vy * dt;
        const b = clamp(Math.floor((s.x - this.sandL) / g), 0, n - 1);
        if (s.y + g >= hm[b]) {
          if (b > 0 && hm[b - 1] > hm[b] + g * 1.3) { s.x -= g; continue; }
          if (b < n - 1 && hm[b + 1] > hm[b] + g * 1.3) { s.x += g; continue; }
          s.y = hm[b] - g; hm[b] -= g; s.st = 2;
        }
      }
    for (const col of [0, 1]) {
      c.fillStyle = col ? "#0a0d0b" : `rgb(${this.accent})`;
      for (const s of this.sand) if (s.st && s.c === col) c.fillRect(s.x, s.y, g, g);
    }
  }
  async crownBack() {
    const U = this.U;
    for (let i = 0; i < 22; i++)
      this.puff(rand(0, 600), this.FLOOR - rand(0, 60) * U, 1, { r0: 30, r1: 60, a: 0.55, swirl: rand(0, 6), vy: -60, green: 0.18 });
    tween(350, (e) => { this.cl.o = this.cr.o = 1 - e; apply(this.cl); apply(this.cr); });
    await wait(420);
    this.homing = true;
    for (const s of this.sand) { s.sx = s.x; s.sy = s.y; s.d = Math.random() * 0.25 + (s.hx / 600) * 0.25; }
    await tween(1500, (_, t) => {
      for (const s of this.sand) {
        const e = E.io(clamp((t - s.d) / 0.5, 0, 1));
        s.x = s.sx + (s.hx - s.sx) * e;
        s.y = s.sy + (s.hy - s.sy) * e - Math.sin(Math.PI * e) * 70 * U;
      }
    }, E.lin);
    this.letters.forEach(resetPiece);
    for (const s of this.sand) s.st = 0;
    this.homing = false;
    for (const p of [this.cl, this.cr]) { resetPiece(p); p.y = -300 - this.rect.top / this.sNow; apply(p); }
    const y0 = this.cl.y;
    let landed = false;
    await tween(950, (e, t) => {
      for (const p of [this.cl, this.cr]) { p.y = y0 * (1 - e); apply(p); }
      if (!landed && t > 0.37) {
        landed = true;
        this.puff(212, 160, 4, { r0: 12, r1: 26, a: 0.5, vx: -60, vy: -10 });
        this.puff(388, 160, 4, { r0: 12, r1: 26, a: 0.5, vx: 60, vy: -10 });
        this.spark(300, 155, 30, { dir: -Math.PI / 2, spread: 1.4, s0: 150, s1: 420, g: 0.5 });
        this.shake(0.8);
        buzz(20);
      }
    }, E.bounce);
  }
}

function apply(p) {
  p.el.style.transform = `translate(${p.x.toFixed(2)}px,${p.y.toFixed(2)}px) rotate(${p.r.toFixed(2)}deg)`;
  p.el.style.opacity = String(p.o);
}
function resetPiece(p) {
  Object.assign(p, { x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0, o: 1, dyn: false, done: false, delay: 0 });
  p.el.hidden = false;
  apply(p);
}
