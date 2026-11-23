// The one place to set the address the contact form and the footer use.
const CONTACT_EMAIL = "m2pro.engg@gmail.com";

document.getElementById("year").textContent = new Date().getFullYear();

document.querySelectorAll(".mail-link").forEach((a) => {
  a.textContent = CONTACT_EMAIL;
  a.href = "mailto:" + CONTACT_EMAIL;
});

// Mobile menu
const burger = document.getElementById("burger");
const links = document.getElementById("links");
burger.addEventListener("click", () => {
  const open = links.classList.toggle("open");
  burger.setAttribute("aria-expanded", String(open));
});

// Contact form: no server, it opens the visitor's email app with the message filled in.
const form = document.getElementById("form");
if (form) {
  const note = document.getElementById("form-note");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    form.classList.add("tried");
    if (!form.checkValidity()) {
      note.textContent = "Please fill in your name, a valid email and a few lines about the case.";
      form.reportValidity();
      return;
    }
    const d = new FormData(form);
    const subject = `Enquiry: ${d.get("topic")}`;
    const body = [
      `Name: ${d.get("name")}`,
      `Email: ${d.get("email")}`,
      `Company: ${d.get("company") || "-"}`,
      `Interested in: ${d.get("topic")}`,
      "",
      d.get("case"),
    ].join("\n");
    window.location.href =
      `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    note.textContent = "Your email app should open with the message ready to send.";
  });
}

// Animations: each one is a run of solved frames, one image per frame, played by this script so it
// behaves the same in every browser. They always start by themselves and the home figure always
// slides, also when the system asks for reduced motion (owner's decision, 2026-11-17): the
// simulations are the content of the site, not decoration.
const calm = false;

function makePlayer(img) {
  const data = img.dataset.frames ? img.dataset : img.closest("figure").dataset;
  const count = Number(data.frames);
  const slow = Number(data.slow || 0);
  const url = (k) => `${data.base}${String(k).padStart(3, "0")}.webp`;
  const frames = [];
  let at = 0;
  let timer = 0;
  let on = false;
  let started = false;

  function load(k) {
    if (k >= count) return;
    const im = new Image();
    im.onload = () => {
      frames[k] = im;
      load(k + 1);
    };
    im.onerror = () => load(k + 1);
    im.src = url(k);
  }

  function tick() {
    clearTimeout(timer);
    if (!on) return;
    const next = (at + 1) % count;
    if (frames[next]) {
      at = next;
      img.src = frames[at].src;
    }
    timer = setTimeout(tick, at === count - 1 ? 1400 : at >= count - slow ? 240 : 95);
  }

  return {
    fetch() {
      if (!started) {
        started = true;
        load(0);
      }
    },
    play() {
      this.fetch();
      on = true;
      tick();
    },
    stop() {
      on = false;
      clearTimeout(timer);
    },
  };
}

// Run `show(true)` while the figure is on screen and `show(false)` while it is not. The observer is
// not relied on alone: some embedded browsers never fire it.
function whileVisible(fig, show) {
  let seen = fig.getBoundingClientRect().top < window.innerHeight + 300;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((e) => show(e[0].isIntersecting), { rootMargin: "300px" }).observe(fig);
  }
  if (seen) show(true);
  else setTimeout(() => show(true), 2500);
}

// A single animation.
document.querySelectorAll("figure[data-frames]").forEach((fig) => {
  const player = makePlayer(fig.querySelector(".stage-anim"));
  let wanted = !calm;
  whileVisible(fig, (visible) => {
    if (visible && wanted) player.play();
    else if (visible) player.fetch();
    else player.stop();
  });
  if (calm) {
    fig.style.cursor = "pointer";
    fig.addEventListener("click", () => {
      wanted = !wanted;
      if (wanted) player.play();
      else player.stop();
    });
  }
});

// The home page figure: one process after another.
document.querySelectorAll("figure.slides").forEach((fig) => {
  const slides = [...fig.querySelectorAll(".slide")];
  const tabs = [...fig.querySelectorAll(".slide-tab")];
  const players = slides.map(makePlayer);
  const every = Number(fig.dataset.every || 2000);
  let now = 0;
  let timer = 0;
  let visible = false;
  let wanted = !calm;

  function show(k) {
    players[now].stop();
    slides[now].classList.remove("is-on");
    tabs[now] && tabs[now].classList.remove("is-on");
    now = (k + slides.length) % slides.length;
    slides[now].classList.add("is-on");
    tabs[now] && tabs[now].classList.add("is-on");
    if (visible && wanted) players[now].play();
    players[(now + 1) % slides.length].fetch(); // have the next one ready
  }

  function run() {
    clearInterval(timer);
    if (!visible || !wanted) {
      players[now].stop();
      return;
    }
    players[now].play();
    timer = setInterval(() => show(now + 1), every);
  }

  tabs.forEach((tab, k) =>
    tab.addEventListener("click", () => {
      show(k);
      run();
    })
  );
  if (calm) {
    slides.forEach((s) =>
      s.addEventListener("click", () => {
        wanted = !wanted;
        run();
      })
    );
  }
  whileVisible(fig, (v) => {
    visible = v;
    run();
  });
});

// HTPro: the coupling tetrahedron. It draws only the couplings listed beside it, so the picture never shows
// more than the text states. It turns slowly and lights one coupling at a time; the list item lights with it.
document.querySelectorAll("figure.tetra").forEach((fig) => {
  const svg = fig.querySelector("svg");
  const list = document.getElementById(fig.dataset.list);
  if (!svg || !list) return;
  const NS = "http://www.w3.org/2000/svg";
  const make = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    parent.appendChild(e);
    return e;
  };
  const NODES = {
    T: { label: "Temperature", sym: "T", p: [0, 1, 0] },
    P: { label: "Phases", sym: "f", p: [0.9428, -0.3333, 0] },
    S: { label: "Stress", sym: "σ", p: [-0.4714, -0.3333, 0.8165] },
    C: { label: "Carbon", sym: "C", p: [-0.4714, -0.3333, -0.8165] },
  };
  const keys = Object.keys(NODES);
  const pairs = [];
  keys.forEach((a, i) => keys.slice(i + 1).forEach((b) => pairs.push([a, b])));
  const links = [...list.querySelectorAll("li[data-from]")].map((li) => ({
    li,
    a: li.dataset.from,
    b: li.dataset.to,
    partly: li.dataset.model === "partly",
  }));

  const gEdges = make("g", {}, svg);
  const edges = pairs.map(() => make("line", { class: "t-edge" }, gEdges));
  const gArrows = make("g", {}, svg);
  const arrows = links.map(() => make("path", { class: "t-arrow" }, gArrows));
  const pulse = make("circle", { class: "t-pulse", r: 5 }, svg);
  const gNodes = make("g", {}, svg);
  const nodes = {};
  keys.forEach((k) => {
    const g = make("g", { class: "t-node" }, gNodes);
    make("circle", { r: 28 }, g);
    make("text", { class: "t-sym", "text-anchor": "middle", dy: "0.36em" }, g).textContent = NODES[k].sym;
    const label = make("text", { class: "t-label", "text-anchor": "middle" }, g);
    label.textContent = NODES[k].label;
    nodes[k] = { g, label };
  });

  const CX = 280;
  const CY = 268;
  const R = 196;
  const TILT = 0.3;
  let angle = 0.55;
  let active = calm ? -1 : 0;
  let since = 0;
  let last = 0;
  let running = false;

  function project([x, y, z]) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const x1 = x * c + z * s;
    const z1 = -x * s + z * c;
    const y2 = y * Math.cos(TILT) - z1 * Math.sin(TILT);
    const z2 = y * Math.sin(TILT) + z1 * Math.cos(TILT);
    const f = 1 / (1 - 0.16 * z2);
    return { x: CX + R * x1 * f, y: CY - R * y2 * f, z: z2, f };
  }

  // A point on the line from A to B, moved to its left side: each direction of an edge gets its own side.
  function along(A, B, t, side) {
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const L = Math.hypot(dx, dy) || 1;
    const ux = dx / L;
    const uy = dy / L;
    const d = 34 + (L - 74) * t;
    return { x: A.x + ux * d - uy * side, y: A.y + uy * d + ux * side, ux, uy };
  }

  const f1 = (v) => v.toFixed(1);

  function draw(phase) {
    const P = {};
    keys.forEach((k) => (P[k] = project(NODES[k].p)));
    const on = links[active];
    pairs.forEach(([a, b], i) => {
      const e = edges[i];
      e.setAttribute("x1", f1(P[a].x));
      e.setAttribute("y1", f1(P[a].y));
      e.setAttribute("x2", f1(P[b].x));
      e.setAttribute("y2", f1(P[b].y));
      const lit = on && ((on.a === a && on.b === b) || (on.a === b && on.b === a));
      e.setAttribute("class", lit ? "t-edge on" : "t-edge");
      e.style.opacity = lit ? 1 : (0.35 + 0.65 * ((P[a].z + P[b].z) / 2 + 1) / 2).toFixed(2);
    });
    links.forEach((l, i) => {
      const tip = along(P[l.a], P[l.b], 1, 7);
      const nx = -tip.uy;
      const ny = tip.ux;
      const bx = tip.x - tip.ux * 12;
      const by = tip.y - tip.uy * 12;
      arrows[i].setAttribute(
        "d",
        `M${f1(tip.x)},${f1(tip.y)}L${f1(bx + nx * 5)},${f1(by + ny * 5)}L${f1(bx - nx * 5)},${f1(by - ny * 5)}Z`
      );
      arrows[i].setAttribute("class", "t-arrow" + (l.partly ? " partly" : "") + (l === on ? " on" : ""));
    });
    if (on && phase !== null) {
      const q = along(P[on.a], P[on.b], phase, 7);
      pulse.setAttribute("cx", f1(q.x));
      pulse.setAttribute("cy", f1(q.y));
      pulse.style.opacity = phase < 0.9 ? 1 : 0;
    } else {
      pulse.style.opacity = 0;
    }
    keys
      .slice()
      .sort((a, b) => P[a].z - P[b].z)
      .forEach((k) => gNodes.appendChild(nodes[k].g));
    keys.forEach((k) => {
      const q = P[k];
      const n = nodes[k];
      n.g.setAttribute("transform", `translate(${f1(q.x)},${f1(q.y)}) scale(${(0.8 + 0.2 * q.f).toFixed(3)})`);
      n.g.setAttribute("class", on && (on.a === k || on.b === k) ? "t-node on" : "t-node");
      n.label.setAttribute("y", q.y < CY - 60 ? -42 : 52);
    });
  }

  function mark() {
    links.forEach((l, i) => l.li.classList.toggle("is-on", i === active));
  }

  function frame(now) {
    if (!running) return;
    const dt = last ? Math.min(now - last, 100) : 16;
    last = now;
    angle += dt * 0.00026; // one turn in about 24 s
    since += dt;
    if (since > 2600) {
      since = 0;
      active = (active + 1) % links.length;
      mark();
    }
    draw((since % 1300) / 1300);
    requestAnimationFrame(frame);
  }

  links.forEach((l, i) =>
    l.li.addEventListener("mouseenter", () => {
      active = i;
      since = 0;
      mark();
      if (!running) draw(null);
    })
  );

  mark();
  draw(null);
  if (!calm) {
    whileVisible(fig, (visible) => {
      if (visible && !running) {
        running = true;
        last = 0;
        requestAnimationFrame(frame);
      } else if (!visible) {
        running = false;
      }
    });
  }
});
