/* Parrot Palm rules: seeds, rarities, pity, trades, and the Coconut Isle map.
 * No DOM. Loaded as a classic script in the browser and as CJS by the tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.PP_LOGIC = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const RARITIES = ['common', 'epic', 'legendary', 'extra'];

  const RARITY_LABEL = {
    common: 'Common',
    epic: 'Epic',
    legendary: 'Legendary',
    extra: 'Extra'
  };

  // Natural weights for a plain seed fed to Mango. Parts per thousand.
  // Documented rates: common 70%, epic 20%, legendary 8%, extra 2%.
  const RATES = {
    plain: { common: 700, epic: 200, legendary: 80, extra: 20 },
    lucky: { common: 400, epic: 350, legendary: 180, extra: 70 },
    golden: { common: 0, epic: 450, legendary: 400, extra: 150 }
  };

  // Added to the seed weights (same units), then clamped at 0.
  const PARROT_BIAS = {
    mango: { common: 0, epic: 0, legendary: 0, extra: 0 },
    pip: { common: -60, epic: 60, legendary: 0, extra: 0 },
    nova: { common: -40, epic: 0, legendary: 30, extra: 10 },
    lulu: { common: -80, epic: 30, legendary: 30, extra: 20 },
    sol: { common: -140, epic: 20, legendary: 70, extra: 50 }
  };

  const PARROTS = [
    { id: 'mango', name: 'Mango', title: 'Snacky', line: 'Eats first, asks later. Everyday luck.', hue: 'green', quips: ['Snack?', 'Hi hi!', 'Belly rubs!', 'Crunch friend!'] },
    { id: 'pip', name: 'Pip', title: 'Gourmand', line: 'A rosy beak for epic scraps.', hue: 'rose', quips: ['So sweet!', 'One more?', 'Blush blush.', 'Epic please!'] },
    { id: 'nova', name: 'Nova', title: 'Stargazer', line: 'Hums legends, and sometimes finds the extra seed.', hue: 'indigo', quips: ['I see stars.', 'Shh, magic.', 'Legend time?', 'Twinkle.'] },
    { id: 'lulu', name: 'Lulu', title: 'Four-leaf', line: 'Shows up after Coconut Isle. Luck sticks to her beak.', hue: 'lilac', needs: 'coconut', quips: ['Lucky you!', 'Four leaves!', 'Hee hee!', 'Wish wish.'] },
    { id: 'sol', name: 'Sol', title: 'Sunrise', line: 'Wakes when Starfruit Atoll is whole. Chases extra seeds.', hue: 'gold', needs: 'starfruit', quips: ['Good morning!', 'Extra shiny.', 'I brought sun.', 'Warm hug.'] }
  ];

  const SEED_KINDS = ['plain', 'lucky', 'golden'];
  const SEED_LABEL = { plain: 'Plain', lucky: 'Lucky', golden: 'Golden' };

  // Duplicates only — one copy of each tile always stays in the album.
  const TRADE = {
    common: { need: 2, grant: 'plain', n: 1, label: '2 common duplicates → 1 plain seed' },
    epic: { need: 2, grant: 'plain', n: 1, label: '2 epic duplicates → 1 plain seed' },
    legendary: { need: 2, grant: 'lucky', n: 1, label: '2 legendary duplicates → 1 lucky seed' },
    extra: { need: 1, grant: 'golden', n: 1, label: '1 extra duplicate → 1 golden seed' }
  };

  const CFG = {
    growMs: 20000,
    treeSlots: 3,
    pouchCap: 36,
    startPlain: 12,
    startRipe: 3,
    // Each cleared island shortens the wait, down to this floor.
    growFloor: 12000,
    growBoost: 4000,
    // While this island's extra tile is missing: after this many opens, the next seed is extra.
    extraMercy: 40,
    extraBoostAfter: 16,
    extraBoostPer: 8,
    // Opens since the last new tile. Then a rising chance to be a missing non-extra tile.
    dryStart: 6,
    dryStep: 0.1,
    dryCap: 0.9,
    storeKey: 'parrot-palm-v1'
  };

  // 4×4 Coconut Isle. Row 0 is north. Extra is the single rarest piece.
  const TILES = [
    { id: 'sky-sail', n: 1, name: 'Sunny Smile', rarity: 'common', row: 0, col: 0, motif: 'sail', blurb: 'A smiling sun watches the north water.' },
    { id: 'north-cliff', n: 2, name: 'Palm Crown', rarity: 'common', row: 0, col: 1, motif: 'cliff', blurb: 'Palms crowd the rocks above the falls.' },
    { id: 'sun-peak', n: 3, name: 'Fall Crest', rarity: 'epic', row: 0, col: 2, motif: 'sun', blurb: 'The top of the waterfall, bright and noisy.' },
    { id: 'trade-wind', n: 4, name: 'East Cloud', rarity: 'common', row: 0, col: 3, motif: 'wind', blurb: 'One small cloud drifts off the east shore.' },
    { id: 'parrot-perch', n: 5, name: 'West Palms', rarity: 'epic', row: 1, col: 0, motif: 'perch', blurb: 'A line of palms guards the west jungle.' },
    { id: 'palm-heart', n: 6, name: 'Sandy Bend', rarity: 'common', row: 1, col: 1, motif: 'palms', blurb: 'The path curls down from the blue pool.' },
    { id: 'hidden-falls', n: 7, name: 'Pool Bend', rarity: 'legendary', row: 1, col: 2, motif: 'falls', blurb: 'The blue pool meets the path, and the red X starts here.' },
    { id: 'banana-bend', n: 8, name: 'Cave Grin', rarity: 'common', row: 1, col: 3, motif: 'banana', blurb: 'A round little cave smiles from the cliff.' },
    { id: 'shell-bay', n: 9, name: 'West Rocks', rarity: 'common', row: 2, col: 0, motif: 'shells', blurb: 'Dark rocks nap in the water by the trees.' },
    { id: 'jungle-path', n: 10, name: 'Flower Path', rarity: 'common', row: 2, col: 1, motif: 'path', blurb: 'A leaning palm, pink flowers, and a scrap of the red X.' },
    { id: 'treasure-x', n: 11, name: 'Flower Nook', rarity: 'extra', row: 2, col: 2, motif: 'x', blurb: 'Purple flowers and the last corner of the red X. The rarest piece of the isle.' },
    { id: 'golden-cave', n: 12, name: 'East Garden', rarity: 'legendary', row: 2, col: 3, motif: 'cave', blurb: 'Palms and bright flowers fill the east side.' },
    { id: 'coral-waves', n: 13, name: 'Tide Rocks', rarity: 'common', row: 3, col: 0, motif: 'waves', blurb: 'Round rocks rest in the shallow tide.' },
    { id: 'captains-dock', n: 14, name: 'Shell Beach', rarity: 'epic', row: 3, col: 1, motif: 'dock', blurb: 'Pink and purple shells line the sand.' },
    { id: 'star-compass', n: 15, name: 'Little Dock', rarity: 'legendary', row: 3, col: 2, motif: 'compass', blurb: 'A wooden dock steps out toward the boat.' },
    { id: 'moon-lagoon', n: 16, name: 'Coral Boat', rarity: 'epic', row: 3, col: 3, motif: 'moon', blurb: 'A tiny sailboat waits beside the coral.' }
  ];

  TILES.forEach(t => { t.island = 'coconut'; });

  function pack(island, rows) {
    return rows.map((row, i) => ({
      id: row[0], n: row[1], name: row[2], rarity: row[3], row: row[4], col: row[5],
      motif: row[6], blurb: row[7], island: island
    }));
  }

  const STARFRUIT = pack('starfruit', [
    ['sf-dawn', 17, 'Dawn Peel', 'common', 0, 0, 'sun', 'The sky wakes up the color of juice.'],
    ['sf-rind', 18, 'Blush Clouds', 'common', 0, 1, 'cliff', 'Soft clouds blush over the open water.'],
    ['sf-crown', 19, 'Setting Sun', 'epic', 0, 2, 'fruit', 'The sun sits low, round and warm.'],
    ['sf-breeze', 20, 'Gold Horizon', 'common', 0, 3, 'wind', 'Evening light stretches across the sea.'],
    ['sf-perch', 21, 'Star Turtle', 'epic', 1, 0, 'perch', 'A turtle swims past trees full of stars.'],
    ['sf-grove', 22, 'Star Canopy', 'common', 1, 1, 'palms', 'The orchard wears a crown of gold stars.'],
    ['sf-falls', 23, 'Orchard Stars', 'legendary', 1, 2, 'falls', 'More starry trees, thick as a blanket.'],
    ['sf-slice', 24, 'Beacon Rock', 'common', 1, 3, 'banana', 'A lighthouse keeps watch on its own rock.'],
    ['sf-bay', 25, 'Coral Palms', 'common', 2, 0, 'shells', 'Palms lean over pink coral on the west reef.'],
    ['sf-path', 26, 'Lagoon Heart', 'common', 2, 1, 'path', 'The water is clear enough to count the coral.'],
    ['sf-seed', 27, 'Glitter Lagoon', 'extra', 2, 2, 'x', 'The rarest shimmer. The water here holds a seed of light.'],
    ['sf-cave', 28, 'Star Mark', 'legendary', 2, 3, 'cave', 'A glowing X hangs over a striped hammock.'],
    ['sf-waves', 29, 'Reef Flowers', 'common', 3, 0, 'waves', 'Coral blooms in pink and purple at the south.'],
    ['sf-dock', 30, 'Coral Garden', 'epic', 3, 1, 'dock', 'A bright garden of coral under the shallows.'],
    ['sf-compass', 31, 'Flamingo Beach', 'legendary', 3, 2, 'compass', 'Three flamingos stand in the evening sand.'],
    ['sf-lagoon', 32, 'Hammock Bay', 'epic', 3, 3, 'moon', 'A hammock, a palm, and a turtle heading home.']
  ]);

  const MOONPEARL = pack('moonpearl', [
    ['mp-sail', 33, 'Sleepy Moon', 'common', 0, 0, 'sail', 'The moon has closed its eyes for the night.'],
    ['mp-cliff', 34, 'Star Sky', 'common', 0, 1, 'cliff', 'The sky is full of small bright wishes.'],
    ['mp-gate', 35, 'North Stars', 'epic', 0, 2, 'moon', 'Stars sprinkle the dark above the cay.'],
    ['mp-wind', 36, 'Night Cloud', 'common', 0, 3, 'wind', 'A soft cloud rests at the edge of the sky.'],
    ['mp-perch', 37, 'Dream Palm', 'epic', 1, 0, 'perch', 'This palm sleeps with a smile.'],
    ['mp-heart', 38, 'Dune Palms', 'common', 1, 1, 'palms', 'Little palms gather above the glowing sand.'],
    ['mp-falls', 39, 'Moon Gate', 'legendary', 1, 2, 'falls', 'A stone arch glows at the top of the steps.'],
    ['mp-kelp', 40, 'East Sleeper', 'common', 1, 3, 'banana', 'Another palm naps beside the night water.'],
    ['mp-bay', 41, 'Glow Shore', 'common', 2, 0, 'shells', 'Blue light curls along the west beach.'],
    ['mp-path', 42, 'Shell Garden', 'common', 2, 1, 'path', 'Purple flowers crowd the sand by the pearl.'],
    ['mp-pearl', 43, 'Sleeping Pearl', 'extra', 2, 2, 'x', 'The rarest pearl. It rests in an open shell and dreams the whole cay.'],
    ['mp-cave', 44, 'Lantern Bush', 'legendary', 2, 3, 'cave', 'A round lantern glows in the flowers.'],
    ['mp-waves', 45, 'Star Waves', 'common', 3, 0, 'waves', 'Little stars ride the glowing ripples.'],
    ['mp-dock', 46, 'Glow Tide', 'epic', 3, 1, 'dock', 'The tide draws a bright line around the cay.'],
    ['mp-compass', 47, 'Moon Mark', 'legendary', 3, 2, 'compass', 'A pale X is drawn in the moonlit sand.'],
    ['mp-lagoon', 48, 'Quiet Rocks', 'epic', 3, 3, 'sun', 'Dark rocks sit in the sparkling water.']
  ]);

  const ISLANDS = [
    { id: 'coconut', name: 'Coconut Isle', prize: 'Coco’s Heart', blurb: 'The red X was never a mark to dig. It was the parrots drawing a heart. Under the last seed: a ruby that purrs when the island is complete.', tiles: TILES, parrot: null },
    { id: 'starfruit', name: 'Starfruit Atoll', prize: 'The Sunny Pit', blurb: 'The Star Seed splits and a tiny sun rolls out, warm as a palm. The atoll keeps it for anyone who finishes the orchard.', tiles: STARFRUIT, parrot: 'lulu', needs: 'coconut' },
    { id: 'moonpearl', name: 'Moonpearl Cay', prize: 'The Sleeping Pearl', blurb: 'The last pearl opens one eye, smiles, and goes back to sleep in your hands. The whole cay sighs, happy.', tiles: MOONPEARL, parrot: 'sol', needs: 'starfruit' }
  ];

  const ALL_TILES = [];
  ISLANDS.forEach(isle => isle.tiles.forEach(t => ALL_TILES.push(t)));
  const byId = {};
  ALL_TILES.forEach(t => { byId[t.id] = t; });

  function islandById(id) {
    for (let i = 0; i < ISLANDS.length; i++) if (ISLANDS[i].id === id) return ISLANDS[i];
    return ISLANDS[0];
  }
  function activeIsland(state) {
    return islandById(state && state.islandId);
  }
  function activeTiles(state) {
    return activeIsland(state).tiles;
  }
  function extraTile(list) {
    for (let i = 0; i < list.length; i++) if (list[i].rarity === 'extra') return list[i];
    return list[0];
  }
  function clearedCount(state) {
    let n = 0;
    ISLANDS.forEach(isle => { if (state && state.cleared && state.cleared[isle.id]) n++; });
    return n;
  }
  const FRIEND_AT = [0, 5, 12, 22, 36];
  const ACCESSORY = {
    mango: ['', 'leaf', 'berry', 'crown', 'sun'],
    pip: ['', 'bow', 'heart', 'rose', 'gem'],
    nova: ['', 'spark', 'moon', 'star', 'comet'],
    lulu: ['', 'clover', 'ribbon', 'flower', 'wish'],
    sol: ['', 'ray', 'halo', 'dawn', 'crown']
  };
  const SCORE = { common: 10, epic: 25, legendary: 50, extra: 100 };

  function friendHearts(state, id) {
    return (state && state.friends && state.friends[id]) | 0;
  }
  function friendLevel(hearts) {
    let level = 1;
    const n = hearts | 0;
    for (let i = 1; i < FRIEND_AT.length; i++) {
      if (n >= FRIEND_AT[i]) level = i + 1;
    }
    return level;
  }
  function friendPerk(state, id) {
    return Math.max(0, friendLevel(friendHearts(state, id)) - 1);
  }
  function friendProgress(state, id) {
    const hearts = friendHearts(state, id);
    const level = friendLevel(hearts);
    const prev = FRIEND_AT[level - 1];
    const nextAt = level >= 5 ? hearts : FRIEND_AT[level];
    const span = Math.max(1, (level >= 5 ? 1 : FRIEND_AT[level] - prev));
    const pct = level >= 5 ? 100 : Math.max(0, Math.min(100, Math.round(((hearts - prev) / span) * 100)));
    const list = ACCESSORY[id] || [''];
    return { hearts: hearts, level: level, pct: pct, next: nextAt, accessory: list[level - 1] || '' };
  }
  function addFriendship(state, id, amount) {
    if (!PARROT_BIAS[id]) return { state: state, leveled: false, level: 1, hearts: 0, before: 1 };
    const friends = Object.assign({}, state.friends);
    const prev = friends[id] | 0;
    const hearts = prev + Math.max(0, amount | 0);
    friends[id] = hearts;
    const before = friendLevel(prev);
    const after = friendLevel(hearts);
    return {
      state: Object.assign({}, state, { friends: friends }),
      leveled: after > before,
      level: after,
      before: before,
      hearts: hearts
    };
  }

  function growInterval(state, cfg) {
    if (cfg && cfg.growMs) return cfg.growMs;
    const base = Math.max(CFG.growFloor, CFG.growMs - clearedCount(state) * CFG.growBoost);
    const cut = friendPerk(state, 'pip') * 700;
    return Math.max(CFG.growFloor, base - cut);
  }
  function islandDone(state, isle) {
    return isle.tiles.every(t => state.placed && state.placed[t.id]);
  }
  function isUnlocked(state, isle) {
    if (!isle.needs) return true;
    return !!(state.cleared && state.cleared[isle.needs]);
  }
  function parrotUnlocked(state, id) {
    const p = PARROTS.filter(x => x.id === id)[0];
    if (!p || !p.needs) return true;
    return !!(state.cleared && state.cleared[p.needs]);
  }

  function clampWeights(seedKind, parrotId, state) {
    const base = RATES[seedKind] || RATES.plain;
    const bias = PARROT_BIAS[parrotId] || PARROT_BIAS.mango;
    const out = {};
    RARITIES.forEach(r => { out[r] = Math.max(0, (base[r] || 0) + (bias[r] || 0)); });
    const steps = friendPerk(state, parrotId);
    if (!steps) return out;
    const bump = Math.min(24, steps * 6);
    if (parrotId === 'mango') {
      out.epic += bump;
      out.common = Math.max(0, out.common - bump);
    } else if (parrotId === 'nova' && state && activeIsland(state).id === 'moonpearl') {
      out.legendary += bump;
      out.common = Math.max(0, out.common - bump);
    }
    return out;
  }

  function weightTotal(weights) {
    return RARITIES.reduce((s, r) => s + (weights[r] || 0), 0);
  }

  function pickWeighted(weights, rng) {
    const total = weightTotal(weights);
    if (total <= 0) return 'epic';
    let t = rng() * total;
    for (let i = 0; i < RARITIES.length; i++) {
      t -= weights[RARITIES[i]] || 0;
      if (t < 0) return RARITIES[i];
    }
    return RARITIES[RARITIES.length - 1];
  }

  function ratePercents(seedKind, parrotId) {
    const w = clampWeights(seedKind, parrotId);
    const total = weightTotal(w) || 1;
    const out = {};
    RARITIES.forEach(r => { out[r] = (w[r] / total) * 100; });
    return out;
  }

  function tilesOf(rarity, list) {
    const src = list || ALL_TILES;
    return src.filter(t => t.rarity === rarity);
  }

  function ownedCount(state, id) {
    const n = state && state.owned ? state.owned[id] : 0;
    return n > 0 ? n : 0;
  }

  function hasTile(state, id) {
    return ownedCount(state, id) > 0;
  }

  function duplicateCount(state, rarity) {
    let n = 0;
    tilesOf(rarity).forEach(t => {
      const c = ownedCount(state, t.id);
      if (c > 1) n += c - 1;
    });
    return n;
  }

  function foundCount(state, list) {
    const src = list || activeTiles(state);
    return src.reduce((n, t) => n + (hasTile(state, t.id) ? 1 : 0), 0);
  }

  function placedCount(state, list) {
    const src = list || activeTiles(state);
    return src.reduce((n, t) => n + (state.placed && state.placed[t.id] ? 1 : 0), 0);
  }

  function isComplete(state) {
    return islandDone(state, activeIsland(state));
  }

  function totalSeeds(seeds) {
    return SEED_KINDS.reduce((n, k) => n + ((seeds && seeds[k]) || 0), 0);
  }

  function freshState(now) {
    const t = now == null ? Date.now() : now;
    return {
      v: 3,
      friends: {},
      stickers: {},
      score: 0,
      pets: 0,
      bestCombo: 0,
      seeds: { plain: CFG.startPlain, lucky: 0, golden: 0 },
      ripe: CFG.startRipe,
      lastGrow: t,
      owned: {},
      placed: {},
      opens: 0,
      dry: 0,
      opensWithoutExtra: 0,
      seedPick: 'plain',
      islandId: 'coconut',
      cleared: {},
      seenPrize: {},
      pity: { coconut: { dry: 0, withoutExtra: 0 }, starfruit: { dry: 0, withoutExtra: 0 }, moonpearl: { dry: 0, withoutExtra: 0 } },
      coach: 0,
      music: false,
      lastGift: '',
      combo: 0,
      lastFeedAt: 0,
      stolen: 0,
      muted: false,
      calm: false,
      onboarded: false,
      celebrated: false,
      stats: { feeds: 0, trades: 0, collected: 0, caught: 0, wings: 0 }
    };
  }

  function copySeeds(seeds) {
    return {
      plain: Math.max(0, (seeds && seeds.plain) | 0),
      lucky: Math.max(0, (seeds && seeds.lucky) | 0),
      golden: Math.max(0, (seeds && seeds.golden) | 0)
    };
  }

  function copyMap(obj) {
    const out = {};
    if (!obj) return out;
    Object.keys(obj).forEach(k => {
      const n = obj[k];
      if (n) out[k] = n === true ? true : (n | 0);
    });
    return out;
  }

  function applyGrowth(state, now, cfg) {
    const C = cfg || CFG;
    const t = now == null ? Date.now() : now;
    if (state.ripe >= C.treeSlots) return Object.assign({}, state, { lastGrow: t });
    const elapsed = Math.max(0, t - state.lastGrow);
    const interval = growInterval(state, cfg);
    const intervals = Math.floor(elapsed / interval);
    if (intervals <= 0) return state;
    const room = C.treeSlots - state.ripe;
    const add = Math.min(room, intervals);
    const leftover = elapsed - intervals * interval;
    const lastGrow = add < intervals ? t : t - leftover;
    return Object.assign({}, state, { ripe: state.ripe + add, lastGrow: lastGrow });
  }

  const STICKERS = [
    { id: 'first-feed', name: 'First Bite', hint: 'Feed any parrot.', mark: '🍪', seed: 'plain', test: s => (s.stats && s.stats.feeds | 0) >= 1 },
    { id: 'first-epic', name: 'Shiny Scrap', hint: 'Find an epic tile.', mark: '💜', seed: 'plain', test: s => ALL_TILES.some(t => t.rarity === 'epic' && hasTile(s, t.id)) },
    { id: 'first-legend', name: 'Gold Feather', hint: 'Find a legendary tile.', mark: '🌟', seed: 'lucky', test: s => ALL_TILES.some(t => t.rarity === 'legendary' && hasTile(s, t.id)) },
    { id: 'first-extra', name: 'The Rare One', hint: 'Find an extra tile.', mark: '💎', seed: 'golden', test: s => ALL_TILES.some(t => t.rarity === 'extra' && hasTile(s, t.id)) },
    { id: 'isle-coconut', name: 'Coco Heart', hint: 'Finish Coconut Isle.', mark: '🏝️', seed: 'lucky', test: s => !!(s.cleared && s.cleared.coconut) },
    { id: 'isle-star', name: 'Sunny Pit', hint: 'Finish Starfruit Atoll.', mark: '🌅', seed: 'lucky', test: s => !!(s.cleared && s.cleared.starfruit) },
    { id: 'isle-moon', name: 'Sleeping Pearl', hint: 'Finish Moonpearl Cay.', mark: '🌙', seed: 'golden', test: s => !!(s.cleared && s.cleared.moonpearl) },
    { id: 'combo-10', name: 'Snack Streak', hint: 'Reach a 10-combo.', mark: '🔥', seed: 'plain', test: s => (s.bestCombo | 0) >= 10 || (s.combo | 0) >= 10 },
    { id: 'coconuts-20', name: 'Coconut Catch', hint: 'Catch 20 coconuts.', mark: '🥥', seed: 'plain', test: s => ((s.stats && s.stats.caught) | 0) >= 20 },
    { id: 'pets-50', name: 'Belly Rubs', hint: 'Pet a parrot 50 times.', mark: '💗', seed: 'plain', test: s => (s.pets | 0) >= 50 },
    { id: 'max-friend', name: 'Best Friends', hint: 'Reach level 5 with a parrot.', mark: '🤝', seed: 'lucky', test: s => PARROTS.some(p => friendLevel(friendHearts(s, p.id)) >= 5) },
    { id: 'first-place', name: 'Snap', hint: 'Place a tile in its spot.', mark: '🧩', seed: 'plain', test: s => placedCount(s, ALL_TILES) >= 1 },
    { id: 'all-birds', name: 'Full Flock', hint: 'Meet every parrot.', mark: '🦜', seed: 'lucky', test: s => parrotUnlocked(s, 'sol') },
    { id: 'butterfly', name: 'Golden Wing', hint: 'Catch a golden butterfly.', mark: '🦋', seed: 'plain', test: s => ((s.stats && s.stats.wings) | 0) >= 1 },
    { id: 'score-200', name: 'Puzzle Star', hint: 'Score 200 by placing tiles.', mark: '⭐', seed: 'plain', test: s => (s.score | 0) >= 200 }
  ];

  function checkStickers(state) {
    const have = Object.assign({}, state.stickers);
    const fresh = [];
    STICKERS.forEach(st => {
      if (have[st.id]) return;
      if (!st.test(state)) return;
      have[st.id] = true;
      fresh.push(st);
    });
    let next = Object.assign({}, state, { stickers: have });
    fresh.forEach(st => {
      if (totalSeeds(next.seeds) >= CFG.pouchCap) return;
      const seeds = copySeeds(next.seeds);
      seeds[st.seed] = (seeds[st.seed] || 0) + 1;
      next = Object.assign({}, next, { seeds: seeds });
    });
    return { state: next, unlocked: fresh };
  }

  function loadState(raw, now) {
    let data = raw;
    if (typeof raw === 'string') {
      try { data = JSON.parse(raw); } catch (e) { data = null; }
    }
    const t = now == null ? Date.now() : now;
    const base = freshState(t);
    if (!data || typeof data !== 'object') return base;
    const owned = {};
    ALL_TILES.forEach(tile => {
      const n = data.owned && data.owned[tile.id];
      if ((n | 0) > 0) owned[tile.id] = n | 0;
    });
    const placed = {};
    ALL_TILES.forEach(tile => {
      if (data.placed && data.placed[tile.id] && owned[tile.id]) placed[tile.id] = true;
    });
    const pick = SEED_KINDS.indexOf(data.seedPick) >= 0 ? data.seedPick : 'plain';
    const islandId = islandById(data.islandId).id === data.islandId ? data.islandId : 'coconut';
    const cleared = {};
    ISLANDS.forEach(isle => { if (data.cleared && data.cleared[isle.id]) cleared[isle.id] = true; });
    if (islandDone({ placed: placed }, islandById('coconut'))) cleared.coconut = true;
    const seenPrize = {};
    ISLANDS.forEach(isle => { if (data.seenPrize && data.seenPrize[isle.id]) seenPrize[isle.id] = true; });
    if (data.celebrated === true) seenPrize.coconut = true;
    const pity = {
      coconut: { dry: 0, withoutExtra: 0 },
      starfruit: { dry: 0, withoutExtra: 0 },
      moonpearl: { dry: 0, withoutExtra: 0 }
    };
    ISLANDS.forEach(isle => {
      const bag = data.pity && data.pity[isle.id];
      if (bag) pity[isle.id] = { dry: Math.max(0, bag.dry | 0), withoutExtra: Math.max(0, bag.withoutExtra | 0) };
    });
    if (!data.pity) pity.coconut = { dry: Math.max(0, data.dry | 0), withoutExtra: Math.max(0, data.opensWithoutExtra | 0) };
    const here = pity[islandId] || pity.coconut;
    const coach = data.coach == null ? (data.onboarded ? 3 : 0) : Math.max(0, Math.min(4, data.coach | 0));
    const friends = {};
    PARROTS.forEach(p => {
      const n = data.friends && data.friends[p.id];
      if ((n | 0) > 0) friends[p.id] = n | 0;
    });
    const stickers = {};
    STICKERS.forEach(st => { if (data.stickers && data.stickers[st.id]) stickers[st.id] = true; });
    const merged = {
      v: 3,
      friends: friends,
      stickers: stickers,
      score: Math.max(0, data.score | 0),
      pets: Math.max(0, data.pets | 0),
      bestCombo: Math.max(0, data.bestCombo | 0, data.combo | 0),
      seeds: copySeeds(data.seeds),
      ripe: Math.max(0, Math.min(CFG.treeSlots, data.ripe | 0)),
      lastGrow: typeof data.lastGrow === 'number' ? data.lastGrow : t,
      owned: owned,
      placed: placed,
      opens: Math.max(0, data.opens | 0),
      dry: here.dry,
      opensWithoutExtra: here.withoutExtra,
      seedPick: pick,
      islandId: isUnlocked({ cleared: cleared }, islandById(islandId)) ? islandId : 'coconut',
      cleared: cleared,
      seenPrize: seenPrize,
      pity: pity,
      coach: coach,
      music: !!data.music,
      lastGift: typeof data.lastGift === 'string' ? data.lastGift : '',
      combo: Math.max(0, data.combo | 0),
      lastFeedAt: Math.max(0, data.lastFeedAt | 0),
      stolen: Math.max(0, data.stolen | 0),
      muted: !!data.muted,
      calm: !!data.calm,
      onboarded: !!data.onboarded || coach >= 3,
      celebrated: !!seenPrize.coconut,
      stats: {
        feeds: Math.max(0, data.stats && data.stats.feeds | 0),
        trades: Math.max(0, data.stats && data.stats.trades | 0),
        collected: Math.max(0, data.stats && data.stats.collected | 0),
        caught: Math.max(0, data.stats && data.stats.caught | 0),
        wings: Math.max(0, data.stats && data.stats.wings | 0)
      }
    };
    return applyGrowth(merged, t);
  }

  function nextGrowIn(state, now) {
    if (state.ripe >= CFG.treeSlots) return 0;
    const t = now == null ? Date.now() : now;
    const elapsed = Math.max(0, t - state.lastGrow);
    return Math.max(0, growInterval(state) - elapsed);
  }

  function chooseTile(rarity, state, rng, preferNew) {
    const pool = tilesOf(rarity, activeTiles(state));
    const missing = pool.filter(t => !hasTile(state, t.id));
    const bag = (preferNew !== false && missing.length && rng() < 0.55) ? missing : pool;
    if (!bag.length) return activeTiles(state)[0];
    return bag[Math.floor(rng() * bag.length)];
  }

  function rollSeed(state, opts) {
    const o = opts || {};
    const rng = o.rng || Math.random;
    const seedKind = RATES[o.seedKind] ? o.seedKind : 'plain';
    const parrotId = PARROT_BIAS[o.parrotId] ? o.parrotId : 'mango';
    const pity = o.pity !== false;
    const weights = clampWeights(seedKind, parrotId, state);
    const pool = activeTiles(state);
    const extra = extraTile(pool);
    const hasExtra = hasTile(state, extra.id);
    const missingNonExtra = pool.filter(t => t.rarity !== 'extra' && !hasTile(state, t.id));
    let forced = null;
    let reason = null;

    if (pity && !hasExtra && (state.opensWithoutExtra | 0) >= CFG.extraMercy) {
      forced = extra;
      reason = 'mercy';
    } else if (pity && missingNonExtra.length && (state.dry | 0) >= CFG.dryStart) {
      const p = Math.min(CFG.dryCap, ((state.dry | 0) - (CFG.dryStart - 1)) * CFG.dryStep);
      if (rng() < p) {
        const w = { common: 0, epic: 0, legendary: 0, extra: 0 };
        missingNonExtra.forEach(t => { w[t.rarity] += weights[t.rarity] || 1; });
        const rarity = pickWeighted(w, rng);
        const pool = missingNonExtra.filter(t => t.rarity === rarity);
        forced = pool[Math.floor(rng() * pool.length)] || missingNonExtra[0];
        reason = 'dry';
      }
    }

    if (!forced && pity && !hasExtra && (state.opensWithoutExtra | 0) > CFG.extraBoostAfter) {
      weights.extra += ((state.opensWithoutExtra | 0) - CFG.extraBoostAfter) * CFG.extraBoostPer;
    }

    if (!forced) {
      const rarity = pickWeighted(weights, rng);
      forced = chooseTile(rarity, state, rng, o.preferNew !== false);
      reason = null;
    }

    return {
      tile: forced,
      rarity: forced.rarity,
      duplicate: hasTile(state, forced.id),
      seedKind: seedKind,
      parrotId: parrotId,
      reason: reason
    };
  }

  function applyOpen(state, roll) {
    if (!roll || !roll.tile) throw new Error('missing roll');
    const kind = roll.seedKind || 'plain';
    if ((state.seeds[kind] || 0) < 1) return { ok: false, reason: 'no-seed', state: state };
    const id = roll.tile.id;
    const prev = ownedCount(state, id);
    const owned = Object.assign({}, state.owned);
    owned[id] = prev + 1;
    const seeds = copySeeds(state.seeds);
    seeds[kind] -= 1;
    const isNew = prev === 0;
    const isle = islandById(roll.tile.island || (state && state.islandId));
    const gotExtra = roll.tile.rarity === 'extra';
    const alreadyExtra = hasTile(state, extraTile(isle.tiles).id);
    const dry = isNew ? 0 : (state.dry | 0) + 1;
    const withoutExtra = (alreadyExtra || gotExtra) ? (state.opensWithoutExtra | 0) : (state.opensWithoutExtra | 0) + 1;
    const pityBag = Object.assign({}, state.pity);
    pityBag[isle.id] = { dry: dry, withoutExtra: withoutExtra };
    const next = Object.assign({}, state, {
      seeds: seeds,
      owned: owned,
      opens: (state.opens | 0) + 1,
      dry: dry,
      opensWithoutExtra: withoutExtra,
      pity: pityBag,
      stats: Object.assign({}, state.stats, { feeds: (state.stats.feeds | 0) + 1 })
    });
    return { ok: true, state: next, isNew: isNew };
  }

  function feed(state, opts) {
    const roll = rollSeed(state, opts);
    const applied = applyOpen(state, roll);
    if (!applied.ok) return applied;
    return { ok: true, state: applied.state, roll: roll, isNew: applied.isNew };
  }

  function placeTile(state, id) {
    const tile = byId[id];
    if (!tile) return { ok: false, reason: 'unknown', state: state };
    if (!hasTile(state, id)) return { ok: false, reason: 'not-owned', state: state };
    if (state.placed && state.placed[id]) return { ok: false, reason: 'placed', state: state };
    const placed = Object.assign({}, state.placed);
    placed[id] = true;
    const draft = Object.assign({}, state, { placed: placed });
    const cleared = Object.assign({}, state.cleared);
    let first = null;
    ISLANDS.forEach(isle => {
      if (!cleared[isle.id] && islandDone(draft, isle)) {
        cleared[isle.id] = true;
        if (!first) first = isle;
      }
    });
    const scored = Object.assign({}, draft, {
      cleared: cleared,
      score: (draft.score | 0) + (SCORE[tile.rarity] || 10)
    });
    const next = scored;
    const unlockedIsland = first ? ISLANDS.filter(i => i.needs === first.id)[0] : null;
    return {
      ok: true,
      state: next,
      tile: tile,
      complete: isComplete(next),
      firstClear: first,
      unlockedIsland: unlockedIsland || null,
      unlockedParrot: (PARROTS.filter(p => first && p.needs === first.id)[0] || null),
      points: SCORE[tile.rarity] || 10
    };
  }

  function tryPlace(state, tileId, slotId) {
    if (!byId[tileId] || !byId[slotId]) return { ok: false, reason: 'unknown', state: state };
    if (tileId !== slotId) return { ok: false, reason: 'wrong-slot', state: state };
    return placeTile(state, tileId);
  }

  function switchIsland(state, id) {
    const isle = islandById(id);
    if (isle.id !== id) return { ok: false, reason: 'unknown', state: state };
    if (!isUnlocked(state, isle)) return { ok: false, reason: 'locked', state: state };
    const pity = Object.assign({}, state.pity);
    pity[activeIsland(state).id] = { dry: state.dry | 0, withoutExtra: state.opensWithoutExtra | 0 };
    const bag = pity[id] || { dry: 0, withoutExtra: 0 };
    const next = Object.assign({}, state, {
      islandId: id,
      pity: pity,
      dry: bag.dry | 0,
      opensWithoutExtra: bag.withoutExtra | 0
    });
    return { ok: true, state: next };
  }

  function placeAllOwned(state) {
    let cur = state;
    let n = 0;
    TILES.forEach(t => {
      const r = placeTile(cur, t.id);
      if (r.ok) { cur = r.state; n++; }
    });
    return { state: cur, placed: n, complete: isComplete(cur) };
  }

  function autoPlace(state) {
    let cur = state;
    let n = 0;
    let first = null;
    activeTiles(state).forEach(t => {
      const r = placeTile(cur, t.id);
      if (!r.ok) return;
      cur = r.state;
      n++;
      if (r.firstClear && !first) first = r;
    });
    return {
      state: cur,
      placed: n,
      complete: isComplete(cur),
      firstClear: first ? first.firstClear : null,
      unlockedIsland: first ? first.unlockedIsland : null,
      unlockedParrot: first ? first.unlockedParrot : null
    };
  }

  function trade(state, rarity) {
    const rule = TRADE[rarity];
    if (!rule) return { ok: false, reason: 'unknown', state: state };
    if (duplicateCount(state, rarity) < rule.need) return { ok: false, reason: 'need-dupes', state: state };
    const room = CFG.pouchCap - totalSeeds(state.seeds);
    if (room < 1) return { ok: false, reason: 'pouch-full', state: state };
    const owned = Object.assign({}, state.owned);
    let need = rule.need;
    const order = tilesOf(rarity).slice().sort((a, b) => ownedCount(state, b.id) - ownedCount(state, a.id));
    order.forEach(t => {
      while (need > 0 && (owned[t.id] || 0) > 1) { owned[t.id] -= 1; need -= 1; }
    });
    if (need > 0) return { ok: false, reason: 'need-dupes', state: state };
    const seeds = copySeeds(state.seeds);
    const grant = Math.min(rule.n, CFG.pouchCap - totalSeeds(seeds));
    seeds[rule.grant] += grant;
    const next = Object.assign({}, state, {
      owned: owned,
      seeds: seeds,
      stats: Object.assign({}, state.stats, { trades: (state.stats.trades | 0) + 1 })
    });
    return { ok: true, state: next, granted: grant, kind: rule.grant };
  }

  function collectRipe(state) {
    const room = CFG.pouchCap - totalSeeds(state.seeds);
    if ((state.ripe | 0) <= 0) return { ok: false, reason: 'empty', state: state };
    if (room <= 0) return { ok: false, reason: 'pouch-full', state: state };
    const take = Math.min(state.ripe, room);
    const seeds = copySeeds(state.seeds);
    seeds.plain += take;
    const next = Object.assign({}, state, {
      ripe: state.ripe - take,
      seeds: seeds,
      stats: Object.assign({}, state.stats, { collected: (state.stats.collected | 0) + take })
    });
    return { ok: true, state: next, took: take };
  }

  function unplaced(state) {
    return activeTiles(state).filter(t => hasTile(state, t.id) && !(state.placed && state.placed[t.id]));
  }

  function noteCombo(state, now) {
    const t = now == null ? Date.now() : now;
    const prev = state.lastFeedAt || 0;
    const quick = prev && (t - prev) <= 8000 && (t - prev) >= 0;
    const combo = quick ? (state.combo | 0) + 1 : 1;
    const bestCombo = Math.max(state.bestCombo | 0, combo);
    let next = Object.assign({}, state, { combo: combo, bestCombo: bestCombo, lastFeedAt: t });
    let bonus = null;
    if (combo >= 3 && combo % 3 === 0 && totalSeeds(next.seeds) < CFG.pouchCap) {
      const seeds = copySeeds(next.seeds);
      seeds.plain += 1;
      next = Object.assign({}, next, { seeds: seeds });
      bonus = 'plain';
    }
    return { state: next, combo: combo, bonus: bonus };
  }

  function stealSeed(state, roll) {
    const n = roll == null ? Math.random() : roll;
    if ((state.ripe | 0) < 1 || n > 0.12) return { ok: false, state: state };
    return { ok: true, state: Object.assign({}, state, { ripe: state.ripe - 1, stolen: (state.stolen | 0) + 1 }) };
  }

  function recoverSteal(state) {
    if (!(state.stolen | 0)) return { ok: false, reason: 'none', state: state };
    if (totalSeeds(state.seeds) >= CFG.pouchCap) return { ok: false, reason: 'pouch-full', state: state };
    const seeds = copySeeds(state.seeds);
    seeds.plain += 1;
    return { ok: true, state: Object.assign({}, state, { seeds: seeds, stolen: state.stolen - 1 }) };
  }

  function dateKey(now) {
    const d = new Date(now == null ? Date.now() : now);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function giftReady(state, now) {
    return !state || state.lastGift !== dateKey(now);
  }

  function claimGift(state, now) {
    const t = now == null ? Date.now() : now;
    if (!giftReady(state, t)) return { ok: false, reason: 'already', state: state };
    if (totalSeeds(state.seeds) >= CFG.pouchCap) return { ok: false, reason: 'pouch-full', state: state };
    const kind = clearedCount(state) > 0 ? 'lucky' : 'plain';
    const seeds = copySeeds(state.seeds);
    seeds[kind] += 1;
    return { ok: true, kind: kind, state: Object.assign({}, state, { seeds: seeds, lastGift: dateKey(t) }) };
  }

  function claimBonus(state, kind) {
    const butterfly = kind === 'butterfly';
    const grant = butterfly ? 'lucky' : 'plain';
    if (totalSeeds(state.seeds) >= CFG.pouchCap) return { ok: false, reason: 'pouch-full', state: state };
    const seeds = copySeeds(state.seeds);
    let n = 1;
    if (!butterfly && friendPerk(state, 'lulu') >= 2 && totalSeeds(seeds) + 1 < CFG.pouchCap) n = 2;
    seeds[grant] += n;
    const stats = Object.assign({}, state.stats, {
      bonuses: ((state.stats && state.stats.bonuses) | 0) + 1,
      caught: ((state.stats && state.stats.caught) | 0) + (butterfly ? 0 : 1),
      wings: ((state.stats && state.stats.wings) | 0) + (butterfly ? 1 : 0)
    });
    return { ok: true, grant: grant, n: n, state: Object.assign({}, state, { seeds: seeds, stats: stats }) };
  }

  function floatyKind(state, roll) {
    const n = roll == null ? Math.random() : roll;
    let p = 0.3 + friendPerk(state, 'sol') * 0.06 - friendPerk(state, 'lulu') * 0.04;
    p = Math.max(0.08, Math.min(0.7, p));
    return n < p ? 'butterfly' : 'coconut';
  }

  function hatId(state) {
    if (state && state.cleared && state.cleared.moonpearl) return 'cap';
    if (state && state.cleared && state.cleared.starfruit) return 'star';
    if (state && state.cleared && state.cleared.coconut) return 'flower';
    return '';
  }

  function catalogCounts() {
    const counts = { common: 0, epic: 0, legendary: 0, extra: 0 };
    TILES.forEach(t => { counts[t.rarity] += 1; });
    return counts;
  }

  return {
    RARITIES: RARITIES,
    RARITY_LABEL: RARITY_LABEL,
    RATES: RATES,
    PARROT_BIAS: PARROT_BIAS,
    PARROTS: PARROTS,
    SEED_KINDS: SEED_KINDS,
    SEED_LABEL: SEED_LABEL,
    TRADE: TRADE,
    CFG: CFG,
    TILES: TILES,
    ALL_TILES: ALL_TILES,
    ISLANDS: ISLANDS,
    byId: byId,
    islandById: islandById,
    activeIsland: activeIsland,
    activeTiles: activeTiles,
    isUnlocked: isUnlocked,
    parrotUnlocked: parrotUnlocked,
    islandDone: islandDone,
    growInterval: growInterval,
    clearedCount: clearedCount,
    switchIsland: switchIsland,
    dateKey: dateKey,
    giftReady: giftReady,
    claimGift: claimGift,
    claimBonus: claimBonus,
    hatId: hatId,
    noteCombo: noteCombo,
    stealSeed: stealSeed,
    recoverSteal: recoverSteal,
    clampWeights: clampWeights,
    weightTotal: weightTotal,
    pickWeighted: pickWeighted,
    ratePercents: ratePercents,
    tilesOf: tilesOf,
    ownedCount: ownedCount,
    hasTile: hasTile,
    duplicateCount: duplicateCount,
    foundCount: foundCount,
    placedCount: placedCount,
    isComplete: isComplete,
    totalSeeds: totalSeeds,
    freshState: freshState,
    applyGrowth: applyGrowth,
    loadState: loadState,
    nextGrowIn: nextGrowIn,
    rollSeed: rollSeed,
    applyOpen: applyOpen,
    feed: feed,
    placeTile: placeTile,
    tryPlace: tryPlace,
    placeAllOwned: placeAllOwned,
    autoPlace: autoPlace,
    friendLevel: friendLevel,
    friendProgress: friendProgress,
    addFriendship: addFriendship,
    friendPerk: friendPerk,
    FRIEND_AT: FRIEND_AT,
    STICKERS: STICKERS,
    checkStickers: checkStickers,
    floatyKind: floatyKind,
    trade: trade,
    collectRipe: collectRipe,
    unplaced: unplaced,
    catalogCounts: catalogCounts,
    copyMap: copyMap
  };
});
