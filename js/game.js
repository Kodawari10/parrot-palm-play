/* Parrot Palm — grove, seed reveals, album, and the Coconut Isle puzzle. */
(function () {
  'use strict';
  const L = window.PP_LOGIC;
  const ART = window.PP_ART;
  const AUDIO = window.PP_AUDIO;
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  let state = L.loadState(readRaw(), Date.now());
  let view = 'grove';
  let filter = 'all';
  let albumIsland = 'here';
  let busy = false;
  let revealTile = null;
  let detailId = null;
  let held = null;
  let toastTimer = 0;
  const chain = { tiles: new Set(), chart: false };

  function readRaw() {
    try { return localStorage.getItem(L.CFG.storeKey); } catch (e) { return null; }
  }
  function save() {
    try { localStorage.setItem(L.CFG.storeKey, JSON.stringify(state)); } catch (e) { /* private mode */ }
  }
  function absorbStickers() {
    const got = L.checkStickers(state);
    state = got.state;
    got.unlocked.forEach(st => {
      toast(st.mark + ' ' + st.name + ' — a ' + st.seed + ' seed!');
      AUDIO.play('gift');
    });
  }
  function bond(id, amount) {
    const got = L.addFriendship(state, id, amount);
    state = got.state;
    if (got.leveled) {
      const p = L.PARROTS.filter(x => x.id === id)[0];
      const acc = L.friendProgress(state, id).accessory;
      toast((p ? p.name : 'A parrot') + ' reached level ' + got.level + (acc ? ' and found a ' + acc + '!' : '!'));
      AUDIO.play('complete');
      confetti(18);
      const card = document.querySelector('.parrot-card[data-parrot="' + id + '"]');
      if (card) {
        card.classList.add('levelup');
        const bubble = card.querySelector('.bubble');
        if (bubble) { bubble.textContent = 'Level ' + got.level + '!'; bubble.hidden = false; }
        setTimeout(() => { card.classList.remove('levelup'); if (bubble) bubble.hidden = true; }, 1600);
      }
    }
    const bar = document.querySelector('.parrot-card[data-parrot="' + id + '"] .friend');
    if (bar) {
      const info = L.friendProgress(state, id);
      const fill = bar.querySelector('i');
      const label = bar.querySelector('b');
      if (fill) fill.style.width = info.pct + '%';
      if (label) label.textContent = 'Lv ' + info.level;
    }
    absorbStickers();
  }
  function reduced() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }

  function announce(msg) {
    const a = $('#announce');
    if (!a) return;
    a.textContent = '';
    setTimeout(() => { a.textContent = msg; }, 20);
  }
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
    announce(msg);
  }
  function confetti(n) {
    if (state.calm || reduced()) return;
    const fx = $('#fx');
    const colors = ['#ff8fb8', '#ffd56a', '#7dce6a', '#c9b6ff', '#9fd7ff', '#fff'];
    for (let i = 0; i < n; i++) {
      const d = document.createElement('i');
      d.style.left = Math.random() * 100 + '%';
      d.style.background = colors[i % colors.length];
      d.style.animationDelay = (Math.random() * 0.25) + 's';
      d.style.transform = 'rotate(' + (Math.random() * 40) + 'deg)';
      fx.appendChild(d);
      setTimeout(() => d.remove(), 1400);
    }
  }
  function buzz(pattern) {
    if (state.calm) return;
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* ignore */ }
  }

  function openModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.hidden = false;
    const focus = el.querySelector('[data-close], .btn.primary, button');
    if (focus) focus.focus();
  }
  function closeModal(el) {
    const node = typeof el === 'string' ? document.getElementById(el) : el;
    if (!node) return;
    node.hidden = true;
    if (node.id === 'how') {
      state.onboarded = true;
      save();
    }
    if (node.id === 'reveal') revealTile = null;
  }
  function anyModal() {
    return $$('.modal').some(m => !m.hidden);
  }

  function showView(name) {
    view = name;
    ['grove', 'map', 'album'].forEach(v => {
      const section = $('#view' + v.charAt(0).toUpperCase() + v.slice(1));
      if (section) section.hidden = v !== name;
    });
    $$('[data-view]').forEach(b => {
      const on = b.getAttribute('data-view') === name;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (name === 'map') renderMap();
    if (name === 'album') {
      renderAlbum();
      advanceCoach(3);
    }
    if (name === 'grove') renderGroveBits();
  }

  function updateHud() {
    $('#seedCount').textContent = String(L.totalSeeds(state.seeds));
    const isle = L.activeIsland(state);
    $('#mapCount').textContent = String(L.placedCount(state));
    $('#mapTotal').textContent = String(isle.tiles.length);
    $('#seedPill').setAttribute('aria-label', L.totalSeeds(state.seeds) + ' seeds in your pouch');
    $('#mapPill').setAttribute('aria-label', L.placedCount(state) + ' of ' + isle.tiles.length + ' map tiles placed on ' + isle.name);
    const mute = $('#btnMute');
    mute.setAttribute('aria-pressed', state.muted ? 'true' : 'false');
    mute.textContent = state.muted ? '🔇' : '🔊';
    mute.setAttribute('aria-label', state.muted ? 'Unmute sounds' : 'Mute sounds');
    document.documentElement.classList.toggle('calm', !!state.calm);
    AUDIO.setMuted(state.muted);
    AUDIO.setCalm(state.calm);
    const calm = $('#btnCalm');
    if (calm) {
      calm.setAttribute('aria-pressed', state.calm ? 'true' : 'false');
      calm.querySelector('.state').textContent = state.calm ? 'On' : 'Off';
    }
    const music = $('#btnMusic');
    if (music) {
      music.setAttribute('aria-pressed', state.music ? 'true' : 'false');
      music.querySelector('.state').textContent = state.music ? 'On' : 'Off';
    }
    AUDIO.setMusic(!!state.music && !state.muted);
  }

  function renderPalm() {
    $('#palmArt').innerHTML = ART.palm(state.ripe);
    const badge = $('#ripeBadge');
    badge.textContent = state.ripe > 0 ? state.ripe + ' ripe' : '';
    badge.hidden = state.ripe <= 0;
    const palm = $('#btnPalm');
    palm.setAttribute('aria-label', state.ripe > 0
      ? 'Collect ' + state.ripe + ' ripe seed' + (state.ripe > 1 ? 's' : '') + ' from the palm'
      : 'The palm is growing another seed');
  }

  function formatWait(ms) {
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m + ':' + String(r).padStart(2, '0');
  }
  function updateGrowNote() {
    const note = $('#growNote');
    if (state.ripe >= L.CFG.treeSlots) note.textContent = 'The palm is full — tap it!';
    else if (state.ripe > 0) note.textContent = 'Next seed in ' + formatWait(L.nextGrowIn(state, Date.now()));
    else note.textContent = 'Growing… ' + formatWait(L.nextGrowIn(state, Date.now()));
  }

  function renderSeeds() {
    const row = $('#seedRow');
    row.replaceChildren();
    L.SEED_KINDS.forEach(kind => {
      const n = state.seeds[kind] || 0;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'seed-chip ' + kind;
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', state.seedPick === kind ? 'true' : 'false');
      b.disabled = n <= 0;
      b.innerHTML = '<span class="mini"></span><span class="nm"></span><small></small>';
      b.querySelector('.mini').innerHTML = ART.seed(kind);
      b.querySelector('.nm').textContent = L.SEED_LABEL[kind];
      b.querySelector('small').textContent = '×' + n;
      b.addEventListener('click', () => {
        state.seedPick = kind;
        save();
        AUDIO.play('tap');
        renderSeeds();
        lookAtSeed();
      });
      row.appendChild(b);
    });
  }

  function renderParrots() {
    const box = $('#parrots');
    box.replaceChildren();
    L.PARROTS.forEach(p => {
      const open = L.parrotUnlocked(state, p.id);
      if (!open) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'parrot' + (open ? '' : ' locked');
      b.dataset.parrot = p.id;
      b.disabled = !open;
      const wrap = document.createElement('div');
      wrap.className = 'parrot-card' + (open ? '' : ' locked');
      wrap.dataset.parrot = p.id;
      if (state.seedPick) wrap.classList.add('watching');
      b.innerHTML = '<span class="bubble" hidden></span><span class="zzz" aria-hidden="true">z z</span><span class="art"></span><span class="name"></span><span class="title"></span>';
      const bondInfo = L.friendProgress(state, p.id);
      b.querySelector('.art').innerHTML = ART.parrot(p.id, open ? L.hatId(state) : '', open ? bondInfo.accessory : '');
      b.querySelector('.name').textContent = open ? p.name : '???';
      if (open) {
        const friend = document.createElement('span');
        friend.className = 'friend';
        friend.title = 'Friendship level ' + bondInfo.level;
        friend.innerHTML = '<i style="width:' + bondInfo.pct + '%"></i><b>Lv ' + bondInfo.level + '</b>';
        b.appendChild(friend);
      }
      b.querySelector('.title').textContent = open ? p.title : 'Finish ' + (L.islandById(p.needs).name);
      b.setAttribute('aria-label', open ? ('Feed ' + p.name + '. ' + p.line) : (p.name + ' is waiting. Finish ' + L.islandById(p.needs).name + '.'));
      b.addEventListener('click', () => feedParrot(p.id));
      wrap.appendChild(b);
      if (open) {
        const pet = document.createElement('button');
        pet.type = 'button';
        pet.className = 'pet';
        pet.textContent = '♡';
        pet.setAttribute('aria-label', 'Pet ' + p.name);
        pet.addEventListener('click', ev => { ev.stopPropagation(); petParrot(p.id); });
        wrap.appendChild(pet);
      }
      box.appendChild(wrap);
    });
  }

  let lastPoke = Date.now();
  function wake() {
    lastPoke = Date.now();
    $$('.parrot-card').forEach(c => c.classList.remove('sleepy'));
  }
  function burstHearts(el) {
    const host = $('#hearts');
    if (!host || !el) return;
    const r = el.getBoundingClientRect();
    for (let i = 0; i < 6; i++) {
      const h = document.createElement('span');
      h.textContent = i % 2 ? '♡' : '✦';
      h.style.left = (r.left + r.width / 2 + (Math.random() * 36 - 18)) + 'px';
      h.style.top = (r.top + 8) + 'px';
      host.appendChild(h);
      setTimeout(() => h.remove(), 1000);
    }
  }
  function petParrot(id) {
    wake();
    const card = document.querySelector('.parrot-card[data-parrot="' + id + '"]');
    const p = L.PARROTS.filter(x => x.id === id)[0];
    if (!card || !p) return;
    card.classList.add('pet');
    state.pets = (state.pets | 0) + 1;
    const bubble = card.querySelector('.bubble');
    const lines = p.quips || ['Hi!'];
    bubble.textContent = lines[Math.floor(Math.random() * lines.length)];
    bubble.hidden = false;
    bond(id, 1);
    save();
    AUDIO.play('chirp-' + id);
    burstHearts(card);
    setTimeout(() => { card.classList.remove('pet'); bubble.hidden = true; }, 1200);
  }
  function lookAtSeed() {
    $$('.parrot-card').forEach(c => c.classList.add('watching'));
  }

  function renderGift() {
    const b = $('#btnGift');
    if (!b) return;
    const ready = L.giftReady(state, Date.now());
    b.hidden = !ready;
    b.textContent = ready ? (L.clearedCount(state) ? 'Lucky gift' : 'Daily gift') : '';
  }

  function renderGroveBits() {
    const isle = L.activeIsland(state);
    const grove = $('#viewGrove');
    if (grove) grove.dataset.island = isle.id;
    const tip = $('#groveTip');
    if (tip) tip.textContent = 'Tap a parrot on the ' + isle.name + ' branches. Every seed hides a piece of the picture.';
    const steal = $('#btnSteal');
    if (steal) steal.hidden = !(state.stolen | 0);
    const combo = $('#comboPill');
    if (combo) {
      combo.hidden = !(state.combo >= 2);
      combo.textContent = state.combo >= 2 ? ('Combo ×' + state.combo) : '';
    }
    renderPalm();
    renderSeeds();
    renderParrots();
    updateGrowNote();
    renderGift();
    renderCoach();
  }

  function pip(rarity) {
    const s = document.createElement('span');
    s.className = 'pip ' + rarity;
    s.textContent = L.RARITY_LABEL[rarity];
    return s;
  }

  function renderMap() {
    const isle = L.activeIsland(state);
    const total = isle.tiles.length;
    const placed = L.placedCount(state);
    $('#mapTitle').textContent = isle.name;
    const left = total - placed;
    $('#mapSub').textContent = placed >= total
      ? isle.name + ' is whole. Score ' + (state.score | 0) + '.'
      : placed + ' of ' + total + ' set. ' + L.foundCount(state) + ' in the tray or album. Score ' + (state.score | 0) + '.';
    $('#mapBar').style.width = (placed / total * 100) + '%';
    $('#btnTreasure').hidden = !L.isComplete(state);
    const sw = $('#islandSwitch');
    sw.replaceChildren();
    L.ISLANDS.forEach(cand => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn island-chip';
      b.setAttribute('aria-pressed', cand.id === isle.id ? 'true' : 'false');
      const open = L.isUnlocked(state, cand);
      b.disabled = !open;
      b.textContent = open ? cand.name : 'Locked';
      b.addEventListener('click', () => {
        const moved = L.switchIsland(state, cand.id);
        if (!moved.ok) { toast('Finish the island before this one.'); return; }
        state = moved.state;
        save();
        AUDIO.play('tap');
        renderAll();
      });
      sw.appendChild(b);
    });
    const board = $('#mapBoard');
    board.classList.toggle('picture-done', placed >= total);
    board.classList.toggle('almost', left > 0 && left <= 2);
    board.replaceChildren();
    isle.tiles.forEach(tile => {
      const owned = L.hasTile(state, tile.id);
      const on = !!(state.placed && state.placed[tile.id]);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'slot rarity-' + tile.rarity + (on ? ' placed' : owned ? ' ready' : ' missing');
      b.dataset.id = tile.id;
      b.setAttribute('role', 'gridcell');
      const art = document.createElement('span');
      art.className = 'art';
      art.innerHTML = ART.tile(tile, !on);
      const name = document.createElement('span');
      name.className = 'slot-name';
      name.textContent = tile.name;
      b.append(art, name, pip(tile.rarity));
      const status = on ? 'placed' : owned ? 'ready to place' : 'not found yet';
      b.setAttribute('aria-label', tile.name + ', ' + L.RARITY_LABEL[tile.rarity] + ', ' + status);
      b.addEventListener('click', () => onSlot(tile.id));
      board.appendChild(b);
    });
    const tray = $('#tray');
    tray.replaceChildren();
    const waiting = L.unplaced(state);
    $('#trayEmpty').hidden = waiting.length > 0 || L.isComplete(state);
    waiting.forEach(tile => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tray-card' + (held === tile.id ? ' held' : '');
      b.dataset.id = tile.id;
      b.innerHTML = '<span class="art"></span><span></span>';
      b.querySelector('.art').innerHTML = ART.tile(tile);
      b.querySelector('span:last-child').textContent = tile.name;
      b.setAttribute('aria-label', (held === tile.id ? 'Selected. ' : 'Pick up ') + tile.name);
      let moved = false;
      b.addEventListener('pointerdown', ev => startDrag(ev, tile.id, () => { moved = true; }));
      b.addEventListener('click', () => {
        if (moved) { moved = false; return; }
        held = held === tile.id ? null : tile.id;
        AUDIO.play('tap');
        renderMap();
      });
      tray.appendChild(b);
    });
    let auto = $('#btnAutoPlace');
    if (!auto) {
      auto = document.createElement('button');
      auto.type = 'button';
      auto.id = 'btnAutoPlace';
      auto.className = 'btn map-done';
      auto.textContent = 'Auto-place all';
      auto.addEventListener('click', () => doAutoPlace());
      tray.parentNode.insertBefore(auto, $('#btnTreasure'));
    }
    auto.hidden = waiting.length === 0;
  }

  function albumTiles() {
    if (albumIsland === 'all') return L.ALL_TILES;
    if (albumIsland === 'here') return L.activeTiles(state);
    const isle = L.islandById(albumIsland);
    return isle ? isle.tiles : L.activeTiles(state);
  }

  function renderStickers() {
    const grid = $('#stickerGrid');
    if (!grid) return;
    grid.replaceChildren();
    L.STICKERS.forEach(st => {
      const on = !!(state.stickers && state.stickers[st.id]);
      const cell = document.createElement('div');
      cell.className = 'sticker' + (on ? ' got' : ' locked');
      cell.innerHTML = '<span class="mark"></span><span class="lbl"></span>';
      cell.querySelector('.mark').textContent = on ? st.mark : '?';
      cell.querySelector('.lbl').textContent = on ? st.name : st.hint;
      grid.appendChild(cell);
    });
  }

  function renderAlbum() {
    renderStickers();
    const list = albumTiles();
    const found = L.foundCount(state, list);
    $('#albumSub').textContent = found + ' of ' + list.length + ' tiles in this view';
    $('#albumBar').style.width = (found / list.length * 100) + '%';
    const isleRow = $('#islandFilters');
    isleRow.replaceChildren();
    [['here', 'This island'], ['all', 'All islands']].concat(L.ISLANDS.map(i => [i.id, i.name])).forEach(([id, label]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn filter-chip';
      b.setAttribute('aria-pressed', albumIsland === id ? 'true' : 'false');
      b.textContent = label;
      b.addEventListener('click', () => { albumIsland = id; renderAlbum(); });
      isleRow.appendChild(b);
    });
    const filters = $('#filters');
    const chips = [['all', 'All'], ['found', 'Found'], ['missing', 'Missing'], ['common', 'Common'], ['epic', 'Epic'], ['legendary', 'Legendary'], ['extra', 'Extra']];
    filters.replaceChildren();
    chips.forEach(([id, label]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn filter-chip';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', filter === id ? 'true' : 'false');
      b.textContent = label;
      b.addEventListener('click', () => { filter = id; renderAlbum(); });
      filters.appendChild(b);
    });
    const grid = $('#bookGrid');
    grid.replaceChildren();
    const tiles = list.filter(t => {
      const owned = L.hasTile(state, t.id);
      if (filter === 'found') return owned;
      if (filter === 'missing') return !owned;
      if (L.RARITIES.includes(filter)) return t.rarity === filter;
      return true;
    });
    $('#bookEmpty').hidden = tiles.length > 0;
    $('#bookEmpty').textContent = filter === 'missing' ? 'Nothing missing. The album is full!' : 'No tiles in this filter yet.';
    tiles.forEach(tile => {
      const owned = L.hasTile(state, tile.id);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'book-cell' + (owned ? '' : ' missing') + (chain.tiles.has(tile.n) ? ' onchain' : '');
      b.innerHTML = '<span class="art"></span><span class="lbl"></span>';
      b.querySelector('.art').innerHTML = ART.tile(tile, !owned);
      b.querySelector('.lbl').textContent = tile.name;
      b.appendChild(pip(tile.rarity));
      const count = L.ownedCount(state, tile.id);
      const spare = document.createElement('span');
      spare.className = 'count-line';
      spare.textContent = owned ? ('×' + count + (count > 1 ? ' · ' + (count - 1) + ' spare' : ' · no spare')) : 'Missing';
      b.appendChild(spare);
      if (count > 1) {
        const c = document.createElement('span');
        c.className = 'count';
        c.textContent = '×' + count;
        b.appendChild(c);
      }
      b.setAttribute('aria-label', tile.name + ', ' + L.RARITY_LABEL[tile.rarity] + (owned ? ', owned times ' + count : ', missing'));
      b.addEventListener('click', () => openDetail(tile.id));
      grid.appendChild(b);
    });
    renderNest();
    if (detailId && !$('#detail').hidden) paintDetail();
  }

  function renderNest() {
    const box = $('#nestRows');
    box.replaceChildren();
    L.RARITIES.forEach(r => {
      const rule = L.TRADE[r];
      const dupes = L.duplicateCount(state, r);
      const row = document.createElement('div');
      row.className = 'nest-row';
      const info = document.createElement('div');
      const title = document.createElement('b');
      title.textContent = L.RARITY_LABEL[r];
      const p = document.createElement('p');
      p.textContent = dupes + ' spare' + (dupes === 1 ? '' : 's') + ' · ' + rule.label;
      info.append(title, p);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn';
      btn.textContent = dupes >= rule.need ? 'Trade' : 'Need ' + rule.need;
      btn.disabled = dupes < rule.need;
      btn.addEventListener('click', () => doTrade(r));
      row.append(info, btn);
      box.appendChild(row);
    });
  }

  function renderStats() {
    const box = $('#statBox');
    if (!box) return;
    const bits = [
      [state.opens, 'seeds cracked'],
      [L.foundCount(state), 'tiles found'],
      [state.stats.trades || 0, 'trades']
    ];
    box.replaceChildren();
    bits.forEach(([n, label]) => {
      const d = document.createElement('div');
      const b = document.createElement('b');
      b.textContent = String(n);
      const s = document.createElement('span');
      s.textContent = label;
      d.append(b, s);
      box.appendChild(d);
    });
  }

  function renderAll() {
    updateHud();
    renderGroveBits();
    if (view === 'map') renderMap();
    if (view === 'album') renderAlbum();
    renderStats();
  }

  function renderCoach() {
    const el = $('#coach');
    if (!el) return;
    if ((state.coach | 0) >= 4) { el.hidden = true; return; }
    const steps = [
      'Tap the palm. Ripe seeds fall into your pouch.',
      'Pick a seed, then tap me. I will crack out a map piece.',
      'That piece waits in the tray. Drag it onto its spot, or tap it and then tap the slot.',
      'The sticker book is in the album. Come see what you have earned.'
    ];
    el.hidden = false;
    $('#coachText').textContent = 'Mango: ' + (steps[state.coach] || steps[0]);
    $('#coachStep').textContent = ((state.coach | 0) + 1) + ' / 4';
  }
  function advanceCoach(n) {
    if ((state.coach | 0) !== n) return;
    state.coach = Math.min(4, n + 1);
    if (state.coach >= 4) state.onboarded = true;
    save();
    renderCoach();
  }

  function ensurePick() {
    if ((state.seeds[state.seedPick] || 0) > 0) return;
    const next = L.SEED_KINDS.find(k => (state.seeds[k] || 0) > 0);
    if (next) state.seedPick = next;
  }

  const LINES = {
    common: ['Crunch!', 'Yum!', 'Nom!'],
    epic: ['Ooh!', 'Shiny!', 'Sweet!'],
    legendary: ['Whoa!', 'Gold!', 'Legend!'],
    extra: ['EXTRA!', 'The one!', 'No way!']
  };

  function playCrack(kind, rarity) {
    const el = $('#crack');
    if (!el) return;
    el.hidden = false;
    el.className = 'crack rarity-' + rarity;
    el.querySelector('.crack-seed').innerHTML = ART.seed(kind);
    document.body.classList.remove('flash-legendary', 'flash-extra');
    if (rarity === 'legendary' || rarity === 'extra') document.body.classList.add('flash-' + rarity);
    const app = $('#app');
    if (app) { app.classList.remove('shake'); if (rarity === 'extra') { void app.offsetWidth; app.classList.add('shake'); } }
    const ms = state.calm || reduced() ? 80 : (rarity === 'extra' ? 860 : rarity === 'legendary' ? 680 : 460);
    setTimeout(() => { el.hidden = true; }, ms);
  }

  function feedParrot(parrotId) {
    if (busy || anyModal()) return;
    if (!L.parrotUnlocked(state, parrotId)) {
      AUDIO.play('no');
      toast('That parrot is still on another island.');
      return;
    }
    ensurePick();
    const kind = state.seedPick;
    if ((state.seeds[kind] || 0) < 1) {
      AUDIO.play('no');
      toast(L.totalSeeds(state.seeds) > 0 ? 'Pick a seed you still have.' : 'The pouch is empty. Tap the palm, or trade duplicates.');
      return;
    }
    const result = L.feed(state, { seedKind: kind, parrotId: parrotId });
    if (!result.ok) {
      AUDIO.play('no');
      toast('That seed got away. Try again.');
      return;
    }
    busy = true;
    state = result.state;
    bond(parrotId, 2);
    const stamped = L.noteCombo(state, Date.now());
    state = stamped.state;
    if (stamped.bonus) toast('Combo ×' + stamped.combo + '! A spare seed popped loose.');
    const snatch = L.stealSeed(state, Math.random());
    if (snatch.ok) {
      state = snatch.state;
      toast('A parrot snatched a ripe seed. Tap to take it back!');
    }
    absorbStickers();
    wake();
    advanceCoach(1);
    save();
    const btn = document.querySelector('.parrot[data-parrot="' + parrotId + '"]');
    const rarity = result.roll.rarity;
    AUDIO.play('chirp-' + parrotId);
    if (btn) {
      btn.classList.add('hop', 'cracking');
      const bubble = btn.querySelector('.bubble');
      const lines = LINES[rarity] || LINES.common;
      bubble.textContent = lines[(state.opens || 0) % lines.length];
      bubble.hidden = false;
      setTimeout(() => { btn.classList.remove('hop', 'cracking'); if (rarity !== 'legendary' && rarity !== 'extra') bubble.hidden = true; }, 900);
    }
    playCrack(kind, rarity);
    AUDIO.play('crack');
    if (rarity === 'legendary' || rarity === 'extra') {
      const palm = $('#btnPalm');
      if (palm) {
        palm.classList.add('glad');
        setTimeout(() => palm.classList.remove('glad'), 1600);
      }
      $$('.parrot-card').forEach(card => {
        card.classList.add('cheer');
        const bubble = card.querySelector('.bubble');
        const mine = btn && card.contains(btn);
        if (bubble && !mine) {
          bubble.textContent = rarity === 'extra' ? 'Yay!' : 'Ooh!';
          bubble.hidden = false;
        }
        setTimeout(() => {
          card.classList.remove('cheer');
          if (bubble) bubble.hidden = true;
        }, 1500);
      });
    }
    const sound = rarity === 'common' ? 'common' : rarity;
    const wait = state.calm || reduced() ? 60 : (rarity === 'extra' ? 820 : rarity === 'legendary' ? 640 : 420);
    setTimeout(() => {
      AUDIO.play(sound);
      openReveal(result);
      updateHud();
      renderSeeds();
      renderPalm();
      busy = false;
    }, wait);
  }

  function openReveal(result) {
    const tile = result.roll.tile;
    revealTile = tile;
    const modal = $('#reveal');
    modal.classList.remove('rarity-common', 'rarity-epic', 'rarity-legendary', 'rarity-extra');
    modal.classList.add('rarity-' + tile.rarity);
    const badge = $('#revealRarity');
    badge.className = 'rarity-badge ' + tile.rarity;
    badge.textContent = tile.rarity === 'extra' ? '★ Extra ★' : L.RARITY_LABEL[tile.rarity];
    $('#revealArt').innerHTML = ART.tile(tile);
    $('#revealName').textContent = tile.name;
    $('#revealBlurb').textContent = tile.blurb;
    const count = L.ownedCount(state, tile.id);
    const isleName = L.islandById(tile.island).name;
    $('#revealDupe').textContent = result.isNew
      ? 'A new piece of ' + isleName + '.'
      : 'Duplicate ×' + count + ' · ' + (count - 1) + ' spare' + (count > 2 ? 's' : '') + '. The nest can trade them.';
    const placed = !!(state.placed && state.placed[tile.id]);
    $('#revealPlace').hidden = placed;
    const mint = $('#revealMint');
    const rare = tile.rarity === 'legendary' || tile.rarity === 'extra';
    mint.hidden = !rare;
    $('#revealMintStatus').textContent = '';
    if (rare) paintMintButton(mint, tile);
    openModal('reveal');
    if (tile.rarity === 'legendary' || tile.rarity === 'extra') {
      confetti(tile.rarity === 'extra' ? 48 : 28);
      buzz(tile.rarity === 'extra' ? [20, 40, 20] : 16);
    }
    announce((result.isNew ? 'New tile, ' : 'Duplicate, ') + tile.name + ', ' + L.RARITY_LABEL[tile.rarity]);
    document.dispatchEvent(new CustomEvent('pp:reveal', { detail: { id: tile.id, n: tile.n, rarity: tile.rarity } }));
  }

  function paintMintButton(btn, tile) {
    if (!btn) return;
    const minted = chain.tiles.has(tile.n);
    if (minted) { btn.hidden = true; return; }
    btn.hidden = false;
    btn.textContent = '✦ Mint on Starknet';
  }

  function doPlace(id, already) {
    const result = already || L.placeTile(state, id);
    if (!result.ok) {
      if (result.reason === 'not-owned') toast('That piece is still inside a seed.');
      else if (result.reason === 'placed') toast('Already on the map.');
      return;
    }
    state = result.state;
    absorbStickers();
    advanceCoach(2);
    save();
    AUDIO.play(result.firstClear ? 'complete' : 'snap');
    if (result.points) toast('+' + result.points);
    closeModal('reveal');
    closeModal('detail');
    showView('map');
    renderMap();
    updateHud();
    const slot = document.querySelector('.slot[data-id="' + id + '"]');
    if (slot) slot.classList.add('just');
    announce(result.tile.name + ' snapped into ' + L.islandById(result.tile.island).name);
    if (result.firstClear) {
      confetti(result.firstClear.id === 'moonpearl' ? 90 : 70);
      buzz([12, 30, 12, 30, 20]);
      const isle = result.firstClear;
      setTimeout(() => openTreasure(isle, result), state.calm || reduced() ? 0 : 420);
    }
  }

  function startDrag(ev, id, markMoved) {
    if (ev.button != null && ev.button !== 0) return;
    const startX = ev.clientX;
    const startY = ev.clientY;
    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.innerHTML = ART.tile(L.byId[id]);
    ghost.hidden = true;
    document.body.appendChild(ghost);
    let dragged = false;
    const move = e => {
      if (!dragged && Math.hypot(e.clientX - startX, e.clientY - startY) < 8) return;
      dragged = true;
      ghost.hidden = false;
      ghost.style.left = e.clientX + 'px';
      ghost.style.top = e.clientY + 'px';
    };
    const up = e => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      ghost.remove();
      if (!dragged) return;
      if (markMoved) markMoved();
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const slot = el && el.closest ? el.closest('.slot') : null;
      held = id;
      if (slot) onSlot(slot.dataset.id);
      else renderMap();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  function onSlot(id) {
    if (state.placed && state.placed[id]) { openDetail(id); return; }
    if (!held) {
      const tile = L.byId[id];
      AUDIO.play('no');
      toast(L.hasTile(state, id) ? 'Pick ' + tile.name + ' from the tray, then tap this spot.' : tile.name + ' is still inside a seed.');
      return;
    }
    const result = L.tryPlace(state, held, id);
    if (!result.ok) {
      AUDIO.play('no');
      const slot = document.querySelector('.slot[data-id="' + id + '"]');
      if (slot) {
        slot.classList.remove('wobble');
        void slot.offsetWidth;
        slot.classList.add('wobble');
        setTimeout(() => slot.classList.remove('wobble'), 480);
      }
      if (result.reason === 'wrong-slot') toast('That spot is for a different piece.');
      return;
    }
    held = null;
    doPlace(id, result);
  }

  function doAutoPlace() {
    const result = L.autoPlace(state);
    if (!result.placed) { AUDIO.play('no'); toast('Nothing in the tray to place.'); return; }
    held = null;
    state = result.state;
    absorbStickers();
    save();
    AUDIO.play('snap');
    showView('map');
    renderMap();
    updateHud();
    toast('Placed ' + result.placed + ' piece' + (result.placed > 1 ? 's' : '') + '.');
    if (result.firstClear) {
      confetti(40);
      setTimeout(() => openTreasure(result.firstClear, result), state.calm || reduced() ? 0 : 420);
    }
  }

  function doTrade(rarity) {
    const result = L.trade(state, rarity);
    if (!result.ok) {
      AUDIO.play('no');
      toast(result.reason === 'pouch-full' ? 'Your pouch is full.' : 'Not enough duplicates yet.');
      return;
    }
    state = result.state;
    save();
    AUDIO.play('trade');
    toast('Traded for ' + result.granted + ' ' + L.SEED_LABEL[result.kind].toLowerCase() + ' seed' + (result.granted > 1 ? 's' : '') + '.');
    renderAll();
  }

  function collectPalm() {
    state = L.applyGrowth(state, Date.now());
    const result = L.collectRipe(state);
    if (!result.ok) {
      AUDIO.play('no');
      toast(result.reason === 'pouch-full' ? 'Your pouch is full.' : 'No ripe seeds yet.');
      updateGrowNote();
      return;
    }
    state = result.state;
    advanceCoach(0);
    save();
    const palm = $('#btnPalm');
    if (palm) {
      palm.classList.remove('picked');
      void palm.offsetWidth;
      palm.classList.add('picked');
      setTimeout(() => palm.classList.remove('picked'), 520);
    }
    AUDIO.play('collect');
    toast(result.took === 1 ? 'Caught 1 plain seed.' : 'Caught ' + result.took + ' plain seeds.');
    renderAll();
  }

  function openDetail(id) {
    detailId = id;
    paintDetail();
    openModal('detail');
  }
  function paintDetail() {
    const tile = L.byId[detailId];
    if (!tile) return;
    const owned = L.hasTile(state, tile.id);
    const badge = $('#detailRarity');
    badge.className = 'rarity-badge ' + tile.rarity;
    badge.textContent = L.RARITY_LABEL[tile.rarity];
    $('#detailArt').innerHTML = ART.tile(tile, !owned);
    $('#detailName').textContent = tile.name;
    $('#detailBlurb').textContent = owned ? tile.blurb : 'Still tucked inside a seed.';
    const count = L.ownedCount(state, tile.id);
    const where = state.placed && state.placed[tile.id] ? 'On the map.' : owned ? 'In your album, not placed yet.' : 'Not found yet.';
    $('#detailCount').textContent = (owned ? 'Owned ×' + count + '. ' : '') + where;
    const place = $('#detailPlace');
    place.hidden = !owned || !!(state.placed && state.placed[tile.id]);
    const mint = $('#detailMint');
    const rare = owned && (tile.rarity === 'legendary' || tile.rarity === 'extra');
    mint.hidden = !rare || chain.tiles.has(tile.n);
    $('#detailMintStatus').textContent = '';
    if (rare) paintMintButton(mint, tile);
  }

  function openTreasure(isle, result) {
    const here = isle || L.activeIsland(state);
    $('#treasureArt').innerHTML = ART.mapFull(here.id);
    confetti(here.id === 'moonpearl' ? 80 : 64);
    $('#treasureTitle').textContent = here.prize;
    $('#treasureBlurb').textContent = here.blurb;
    const next = (result && result.unlockedIsland) || L.ISLANDS.filter(i => i.needs === here.id)[0];
    const bird = result && result.unlockedParrot;
    const note = $('#treasureNext');
    if (next && L.isUnlocked(state, next)) {
      note.textContent = next.name + ' is on the horizon' + (bird ? ('. ' + bird.name + ' wants to meet you.') : '.');
    } else if (!next) {
      note.textContent = 'Every island is whole. The flock wears a tiny crown of light.';
    } else note.textContent = '';
    state.seenPrize = Object.assign({}, state.seenPrize, { [here.id]: true });
    state.celebrated = !!state.seenPrize.coconut;
    save();
    const minted = chain.chart;
    $('#chartMint').hidden = minted || here.id !== 'coconut';
    $('#chartMintStatus').textContent = '';
    openModal('treasure');
    announce(here.name + ' is complete. You found ' + here.prize + '.');
  }

  function dance() {
    $$('.parrot-card').forEach(p => {
      p.classList.add('cheer');
      setTimeout(() => p.classList.remove('cheer'), 1500);
    });
    AUDIO.play('complete');
  }

  function bind() {
    $$('[data-view]').forEach(b => b.addEventListener('click', () => { AUDIO.play('tap'); showView(b.getAttribute('data-view')); }));
    $('#seedPill').addEventListener('click', () => showView('grove'));
    $('#mapPill').addEventListener('click', () => showView('map'));
    $('#btnPalm').addEventListener('click', collectPalm);
    const stealBtn = $('#btnSteal');
    if (stealBtn) stealBtn.addEventListener('click', () => {
      const got = L.recoverSteal(state);
      if (!got.ok) { AUDIO.play('no'); toast(got.reason === 'pouch-full' ? 'Your pouch is full.' : 'Nothing to take back.'); return; }
      state = got.state;
      save();
      AUDIO.play('chirp');
      toast('Got it back, plus a giggle.');
      renderAll();
    });
    $('#logo').addEventListener('click', dance);
    $('#logo').innerHTML = ART.logo();
    $('#btnMute').addEventListener('click', () => {
      state.muted = !state.muted;
      save();
      updateHud();
      if (!state.muted) AUDIO.play('pop');
    });
    $('#btnMenu').addEventListener('click', () => { renderStats(); openModal('menu'); });
    $('#btnMusic').addEventListener('click', () => {
      state.music = !state.music;
      save();
      updateHud();
      if (state.music && !state.muted) AUDIO.play('pop');
      toast(state.music ? 'Cozy music on.' : 'Cozy music off.');
    });
    $('#btnCalm').addEventListener('click', () => {
      state.calm = !state.calm;
      save();
      updateHud();
      toast(state.calm ? 'Gentle mode on.' : 'Gentle mode off.');
    });
    $('#btnHow').addEventListener('click', () => openModal('how'));
    $('#btnReset').addEventListener('click', () => {
      const btn = $('#btnReset');
      if (btn.dataset.arm !== '1') {
        btn.dataset.arm = '1';
        btn.textContent = 'Tap again to erase';
        setTimeout(() => { btn.dataset.arm = ''; btn.textContent = 'Erase progress'; }, 4000);
        return;
      }
      state = L.freshState(Date.now());
      state.onboarded = true;
      state.coach = 4;
      save();
      closeModal('menu');
      showView('grove');
      renderAll();
      toast('A fresh island. The parrots forgot, kindly.');
    });
    $('#btnWalletSettings').addEventListener('click', () => {
      const w = $('#btnWallet');
      if (w && !w.hidden) w.click();
      else toast('The wallet button is optional. The game is ready without it.');
    });
    $('#revealOk').addEventListener('click', () => closeModal('reveal'));
    $('#revealPlace').addEventListener('click', () => {
      closeModal('reveal');
      showView('map');
      toast('It is in the tray. Drag it onto the matching spot.');
    });
    $('#detailPlace').addEventListener('click', () => {
      if (detailId) held = detailId;
      closeModal('detail');
      showView('map');
    });
    $('#btnTreasure').addEventListener('click', () => openTreasure(L.activeIsland(state)));
    $('#coachNext').addEventListener('click', () => { advanceCoach(state.coach); });
    $('#coachSkip').addEventListener('click', () => { state.coach = 4; state.onboarded = true; save(); renderCoach(); });
    $('#revealMint').addEventListener('click', () => requestMint('tile', revealTile));
    $('#detailMint').addEventListener('click', () => requestMint('tile', L.byId[detailId]));
    $('#chartMint').addEventListener('click', () => requestMint('chart', null));
    document.body.addEventListener('click', e => {
      const b = e.target.closest('[data-close]');
      if (!b) return;
      const m = b.closest('.modal');
      if (m) closeModal(m);
    });
    $$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) closeModal(m); }));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        const open = $$('.modal').filter(m => !m.hidden);
        if (open.length) closeModal(open[open.length - 1]);
        return;
      }
      if (anyModal() || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '1') feedParrot('mango');
      else if (e.key === '2') feedParrot('pip');
      else if (e.key === '3') feedParrot('nova');
      else if (e.key === '4') feedParrot('lulu');
      else if (e.key === '5') feedParrot('sol');
      else if (e.key === 'g' || e.key === 'G') showView('grove');
      else if (e.key === 'm' || e.key === 'M') showView('map');
      else if (e.key === 'a' || e.key === 'A') showView('album');
      else if (e.key === '?') openModal('how');
    });
  }

  function requestMint(kind, tile) {
    if (!window.PP_CHAIN) {
      toast('Collectibles are optional. Your tiles stay in the album.');
      return;
    }
    if (kind === 'chart') window.PP_CHAIN.mintChart($('#chartMintStatus'));
    else window.PP_CHAIN.mintTile(tile, kind === 'tile' && revealTile && tile && tile.id === revealTile.id ? $('#revealMintStatus') : $('#detailMintStatus'));
  }

  function setChain(info) {
    chain.tiles = new Set(info && info.tiles || []);
    chain.chart = !!(info && info.chart);
    if (view === 'album') renderAlbum();
    if (!$('#detail').hidden) paintDetail();
    if (revealTile) paintMintButton($('#revealMint'), revealTile);
    if (!$('#treasure').hidden && chain.chart) $('#chartMint').hidden = true;
  }

  let floatTimer = 0;
  function scheduleFloaty() {
    clearTimeout(floatTimer);
    floatTimer = setTimeout(() => {
      const el = $('#floaty');
      if (!el || document.hidden) { scheduleFloaty(); return; }
      const butterfly = L.floatyKind(state, Math.random()) === 'butterfly';
      el.dataset.kind = butterfly ? 'butterfly' : 'coconut';
      el.innerHTML = butterfly ? ART.butterfly() : ART.seed('plain');
      el.style.left = (6 + Math.random() * 72) + '%';
      el.style.top = (12 + Math.random() * 48) + '%';
      el.hidden = false;
      el.classList.toggle('falling', !butterfly);
      el.setAttribute('aria-label', butterfly ? 'Tap the golden butterfly' : 'Catch the falling coconut');
      setTimeout(() => { if (!el.hidden) { el.hidden = true; scheduleFloaty(); } }, 9000);
    }, 18000 + Math.random() * 22000);
  }

  function init() {
    ensurePick();
    bind();
    if (window.PP_ART && ART.mountMaps) ART.mountMaps();
    renderAll();
    showView('grove');
    renderCoach();
    const floaty = $('#floaty');
    if (floaty) {
      floaty.addEventListener('click', () => {
        const kind = floaty.dataset.kind || 'coconut';
        const got = L.claimBonus(state, kind);
        floaty.hidden = true;
        if (!got.ok) { AUDIO.play('no'); toast(got.reason === 'pouch-full' ? 'Your pouch is full.' : 'It fluttered away.'); scheduleFloaty(); return; }
        state = got.state;
        absorbStickers();
        save();
        AUDIO.play(kind === 'butterfly' ? 'butterfly' : 'collect');
        toast(kind === 'butterfly' ? 'A golden butterfly left a lucky seed.' : 'You caught a coconut. +1 plain seed.');
        renderAll();
        scheduleFloaty();
      });
    }
    const gift = $('#btnGift');
    if (gift) gift.addEventListener('click', () => {
      const got = L.claimGift(state, Date.now());
      if (!got.ok) { AUDIO.play('no'); toast(got.reason === 'pouch-full' ? 'Your pouch is full.' : 'The gift already opened today.'); renderGift(); return; }
      state = got.state;
      save();
      AUDIO.play('gift');
      toast(got.kind === 'lucky' ? 'Today’s gift is a lucky seed.' : 'Today’s gift is a plain seed.');
      confetti(18);
      renderAll();
    });
    scheduleFloaty();
    setInterval(() => {
      if (Date.now() - lastPoke > 28000) $$('.parrot-card').forEach(c => c.classList.add('sleepy'));
    }, 4000);
    const isle = L.activeIsland(state);
    if (L.isComplete(state) && !(state.seenPrize && state.seenPrize[isle.id])) openTreasure(isle);
    setInterval(() => {
      const next = L.applyGrowth(state, Date.now());
      if (next.ripe !== state.ripe) {
        state = next;
        save();
        renderPalm();
      }
      if (view === 'grove') updateGrowNote();
    }, 1000);
    if (!location.search.includes('nosw=1') && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
    window.PP_GAME = {
      getState: () => state,
      setChain: setChain,
      ui: { toast: toast, announce: announce, openModal: openModal, closeModal: closeModal, confetti: confetti },
      isComplete: () => L.isComplete(state),
      showView: showView
    };
    if (new URLSearchParams(location.search).get('debug') === '1') {
      window.PP_GAME.debug = {
        fillSeeds: n => { state.seeds.plain = n; save(); renderAll(); },
        grant: id => { if (!L.byId[id]) return; state.owned[id] = (state.owned[id] || 0) + 1; save(); renderAll(); },
        grantAll: () => { L.TILES.forEach(t => { state.owned[t.id] = Math.max(1, state.owned[t.id] || 0); }); save(); renderAll(); },
        reset: () => { state = L.freshState(Date.now()); state.onboarded = true; state.coach = 4; save(); renderAll(); },
        poke: () => { save(); renderAll(); }
      };
    }
    document.dispatchEvent(new CustomEvent('pp:ready'));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
