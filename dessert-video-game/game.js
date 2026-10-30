(function () {
  "use strict";

  const bases = [
    { id: "berry", name: "Berry", icon: "🍓" },
    { id: "cocoa", name: "Cocoa", icon: "🍫" },
    { id: "lemon", name: "Lemon", icon: "🍋" },
    { id: "mint", name: "Mint", icon: "🌿" },
  ];
  const tops = [
    { id: "cherry", name: "Cherry", icon: "🍒" },
    { id: "cookie", name: "Cookie", icon: "🍪" },
    { id: "star", name: "Stars", icon: "⭐" },
    { id: "sprinkle", name: "Sprinkle", icon: "🌈" },
  ];
  const classics = [
    { name: "Berry Bliss", base: "berry", top: "cherry", icon: "🍨" },
    { name: "Choco Crunch", base: "cocoa", top: "cookie", icon: "🍦" },
    { name: "Sunny Swirl", base: "lemon", top: "star", icon: "🍧" },
    { name: "Mint Party", base: "mint", top: "sprinkle", icon: "🍰" },
  ];
  const faces = ["👩🏽", "🧑🏻", "👩🏿", "👨🏼", "👩🏻‍🦰", "👨🏾‍🦱", "👵🏻", "👧🏽"];
  const levels = [
    { name: "Morning crowd", duration: 45, spawn: 5.4, patience: 22, goal: 4, classics: 2, double: 0, specials: 0, vip: 0 },
    { name: "Lunch rush", duration: 50, spawn: 4.4, patience: 19, goal: 6, classics: 4, double: .22, specials: 0, vip: .18 },
    { name: "Mix-up hour", duration: 55, spawn: 3.7, patience: 16, goal: 8, classics: 4, double: .32, specials: .35, vip: .20 },
    { name: "Sweet storm", duration: 60, spawn: 3.1, patience: 14, goal: 10, classics: 4, double: .42, specials: .55, vip: .23 },
  ];
  const $ = (id) => document.getElementById(id);
  const load = (key, fallback) => { try { return Number(localStorage.getItem(key)) || fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key, String(value)); } catch {} };
  const s = {
    mode: "intro", level: 0, time: 45, spawn: 0, hearts: 3, score: 0, served: 0,
    roundServed: 0, combo: 0, fever: 0, feverLeft: 0, orders: [], selected: null,
    base: null, scoops: 0, top: null, busy: false, fast: false, kind: false,
    tips: false, sound: true, id: 1, last: 0, best: load("sweetStreetBest", 0),
    endlessBest: load("sweetStreetEndlessBest", 0), unlocked: load("sweetStreetEndless", 0),
    wave: 1, elapsed: 0,
  };
  let audio;

  function beep(freq, duration, type = "sine") {
    if (!s.sound) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      const osc = audio.createOscillator(), gain = audio.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(.045, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
      osc.connect(gain); gain.connect(audio.destination);
      osc.start(); osc.stop(audio.currentTime + duration);
    } catch {}
  }
  function toast(message) {
    document.querySelector(".toast")?.remove();
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    $("game").append(el);
    setTimeout(() => el.remove(), 1100);
  }
  function burst() {
    const box = $("confetti"); box.innerHTML = "";
    for (let i = 0; i < 16; i++) {
      const el = document.createElement("i");
      el.style.setProperty("--c", ["#ff76a0", "#ffcb48", "#4bc99f", "#9275e9"][i % 4]);
      el.style.setProperty("--x", `${Math.random() * 380 - 190}px`);
      el.style.setProperty("--y", `${Math.random() * 250 - 150}px`);
      box.append(el);
    }
    setTimeout(() => { box.innerHTML = ""; }, 750);
  }
  function show(html) { $("modal").innerHTML = html; $("overlay").classList.remove("hidden"); }
  function currentLevel() {
    if (s.mode !== "endless") return levels[s.level];
    return {
      name: `Endless · wave ${s.wave}`, duration: 0,
      spawn: Math.max(1.7, 3.8 - (s.wave - 1) * .28),
      patience: Math.max(9, 17 - (s.wave - 1) * 1.1),
      goal: 0, classics: 4, double: Math.min(.56, .28 + s.wave * .04),
      specials: Math.min(.7, .35 + s.wave * .04), vip: .20,
    };
  }
  function resetRun(endless) {
    s.mode = endless ? "endless" : "play";
    s.level = 0; s.score = 0; s.hearts = 3; s.served = 0;
    s.combo = 0; s.fever = 0; s.feverLeft = 0; s.wave = 1; s.elapsed = 0;
    s.fast = false; s.kind = false; s.tips = false;
    startLevel();
  }
  function intro() {
    s.mode = "intro";
    show(`<div class="mascot">🍨</div><span class="eyebrow">Serve fast. Keep the streak.</span><h1>Sweet Street!</h1><p>Fill each round's order goal before the clock runs out. Later crowds ask for double scoops and surprise mixes. Four perfect serves light up Fever for double points.</p><p class="record">Best score: <strong>${s.best}</strong></p><button class="primary" id="start">Open the shop →</button>${s.unlocked ? `<button class="secondary" id="endless">Play endless shift · best ${s.endlessBest}</button>` : ""}`);
    $("start").onclick = () => resetRun(false);
    if (s.unlocked) $("endless").onclick = () => resetRun(true);
  }
  function startLevel() {
    const level = currentLevel();
    if (s.mode !== "endless") s.mode = "play";
    s.time = level.duration; s.spawn = 0; s.roundServed = 0;
    s.orders = []; s.selected = null; s.base = null; s.scoops = 0; s.top = null;
    s.busy = false; s.fever = 0; s.feverLeft = 0;
    $("overlay").classList.add("hidden");
    addOrder(); render(); s.last = performance.now();
  }
  function makeRecipe(level) {
    if (Math.random() >= level.specials) return classics[Math.floor(Math.random() * level.classics)];
    const base = bases[Math.floor(Math.random() * bases.length)];
    const top = tops[Math.floor(Math.random() * tops.length)];
    return { name: `${base.name} + ${top.name}`, base: base.id, top: top.id, icon: "🍨" };
  }
  function addOrder() {
    if (s.orders.length >= 3 || (s.mode !== "play" && s.mode !== "endless")) return;
    const level = currentLevel(), recipe = makeRecipe(level), id = s.id++;
    const vip = Math.random() < level.vip;
    const max = level.patience + (s.kind ? 5 : 0) - (vip ? 3 : 0);
    s.orders.push({ id, recipe, face: faces[Math.floor(Math.random() * faces.length)],
      patience: max, max, double: Math.random() < level.double, vip });
    if (s.selected === null) s.selected = id;
    renderOrders(); renderPlate(); beep(vip ? 740 : 490, .07);
  }
  function choose(id) {
    if (s.mode !== "play" && s.mode !== "endless") return;
    s.selected = id; renderOrders(); renderPlate(); beep(600, .08);
  }
  function ingredient(type, id) {
    if ((s.mode !== "play" && s.mode !== "endless") || s.busy) return;
    if (type === "top" && !s.base) { toast("Scoop first!"); beep(200, .15, "triangle"); return; }
    const order = s.orders.find((item) => item.id === s.selected);
    if (type === "top" && order?.double && s.scoops < 2) {
      toast("Tap the same scoop again!"); beep(200, .15, "triangle"); return;
    }
    s.busy = true; renderIngredients();
    setTimeout(() => {
      if (s.mode !== "play" && s.mode !== "endless") return;
      if (type === "base") {
        s.scoops = s.base === id && !s.top ? Math.min(2, s.scoops + 1) : 1;
        s.base = id; s.top = null;
      } else s.top = id;
      s.busy = false; renderPlate(); renderIngredients();
      beep(type === "base" ? 650 : 820, .10);
    }, s.fast ? 110 : 270);
  }
  function clearPlate() { s.base = null; s.scoops = 0; s.top = null; s.busy = false; }
  function breakStreak() { s.combo = 0; s.fever = 0; s.feverLeft = 0; }
  function serve() {
    if ((s.mode !== "play" && s.mode !== "endless") || s.busy || !s.base || !s.top) return;
    const order = s.orders.find((item) => item.id === s.selected);
    if (!order) return;
    if (order.recipe.base === s.base && order.recipe.top === s.top && s.scoops === (order.double ? 2 : 1)) {
      const wasFever = s.feverLeft > 0;
      const comboBonus = Math.min(s.combo, 8) * 20;
      const points = Math.round((100 + order.patience * 4 + comboBonus) * (order.vip ? 2 : 1) * (s.tips ? 1.5 : 1) * (wasFever ? 2 : 1));
      s.score += points; s.served++; s.roundServed++; s.combo++;
      if (!wasFever && ++s.fever >= 4) { s.fever = 0; s.feverLeft = 9; toast("🔥 FEVER! Double points!"); }
      else toast(`+${points} ✦ ${s.combo > 1 ? `${s.combo} combo!` : "Perfect serve!"}`);
      if (order.vip) { s.hearts = Math.min(4, s.hearts + 1); }
      s.orders = s.orders.filter((item) => item !== order);
      s.selected = s.orders[0]?.id ?? null;
      burst(); beep(690, .12); setTimeout(() => beep(930, .18), 100);
      clearPlate(); render();
      if (s.mode === "play" && s.roundServed >= currentLevel().goal) finish(true);
    } else {
      order.patience = Math.max(.5, order.patience - 6);
      breakStreak(); clearPlate(); render();
      toast("Wrong order! Streak lost"); beep(180, .28, "sawtooth");
      $("counter").classList.add("shake");
      setTimeout(() => $("counter").classList.remove("shake"), 350);
    }
  }
  function miss(order) {
    if (s.mode !== "play" && s.mode !== "endless") return;
    s.orders = s.orders.filter((item) => item !== order);
    s.hearts--; breakStreak();
    if (s.selected === order.id) s.selected = s.orders[0]?.id ?? null;
    toast("Customer left! −1 ♥"); beep(170, .35, "sawtooth"); render();
    if (s.hearts <= 0) finish(false);
  }
  function record() {
    if (s.mode === "endless") {
      if (s.score > s.endlessBest) { s.endlessBest = s.score; save("sweetStreetEndlessBest", s.score); return true; }
    } else if (s.score > s.best) { s.best = s.score; save("sweetStreetBest", s.score); return true; }
    return false;
  }
  function finish(win) {
    if (s.mode !== "play" && s.mode !== "endless") return;
    const wasEndless = s.mode === "endless";
    const newBest = record();
    s.mode = "pause"; render();
    if (wasEndless) {
      show(`<div class="mascot">${newBest ? "🏆" : "😵‍💫"}</div><span class="eyebrow">Endless shift · wave ${s.wave}</span><h1>${newBest ? "New record!" : "Shift over!"}</h1><p><strong>${s.score}</strong> points · <strong>${s.served}</strong> customers served. Best: ${s.endlessBest}.</p><button class="primary" id="again">Try another shift →</button><button class="secondary" id="home">Back to shop</button>`);
      $("again").onclick = () => resetRun(true); $("home").onclick = intro; return;
    }
    if (!win) {
      const reason = s.hearts <= 0 ? "Three customers walked out." : `Needed ${currentLevel().goal} orders; served ${s.roundServed}.`;
      show(`<div class="mascot">😵‍💫</div><span class="eyebrow">Round ${s.level + 1} · ${currentLevel().name}</span><h1>One more try?</h1><p>${reason} Score: <strong>${s.score}</strong>${newBest ? " · New best!" : ""}</p><button class="primary" id="again">Try again →</button>`);
      $("again").onclick = intro; return;
    }
    if (s.level === levels.length - 1) {
      s.unlocked = 1; save("sweetStreetEndless", 1);
      show(`<div class="mascot">🏆</div><span class="eyebrow">Four rushes cleared</span><h1>Sweet victory!</h1><p><strong>${s.score}</strong> points · <strong>${s.served}</strong> happy customers${newBest ? " · New best!" : ""}. Endless shift is now open.</p><button class="primary" id="again">Play endless shift →</button><button class="secondary" id="home">Replay the rushes</button>`);
      $("again").onclick = () => resetRun(true); $("home").onclick = intro; burst(); return;
    }
    const perks = [
      !s.fast && '<button class="upgrade" data-perk="fast"><strong>⚡ Speedy scoops</strong><span>Prep ingredients faster</span></button>',
      !s.kind && '<button class="upgrade" data-perk="kind"><strong>💗 Cozy café</strong><span>Customers wait 5 seconds longer</span></button>',
      !s.tips && '<button class="upgrade" data-perk="tips"><strong>💰 Tip jar</strong><span>Earn 50% more points per order</span></button>',
      s.hearts < 4 && '<button class="upgrade" data-perk="heart"><strong>💖 Fresh start</strong><span>Restore one heart, up to four</span></button>',
    ].filter(Boolean).slice(0, 3);
    show(`<div class="mascot">✨</div><span class="eyebrow">Round ${s.level + 1} complete · ${Math.ceil(s.time)}s left</span><h1>Shop upgrade!</h1><p>${s.roundServed} / ${currentLevel().goal} served · ${s.score} points. Pick one perk for the next rush.</p><div class="upgrades">${perks.join("")}</div>`);
    document.querySelectorAll(".upgrade").forEach((button) => {
      button.onclick = () => {
        if (button.dataset.perk === "heart") s.hearts = Math.min(4, s.hearts + 1);
        else s[button.dataset.perk] = true;
        s.level++; startLevel();
      };
    });
  }
  function renderOrders() {
    const container = $("orders"); container.innerHTML = "";
    if (!s.orders.length) { container.innerHTML = '<div class="empty">✨ No one in line — get ready for the next treat!</div>'; return; }
    s.orders.forEach((order) => {
      const base = bases.find((x) => x.id === order.recipe.base);
      const top = tops.find((x) => x.id === order.recipe.top);
      const button = document.createElement("button");
      button.className = `order${order.id === s.selected ? " selected" : ""}${order.patience / order.max < .28 ? " urgent" : ""}${order.vip ? " vip" : ""}`;
      button.setAttribute("aria-label", `${order.vip ? "VIP " : ""}${order.face} wants ${order.double ? "double " : ""}${base.name} with ${top.name}`);
      button.innerHTML = `<div class="face">${order.face}${order.vip ? '<span class="vipmark">★</span>' : ""}</div><div class="want">${order.vip ? "VIP · " : ""}${order.recipe.name}</div><div class="recipe">${base.icon}${order.double ? base.icon : ""} + ${top.icon}</div><div class="meter"><span style="width:${Math.max(0, order.patience / order.max * 100)}%"></span></div>`;
      button.onclick = () => choose(order.id);
      container.append(button);
    });
  }
  function renderIngredients() {
    function fill(container, items, type) {
      container.innerHTML = "";
      items.forEach((item) => {
        const button = document.createElement("button");
        button.className = `ingredient${s[type] === item.id ? " chosen" : ""}`;
        button.disabled = (s.mode !== "play" && s.mode !== "endless") || s.busy;
        button.setAttribute("aria-label", `${item.name} ${type === "base" ? "scoop" : "topping"}`);
        button.innerHTML = `<span class="icon">${item.icon}</span><span class="name">${item.name}</span>`;
        button.onclick = () => ingredient(type, item.id);
        container.append(button);
      });
    }
    fill($("bases"), bases, "base"); fill($("tops"), tops, "top");
  }
  function renderPlate() {
    const order = s.orders.find((item) => item.id === s.selected);
    const dessert = $("dessert");
    if (!s.base) {
      dessert.textContent = "🍽️";
      $("plate-title").textContent = order ? `Make ${order.recipe.name}` : "Ready to scoop";
      $("plate-hint").textContent = order ? `${order.double ? "Double " : ""}${bases.find((x) => x.id === order.recipe.base).name} + ${tops.find((x) => x.id === order.recipe.top).name}.` : "Choose a customer, then build their treat.";
    } else if (!s.top) {
      dessert.textContent = `${bases.find((x) => x.id === s.base).icon}${s.scoops === 2 ? "🍦🍦" : "🍦"}`;
      $("plate-title").textContent = order?.double && s.scoops < 2 ? "One more scoop!" : "Add a topping!";
      $("plate-hint").textContent = order?.double && s.scoops < 2 ? "Tap the same scoop again for a double." : "Tap the finishing touch below.";
    } else {
      dessert.textContent = classics.find((r) => r.base === s.base && r.top === s.top)?.icon || "🍨";
      $("plate-title").textContent = `${s.scoops === 2 ? "Double " : ""}${bases.find((x) => x.id === s.base).name} + ${tops.find((x) => x.id === s.top).name}`;
      $("plate-hint").textContent = order?.double && s.scoops < 2 ? "Needs two scoops: tap the same scoop again." : `Serve to ${order?.face || "a customer"} before time runs out!`;
    }
    dessert.className = "dessert";
    $("serve").disabled = (s.mode !== "play" && s.mode !== "endless") || s.busy || !s.base || !s.top || !order || (order.double && s.scoops < 2);
  }
  function render() {
    const level = currentLevel(), endless = s.mode === "endless";
    $("level").textContent = endless ? `W${s.wave}` : `${s.level + 1} / 4`;
    $("time").textContent = endless ? Math.floor(s.elapsed) : Math.ceil(s.time);
    $("hearts").textContent = "♥".repeat(Math.max(0, s.hearts));
    $("score").textContent = s.score;
    $("round").textContent = level.name;
    $("rush").textContent = endless ? `${s.served} served` : `${s.roundServed} / ${level.goal} served`;
    $("rush").className = !endless && s.time < 12 ? "rush" : "";
    $("combo").textContent = s.feverLeft > 0 ? `🔥 FEVER ${Math.ceil(s.feverLeft)}s` : s.combo > 1 ? `✦ ${s.combo}× combo!` : "✦ Build your streak";
    $("progress").style.width = `${s.feverLeft > 0 ? s.feverLeft / 9 * 100 : s.fever / 4 * 100}%`;
    $("game").classList.toggle("fever", s.feverLeft > 0);
    $("hint").textContent = s.level > 0 || endless ? "Double icon? Tap that scoop twice • VIPs tip more and restore a heart" : "Match the order • Serve four in a row for Fever";
    renderOrders(); renderIngredients(); renderPlate();
  }
  function updateMeters() {
    Array.from($("orders").children).forEach((button, index) => {
      const order = s.orders[index]; if (!order) return;
      const bar = button.querySelector(".meter span");
      if (bar) bar.style.width = `${Math.max(0, order.patience / order.max * 100)}%`;
      button.classList.toggle("urgent", order.patience / order.max < .28);
    });
  }
  function tick(now) {
    const dt = Math.min(.12, (now - s.last) / 1000 || 0); s.last = now;
    if (s.mode === "play" || s.mode === "endless") {
      const endless = s.mode === "endless";
      if (endless) { s.elapsed += dt; s.wave = 1 + Math.floor(s.elapsed / 30); }
      else s.time = Math.max(0, s.time - dt);
      const level = currentLevel();
      s.spawn += dt;
      const interval = !endless && s.time < 12 ? level.spawn * .78 : level.spawn;
      if (s.spawn >= interval) { s.spawn = 0; addOrder(); }
      if (s.feverLeft > 0) s.feverLeft = Math.max(0, s.feverLeft - dt);
      const expired = [];
      s.orders.forEach((order) => { order.patience -= dt; if (order.patience <= 0) expired.push(order); });
      expired.forEach(miss);
      $("time").textContent = endless ? Math.floor(s.elapsed) : Math.ceil(s.time);
      if (endless) { $("level").textContent = `W${s.wave}`; $("round").textContent = level.name; }
      $("combo").textContent = s.feverLeft > 0 ? `🔥 FEVER ${Math.ceil(s.feverLeft)}s` : s.combo > 1 ? `✦ ${s.combo}× combo!` : "✦ Build your streak";
      $("progress").style.width = `${s.feverLeft > 0 ? s.feverLeft / 9 * 100 : s.fever / 4 * 100}%`;
      $("game").classList.toggle("fever", s.feverLeft > 0);
      updateMeters();
      if (!endless && s.time <= 0 && s.mode === "play") finish(false);
    }
    requestAnimationFrame(tick);
  }
  $("serve").onclick = serve;
  $("mute").onclick = function () { s.sound = !s.sound; this.textContent = s.sound ? "🔊" : "🔇"; this.setAttribute("aria-label", s.sound ? "Mute sound" : "Unmute sound"); beep(700, .09); };
  intro(); renderIngredients(); requestAnimationFrame(tick);
})();
