/* Parrot Palm art. Painted parrots and island pictures live in img/ and are cached for offline play. Seeds, the palm, and small critters stay SVG. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.PP_ART = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const LOOK = {
    mango: { body: '#7dce6a', belly: '#f3ffd2', beak: '#ff9a3c', crest: '#ffd23f', cheek: '#ffb3c7', wing: '#4eae62', tail: '#3d9a55' },
    pip: { body: '#ff8fab', belly: '#ffe4ee', beak: '#ff6b6b', crest: '#ffd1dc', cheek: '#ffb3d0', wing: '#ff6f91', tail: '#f25580' },
    nova: { body: '#7c93ff', belly: '#e7ecff', beak: '#ffd23f', crest: '#d5c6ff', cheek: '#c9b6ff', wing: '#5b74f0', tail: '#4458d6' },
    lulu: { body: '#c9a6ff', belly: '#f6e9ff', beak: '#ff8fb8', crest: '#ffe08a', cheek: '#ffd0ea', wing: '#a57cf0', tail: '#8a62d6' },
    sol: { body: '#ffd56a', belly: '#fff6d4', beak: '#ff8a3d', crest: '#fff1a8', cheek: '#ffb3c7', wing: '#f0b429', tail: '#e09a2b' }
  };

  function svg(inner, box, cls) {
    return `<svg class="pp-svg${cls ? ' ' + cls : ''}" viewBox="${box || '0 0 160 160'}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;
  }

  function hat(kind) {
    if (kind === 'flower') {
      return `<g class="hat"><circle cx="96" cy="46" r="7" fill="#ff8fb8"/><circle cx="108" cy="42" r="6" fill="#ffe08a"/><circle cx="118" cy="50" r="6" fill="#fff"/><circle cx="106" cy="48" r="3" fill="#7dce6a"/></g>`;
    }
    if (kind === 'star') {
      return `<g class="hat"><path d="M108 28l4 10 10 1-8 6 3 10-9-6-9 6 3-10-8-6 10-1z" fill="#ffe08a" stroke="#f0b429" stroke-width="1"/></g>`;
    }
    if (kind === 'cap') {
      return `<g class="hat"><path d="M90 52c4-22 36-24 42-2" fill="#6a62c8"/><path d="M128 50c10 2 12 10 2 12" fill="#fff6d4"/><circle cx="108" cy="36" r="4" fill="#fff6d4"/></g>`;
    }
    return '';
  }

  function parrot(id, hatKind, accessory) {
    const who = LOOK[id] ? id : 'mango';
    const cap = hat(hatKind);
    const hatSvg = cap
      ? `<svg class="hat-svg" viewBox="78 18 62 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${cap}</svg>`
      : '';
    const acc = accessory ? `<span class="acc acc-${accessory}" aria-hidden="true"></span>` : '';
    return `<span class="parrot-art bird-${who}">${hatSvg}${acc}<span class="bob"><img src="img/parrot-${who}.webp" alt="" draggable="false"></span></span>`;
  }

  function seed(kind) {
    const shell = kind === 'golden' ? '#ffd56a' : kind === 'lucky' ? '#d7c4ff' : '#c9854a';
    const shine = kind === 'golden' ? '#fff4c4' : kind === 'lucky' ? '#f4ecff' : '#f0c08a';
    const mark = kind === 'golden' ? '★' : kind === 'lucky' ? '✦' : '';
    return svg(`
      <ellipse cx="40" cy="58" rx="18" ry="6" fill="rgba(90,50,20,.15)"/>
      <ellipse cx="40" cy="36" rx="22" ry="26" fill="${shell}"/>
      <ellipse cx="40" cy="34" rx="16" ry="18" fill="${shine}"/>
      <ellipse cx="32" cy="26" rx="6" ry="8" fill="#fff" opacity=".55"/>
      <path d="M40 12c2 6-2 8 0 12" fill="none" stroke="#6fbf73" stroke-width="3" stroke-linecap="round"/>
      ${mark ? `<text x="40" y="40" text-anchor="middle" font-size="16" font-family="ui-rounded,system-ui" fill="#8a5a12">${mark}</text>` : '<path d="M34 40h12M40 34v12" stroke="#a86830" stroke-width="2" stroke-linecap="round"/>'}
    `, '0 0 80 72', 'seed seed-' + (kind || 'plain'));
  }

  function palm(ripe) {
    const spots = [
      ['42%', '31%'],
      ['50%', '27%'],
      ['56%', '32%']
    ];
    const n = Math.max(0, Math.min(spots.length, ripe | 0));
    const nuts = [];
    for (let i = 0; i < n; i++) {
      nuts.push(`<span class="nut" style="left:${spots[i][0]};top:${spots[i][1]}"></span>`);
    }
    return `<span class="palm-art"><img class="palm-img" src="img/palm-tree.webp" alt="" draggable="false"><span class="palm-blink" aria-hidden="true"></span>${nuts.join('')}</span>`;
  }

  function logo() {
    return '<img class="logo-bird" src="img/parrot-mango.webp" alt="">';
  }

  const STROKE = { common: '#efd0a0', epic: '#c4b2ff', legendary: '#ffc14d', extra: '#ff8fb8' };

  function frame(rarity, inner) {
    const stroke = STROKE[rarity] || STROKE.common;
    const extra = rarity === 'extra'
      ? '<rect x="8" y="8" width="144" height="144" rx="20" fill="none" stroke="#ffe08a" stroke-width="3" stroke-dasharray="6 5"/>'
      : '';
    return svg(`
      <rect x="2" y="2" width="156" height="156" rx="26" fill="#fff8ee" stroke="${stroke}" stroke-width="5"/>
      <rect x="14" y="14" width="132" height="132" rx="18" fill="#fffdf8"/>
      ${extra}
      ${inner}
    `);
  }

  const SCENES = {
    sail: `
      <rect x="20" y="28" width="120" height="70" rx="16" fill="#c9ecff"/>
      <circle cx="112" cy="48" r="14" fill="#ffe08a"/>
      <ellipse cx="48" cy="46" rx="18" ry="10" fill="#fff"/>
      <ellipse cx="64" cy="50" rx="14" ry="9" fill="#fff"/>
      <path d="M46 108c10-16 18-16 22 0v22H40z" fill="#fff"/>
      <path d="M68 112h36" stroke="#e7b27a" stroke-width="6" stroke-linecap="round"/>
      <circle cx="108" cy="112" r="7" fill="#ffb3c7"/>`,
    cliff: `
      <rect x="20" y="78" width="120" height="58" rx="14" fill="#f0c48a"/>
      <path d="M30 90c16-28 30-20 40-36 12 18 24 8 36 20v62H30z" fill="#e7b27a"/>
      <ellipse cx="52" cy="70" rx="16" ry="6" fill="#7dce6a" transform="rotate(-16 52 70)"/>
      <rect x="50" y="78" width="4" height="16" rx="2" fill="#c4844a"/>
      <ellipse cx="100" cy="64" rx="18" ry="6" fill="#8ee496" transform="rotate(12 100 64)"/>
      <rect x="98" y="70" width="4" height="18" rx="2" fill="#c4844a"/>
      <circle cx="40" cy="110" r="5" fill="#fff" opacity=".7"/>`,
    fruit: `
      <path d="M80 42l10 22 22 4-16 14 6 22-22-12-22 12 6-22-16-14 22-4z" fill="#ffd56a" stroke="#f0a83a" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="80" cy="78" r="6" fill="#fff6c8"/>
      <ellipse cx="80" cy="40" rx="10" ry="6" fill="#7dce6a"/>`,
    sun: `
      <circle cx="80" cy="78" r="28" fill="#ffd56a"/>
      <circle cx="80" cy="78" r="20" fill="#ffe9a0"/>
      <circle cx="73" cy="74" r="3" fill="#6b4a20"/>
      <circle cx="87" cy="74" r="3" fill="#6b4a20"/>
      <path d="M74 86c4 4 10 4 14 0" fill="none" stroke="#e0903a" stroke-width="2" stroke-linecap="round"/>
      <path d="M80 40v10M80 106v10M46 78h10M104 78h12M58 54l7 7M102 98l7 7M102 54l-7 7M58 98l-7 7" stroke="#ffc14d" stroke-width="4" stroke-linecap="round"/>
      <path d="M48 120c20-16 44-16 64 0" fill="#f0a0b8" opacity=".85"/>`,
    wind: `
      <path d="M36 60c24-8 36 8 60 0" fill="none" stroke="#9fd7ff" stroke-width="6" stroke-linecap="round"/>
      <path d="M30 84c30-6 40 10 74 2" fill="none" stroke="#c9b6ff" stroke-width="6" stroke-linecap="round"/>
      <path d="M42 108c22-8 34 6 58-2" fill="none" stroke="#ffd0e2" stroke-width="6" stroke-linecap="round"/>
      <path d="M108 48c8 6 6 14-2 16 6-2 10 2 8 8" fill="#fff" stroke="#d7e9f5" stroke-width="2"/>
      <circle cx="118" cy="52" r="3" fill="#6b4a20"/>
      <path d="M112 70l10 6-12 2z" fill="#ffd56a"/>`,
    perch: `
      <rect x="28" y="108" width="104" height="8" rx="4" fill="#c4844a"/>
      <circle cx="78" cy="86" r="22" fill="#7dce6a"/>
      <circle cx="92" cy="80" r="12" fill="#7dce6a"/>
      <circle cx="96" cy="78" r="3" fill="#fff"/>
      <circle cx="97" cy="78" r="1.5" fill="#3a2a44"/>
      <path d="M102 82c8 1 8 6 1 7" fill="#ff9a3c"/>
      <ellipse cx="70" cy="92" rx="8" ry="6" fill="#f3ffd2"/>
      <path d="M40 100c10-20 8-28 2-36" fill="none" stroke="#6ecf78" stroke-width="6" stroke-linecap="round"/>
      <circle cx="118" cy="48" r="10" fill="#ffe08a"/>`,
    palms: `
      <rect x="36" y="96" width="6" height="36" rx="3" fill="#c4844a"/>
      <rect x="76" y="88" width="7" height="46" rx="3" fill="#c4844a"/>
      <rect x="112" y="100" width="6" height="32" rx="3" fill="#c4844a"/>
      <ellipse cx="38" cy="90" rx="22" ry="8" fill="#7dce6a" transform="rotate(-20 38 90)"/>
      <ellipse cx="80" cy="78" rx="26" ry="10" fill="#8ee496"/>
      <ellipse cx="116" cy="94" rx="20" ry="8" fill="#63c974" transform="rotate(18 116 94)"/>
      <circle cx="58" cy="118" r="5" fill="#ffb3c7"/>
      <circle cx="98" cy="122" r="4" fill="#ffe08a"/>`,
    falls: `
      <path d="M36 40h28l10 88H46z" fill="#d9f4ff"/>
      <path d="M48 44c8 20 6 40 10 80" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
      <path d="M28 120h104" stroke="#b7e3c0" stroke-width="10" stroke-linecap="round"/>
      <path d="M70 78c16-10 28-6 36 6" fill="none" stroke="#ffb3c7" stroke-width="4"/>
      <path d="M74 84c12-6 22-2 28 6" fill="none" stroke="#ffe08a" stroke-width="3"/>
      <circle cx="112" cy="52" r="8" fill="#ffe08a"/>
      <path d="M30 70c8 16 6 20 0 32" fill="#6ecf78"/>`,
    banana: `
      <path d="M48 100c10-40 40-52 70-30" fill="none" stroke="#ffe08a" stroke-width="14" stroke-linecap="round"/>
      <path d="M56 108c8-34 36-46 64-26" fill="none" stroke="#ffd56a" stroke-width="12" stroke-linecap="round"/>
      <path d="M40 92c6-28 28-40 52-24" fill="none" stroke="#f0c14a" stroke-width="10" stroke-linecap="round"/>
      <ellipse cx="108" cy="64" rx="16" ry="7" fill="#7dce6a" transform="rotate(30 108 64)"/>
      <circle cx="46" cy="118" r="6" fill="#ffb3c7"/>`,
    shells: `
      <path d="M24 108c20-20 90-24 112 0v24H24z" fill="#ffe3b8"/>
      <path d="M48 104c8-16 20-16 24 0" fill="#ffb3c7"/>
      <path d="M52 104c4-8 10-8 12 0" fill="#fff"/>
      <path d="M86 110c6-12 16-10 16 2" fill="#ffd0e2"/>
      <circle cx="112" cy="112" r="8" fill="#fff6ea" stroke="#f0c48a" stroke-width="2"/>
      <circle cx="40" cy="120" r="5" fill="#c9b6ff"/>`,
    path: `
      <path d="M80 28c-8 24 16 32 0 52-14 18 10 28 4 48" fill="none" stroke="#f0c48a" stroke-width="14" stroke-linecap="round"/>
      <circle cx="74" cy="48" r="4" fill="#fff"/>
      <circle cx="86" cy="70" r="4" fill="#fff"/>
      <circle cx="76" cy="96" r="4" fill="#fff"/>
      <circle cx="46" cy="80" r="8" fill="#ff8fb8"/>
      <circle cx="46" cy="80" r="3" fill="#ffe08a"/>
      <ellipse cx="118" cy="64" rx="14" ry="6" fill="#7dce6a"/>
      <rect x="116" y="66" width="3" height="14" fill="#6ecf78"/>`,
    x: `
      <path d="M48 46l64 68" stroke="#ff6f91" stroke-width="14" stroke-linecap="round"/>
      <path d="M112 46L48 114" stroke="#ff6f91" stroke-width="14" stroke-linecap="round"/>
      <path d="M48 46l64 68" stroke="#ffd0e0" stroke-width="4" stroke-linecap="round"/>
      <circle cx="80" cy="80" r="10" fill="#ffe08a" stroke="#fff" stroke-width="3"/>
      <path d="M36 40l4 8M124 36l-2 8M30 96l8 2M128 108l-8-2" stroke="#ffd56a" stroke-width="3" stroke-linecap="round"/>`,
    cave: `
      <path d="M28 124V70c20-28 84-28 104 0v54z" fill="#6b5b86"/>
      <path d="M48 124V86c12-18 40-18 52 0v38z" fill="#2e2444"/>
      <ellipse cx="74" cy="112" rx="10" ry="6" fill="#ffe08a"/>
      <circle cx="96" cy="116" r="5" fill="#ffd56a"/>
      <circle cx="60" cy="118" r="4" fill="#fff1b8"/>
      <path d="M70 96c6 4 12 4 16 0" stroke="#ffe08a" stroke-width="2" fill="none"/>`,
    waves: `
      <path d="M20 70c16 10 24-10 40 0s24-10 40 0 24-10 40 0v62H20z" fill="#b7e7ff"/>
      <path d="M20 96c16 10 24-8 40 0s24-8 40 0 24-8 40 0" fill="none" stroke="#fff" stroke-width="5"/>
      <path d="M20 116c16 8 24-6 40 0s24-6 40 0 24-6 40 0" fill="none" stroke="#8fd3f0" stroke-width="5"/>
      <circle cx="108" cy="108" r="8" fill="#ffb3c7"/>
      <circle cx="48" cy="112" r="5" fill="#ffe08a"/>`,
    dock: `
      <rect x="28" y="96" width="104" height="12" rx="4" fill="#e7b27a"/>
      <rect x="40" y="108" width="8" height="28" rx="2" fill="#c4844a"/>
      <rect x="112" y="108" width="8" height="28" rx="2" fill="#c4844a"/>
      <path d="M56 96c8-20 28-28 48-16 6 4 8 12 4 18H60z" fill="#fff"/>
      <path d="M78 70v26" stroke="#c4844a" stroke-width="3"/>
      <circle cx="46" cy="78" r="8" fill="#9fd7ff"/>
      <path d="M30 120c16 6 80 6 100 0" fill="none" stroke="#b7e7ff" stroke-width="6"/>`,
    compass: `
      <circle cx="80" cy="84" r="40" fill="#fff" stroke="#ffc14d" stroke-width="6"/>
      <circle cx="80" cy="84" r="6" fill="#ff8fb8"/>
      <path d="M80 48l10 28-10 6-10-6z" fill="#ff6f91"/>
      <path d="M80 120l-10-28 10-6 10 6z" fill="#c9b6ff"/>
      <path d="M44 84l28-8 6 8-6 8z" fill="#9fd7ff"/>
      <path d="M116 84l-28 8-6-8 6-8z" fill="#ffe08a"/>
      <circle cx="80" cy="48" r="3" fill="#6b4a20"/>`,
    moon: `
      <rect x="20" y="30" width="120" height="78" rx="18" fill="#d9dcff"/>
      <circle cx="108" cy="62" r="18" fill="#fff8d8"/>
      <circle cx="100" cy="58" r="14" fill="#d9dcff"/>
      <circle cx="46" cy="48" r="2" fill="#fff"/>
      <circle cx="64" cy="40" r="1.6" fill="#fff"/>
      <circle cx="40" cy="66" r="1.4" fill="#fff"/>
      <path d="M28 120c18-16 40-18 104-4v16H28z" fill="#9fd7ff"/>
      <ellipse cx="70" cy="124" rx="26" ry="8" fill="#c9f2ff" opacity=".8"/>`
  };

  const WASH = { coconut: '', starfruit: 'hue-rotate(18deg) saturate(1.25)', moonpearl: 'hue-rotate(200deg) saturate(1.05)' };
  const STAMP = { coconut: '', starfruit: '★', moonpearl: '☾' };

  function mapsApi() {
    const g = typeof globalThis !== 'undefined' ? globalThis : {};
    if (g.PP_MAPS) return g.PP_MAPS;
    if (typeof require === 'function') {
      try { return require('./maps.js'); } catch (e) { return null; }
    }
    return null;
  }

  function sliceOf(tile) {
    const M = mapsApi();
    const cell = (M && M.CELL) || 200;
    const col = tile.col | 0;
    const row = tile.row | 0;
    return { x: col * cell, y: row * cell, size: cell, viewBox: col * cell + ' ' + row * cell + ' ' + cell + ' ' + cell };
  }

  function piecePos(tile) {
    const col = tile.col | 0;
    const row = tile.row | 0;
    const pct = v => (v <= 0 ? '0' : v >= 3 ? '100' : (Math.round(v * 1000 / 3) / 10));
    return pct(col) + '% ' + pct(row) + '%';
  }

  function tile(tileObj, hint) {
    const isle = tileObj.island || 'coconut';
    const pos = piecePos(tileObj);
    const name = tileObj.name || isle;
    return `<span class="map-piece${hint ? ' hint' : ''} island-${isle}" style="background-image:url('img/map-${isle}.webp');background-position:${pos}" role="img" aria-label="${name}"></span>`;
  }

  function mapFull(islandId) {
    return `<img class="map-full" src="img/map-${islandId}.webp" alt="" draggable="false">`;
  }

  function mountMaps() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('island-coconut')) return;
    const M = mapsApi();
    if (!M) return;
    const holder = document.createElement('div');
    holder.id = 'map-sources';
    holder.setAttribute('aria-hidden', 'true');
    const size = M.SIZE;
    const symbols = Object.keys(M.scenes).map(id => {
      return `<g id="island-${id}">${M.scenes[id]}</g>`;
    }).join('');
    holder.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${symbols}</svg>`;
    document.body.appendChild(holder);
  }

  function butterfly() {
    return svg(`
      <ellipse cx="18" cy="28" rx="14" ry="10" fill="#ffe08a" transform="rotate(-20 18 28)"/>
      <ellipse cx="46" cy="28" rx="14" ry="10" fill="#fff6c4" transform="rotate(20 46 28)"/>
      <ellipse cx="18" cy="40" rx="10" ry="8" fill="#ffd56a"/>
      <ellipse cx="46" cy="40" rx="10" ry="8" fill="#ffe9a0"/>
      <rect x="30" y="22" width="4" height="24" rx="2" fill="#c4844a"/>
      <circle cx="32" cy="20" r="3" fill="#3a2a44"/>
    `, '0 0 64 64', 'butterfly');
  }

  function treasure(kind) {
    const chest = kind === 'starfruit' ? '#ffb703' : kind === 'moonpearl' ? '#b9a7ff' : '#e0903a';
    const lid = kind === 'starfruit' ? '#ffe08a' : kind === 'moonpearl' ? '#e7e0ff' : '#ffc14d';
    const jewel = kind === 'moonpearl' ? '#f4f7ff' : '#ff6f91';
    return svg(`
      <ellipse cx="80" cy="132" rx="46" ry="10" fill="rgba(120,70,20,.15)"/>
      <path d="M40 78h80v40c0 10-14 18-40 18s-40-8-40-18z" fill="${chest}"/>
      <path d="M40 78c0-16 16-26 40-26s40 10 40 26" fill="${lid}"/>
      <path d="M46 78c0-12 14-18 34-18s34 6 34 18" fill="#ffe08a"/>
      <rect x="72" y="74" width="16" height="22" rx="3" fill="#ffd56a" stroke="#c4844a" stroke-width="2"/>
      <circle cx="80" cy="86" r="3" fill="${jewel}"/>
      <path d="M70 70l10-16 10 16" fill="#fff6ea"/>
      <path d="M62 108c6-8 10-8 14 0 4-10 10-10 16 0 6-8 12-6 14 2" fill="#ff6f91"/>
      <circle cx="36" cy="64" r="4" fill="#fff"/>
      <circle cx="124" cy="58" r="3" fill="#fff6ea"/>
      <circle cx="108" cy="46" r="3" fill="#ffe08a"/>
    `, '0 0 160 150', 'treasure');
  }

  function silhouette() {
    return svg(`
      <rect x="2" y="2" width="156" height="156" rx="26" fill="#f6efe6" stroke="#ead9c4" stroke-width="5" stroke-dasharray="8 7"/>
      <circle cx="80" cy="74" r="22" fill="#efe2d2"/>
      <text x="80" y="84" text-anchor="middle" font-size="32" font-family="ui-rounded,system-ui" font-weight="800" fill="#c4ad96">?</text>
    `);
  }

  return {
    LOOK: LOOK,
    parrot: parrot,
    seed: seed,
    palm: palm,
    logo: logo,
    tile: tile,
    sliceOf: sliceOf,
    mapFull: mapFull,
    mountMaps: mountMaps,
    butterfly: butterfly,
    hat: hat,
    treasure: treasure,
    silhouette: silhouette,
    scenes: Object.keys(SCENES)
  };
});
