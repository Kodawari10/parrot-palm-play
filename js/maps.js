/* One painted picture per island. Tiles are 200×200 slices of an 800×800 scene. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.PP_MAPS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SIZE = 800;
  const CELL = 200;

  const coconut = `
    <defs>
      <linearGradient id="c-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#c8f4ff"/>
        <stop offset=".55" stop-color="#ffe6f4"/>
        <stop offset="1" stop-color="#ffe0b8"/>
      </linearGradient>
      <linearGradient id="c-sea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#8fd8f5"/>
        <stop offset="1" stop-color="#5eb4e0"/>
      </linearGradient>
    </defs>
    <rect width="800" height="800" fill="url(#c-sky)"/>
    <ellipse cx="400" cy="560" rx="460" ry="210" fill="url(#c-sea)"/>
    <ellipse cx="400" cy="500" rx="340" ry="168" fill="#ffe0b0"/>
    <ellipse cx="400" cy="530" rx="300" ry="36" fill="rgba(90,50,20,.13)"/>
    <ellipse cx="400" cy="470" rx="250" ry="120" fill="#b7e89a"/>
    <ellipse cx="360" cy="430" rx="90" ry="28" fill="#d8f5b8" opacity=".7"/>
    <ellipse cx="470" cy="450" rx="70" ry="22" fill="#8ed67a" opacity=".55"/>
    <ellipse cx="250" cy="430" rx="90" ry="50" fill="#d8f5b0"/>
    <circle cx="520" cy="92" r="46" fill="#ffe38a"/>
    <circle cx="520" cy="92" r="32" fill="#fff6c4"/>
    <circle cx="508" cy="84" r="4" fill="#6b4a2a"/>
    <circle cx="532" cy="84" r="4" fill="#6b4a2a"/>
    <path d="M508 102c8 6 18 6 26 0" fill="none" stroke="#e0903a" stroke-width="3" stroke-linecap="round"/>
    <g stroke="#ffd56a" stroke-width="4" stroke-linecap="round">
      <path d="M520 28v16M520 140v16M456 92h16M568 92h16M474 46l12 12M554 126l12 12M554 46l-12 12M474 126l-12 12"/>
    </g>
    <g fill="#fff">
      <ellipse cx="70" cy="58" rx="36" ry="16"/>
      <ellipse cx="98" cy="50" rx="22" ry="14"/>
      <ellipse cx="150" cy="96" rx="40" ry="16"/>
      <ellipse cx="184" cy="88" rx="20" ry="12"/>
      <ellipse cx="640" cy="48" rx="28" ry="12"/>
    </g>
    <path d="M40 70c30-8 50 6 80 0" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
    <path d="M620 70c-8 10 6 16 0 26" fill="none" stroke="#9fd7ff" stroke-width="4" stroke-linecap="round"/>
    <path d="M668 86l14 6-16 2z" fill="#fff"/>
    <circle cx="676" cy="84" r="2.4" fill="#4a3a55"/>
    <path d="M210 150c30-40 70-30 90-70 20 36 60 20 80 10v90z" fill="#e7b27a"/>
    <ellipse cx="250" cy="168" rx="28" ry="10" fill="#7dce6a" transform="rotate(-18 250 168)"/>
    <rect x="246" y="168" width="6" height="22" rx="2" fill="#c4844a"/>
    <ellipse cx="300" cy="150" rx="26" ry="9" fill="#8ee496" transform="rotate(14 300 150)"/>
    <rect x="298" y="150" width="5" height="20" rx="2" fill="#c4844a"/>
    <path d="M70 250c20-30 10-50-8-70" fill="none" stroke="#6ecf78" stroke-width="8" stroke-linecap="round"/>
    <rect x="78" y="268" width="70" height="8" rx="4" fill="#c4844a"/>
    <circle cx="118" cy="248" r="22" fill="#7dce6a"/>
    <circle cx="136" cy="240" r="12" fill="#7dce6a"/>
    <circle cx="140" cy="236" r="3.2" fill="#fff"/>
    <circle cx="141" cy="236" r="1.5" fill="#3a2a44"/>
    <path d="M146 242c8 1 8 5 1 6" fill="#ff9a3c"/>
    <ellipse cx="108" cy="254" rx="8" ry="6" fill="#f3ffd2"/>
    <rect x="230" y="250" width="7" height="46" rx="3" fill="#c4844a"/>
    <rect x="268" y="236" width="8" height="62" rx="3" fill="#c4844a"/>
    <rect x="304" y="258" width="6" height="40" rx="3" fill="#c4844a"/>
    <ellipse cx="232" cy="242" rx="26" ry="10" fill="#7dce6a" transform="rotate(-20 232 242)"/>
    <ellipse cx="274" cy="220" rx="32" ry="12" fill="#8ee496"/>
    <ellipse cx="310" cy="248" rx="22" ry="9" fill="#63c974" transform="rotate(16 310 248)"/>
    <circle cx="250" cy="300" r="6" fill="#ffb3c7"/>
    <circle cx="292" cy="308" r="5" fill="#ffe08a"/>
    <path d="M390 200c8 40 4 80 18 130" fill="none" stroke="#bfefff" stroke-width="18" stroke-linecap="round"/>
    <path d="M398 210c6 36 2 70 12 110" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
    <path d="M360 250c22-12 40-6 48 10" fill="none" stroke="#ffb3c7" stroke-width="5" stroke-linecap="round"/>
    <path d="M366 262c16-6 28 0 34 10" fill="none" stroke="#ffe08a" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="620" cy="250" rx="16" ry="8" fill="#7dce6a" transform="rotate(30 620 250)"/>
    <path d="M560 290c16-36 48-40 70-18" fill="none" stroke="#ffe08a" stroke-width="12" stroke-linecap="round"/>
    <path d="M548 304c14-30 40-36 62-16" fill="none" stroke="#ffd56a" stroke-width="10" stroke-linecap="round"/>
    <path d="M24 470c40-30 90-20 120 10v40H20z" fill="#ffe7c4"/>
    <path d="M48 468c10-16 24-16 30 2" fill="#ffb3c7"/>
    <path d="M90 478c8-14 20-12 20 2" fill="#fff"/>
    <circle cx="70" cy="500" r="7" fill="#c9b6ff"/>
    <path d="M210 360c-10 40 20 70 10 120" fill="none" stroke="#f0c48a" stroke-width="16" stroke-linecap="round"/>
    <circle cx="214" cy="400" r="5" fill="#fff"/>
    <circle cx="230" cy="440" r="5" fill="#fff"/>
    <circle cx="206" cy="470" r="5" fill="#fff"/>
    <circle cx="250" cy="420" r="9" fill="#ff8fb8"/>
    <circle cx="250" cy="420" r="3" fill="#ffe08a"/>
    <path d="M392 360l56 64" stroke="#ff6f91" stroke-width="14" stroke-linecap="round"/>
    <path d="M448 360l-56 64" stroke="#ff6f91" stroke-width="14" stroke-linecap="round"/>
    <circle cx="420" cy="392" r="16" fill="#ffe08a" stroke="#fff" stroke-width="3"/>
    <path d="M408 392c6 8 18 8 24 0" fill="none" stroke="#ff6f91" stroke-width="3" stroke-linecap="round"/>
    <path d="M560 360c10-20 70-24 90 8v80c-30 10-70 6-90-8z" fill="#6b5b86"/>
    <path d="M590 390c8-16 40-16 48 4v50H588z" fill="#2e2444"/>
    <ellipse cx="612" cy="456" rx="12" ry="7" fill="#ffe08a"/>
    <circle cx="646" cy="462" r="6" fill="#ffd56a"/>
    <path d="M0 560c40 16 80-10 120 0s80-12 120 4 80-8 120 6 90-10 140 4 100-6 160 8 80 4 140-6v80H0z" fill="#7ec8ea"/>
    <path d="M20 600c30 10 50-8 80 0s50-8 80 2" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
    <circle cx="70" cy="640" r="10" fill="#ffb3c7"/>
    <circle cx="120" cy="660" r="6" fill="#ffe08a"/>
    <rect x="220" y="548" width="120" height="14" rx="4" fill="#e7b27a"/>
    <rect x="236" y="562" width="10" height="36" rx="2" fill="#c4844a"/>
    <rect x="314" y="562" width="10" height="36" rx="2" fill="#c4844a"/>
    <path d="M250 548c8-22 36-28 52-12 6 6 6 14 2 18h-58z" fill="#fff"/>
    <path d="M274 520v28" stroke="#c4844a" stroke-width="3"/>
    <circle cx="430" cy="620" r="36" fill="#fff" stroke="#ffc14d" stroke-width="6"/>
    <path d="M430 590l8 22-8 5-8-5z" fill="#ff6f91"/>
    <path d="M430 650l-8-18 8-4 8 4z" fill="#c9b6ff"/>
    <circle cx="430" cy="620" r="5" fill="#ff8fb8"/>
    <path d="M560 600c20-24 70-20 90 6 8 10 4 28-10 36-30 10-70 4-90-8-6-8-4-22 10-34z" fill="#9fd7ff"/>
    <circle cx="640" cy="590" r="16" fill="#fff8d8"/>
    <circle cx="632" cy="586" r="12" fill="#7ec8ea"/>
    <ellipse cx="600" cy="640" rx="28" ry="8" fill="#e7f7ff"/>
  `;

  const starfruit = `
    <defs>
      <linearGradient id="s-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffd0a8"/>
        <stop offset=".5" stop-color="#ffc1d8"/>
        <stop offset="1" stop-color="#ffe7a8"/>
      </linearGradient>
    </defs>
    <rect width="800" height="800" fill="url(#s-sky)"/>
    <circle cx="140" cy="70" r="28" fill="#fff1c4"/>
    <ellipse cx="70" cy="120" rx="40" ry="14" fill="#fff" opacity=".8"/>
    <path d="M200 40c40-16 70 8 110-4" fill="none" stroke="#fff6e0" stroke-width="8" stroke-linecap="round"/>
    <ellipse cx="400" cy="540" rx="470" ry="200" fill="#ffb7c8"/>
    <ellipse cx="400" cy="500" rx="330" ry="160" fill="#ffe3a4"/>
    <ellipse cx="400" cy="545" rx="280" ry="30" fill="rgba(160,60,40,.12)"/>
    <ellipse cx="390" cy="460" rx="240" ry="110" fill="#c6ef9a"/>
    <ellipse cx="340" cy="430" rx="80" ry="24" fill="#e7f8b0" opacity=".75"/>
    <circle cx="500" cy="100" r="18" fill="#ffd56a"/>
    <path d="M500 70l6 16 16 2-12 10 4 16-14-8-14 8 4-16-12-10 16-2z" fill="#ffe08a" stroke="#f0a040" stroke-width="2"/>
    <path d="M230 140c40-50 90-30 110-80 24 46 70 20 96 8v110z" fill="#f0b06a"/>
    <ellipse cx="280" cy="150" rx="30" ry="10" fill="#8ed67a" transform="rotate(-16 280 150)"/>
    <rect x="276" y="150" width="6" height="24" rx="2" fill="#c4844a"/>
    <path d="M600 80c24-6 40 8 64 0" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
    <path d="M640 110c18-4 30 6 48 0" fill="none" stroke="#ffe0b0" stroke-width="5" stroke-linecap="round"/>
    <circle cx="700" cy="70" r="8" fill="#fff"/>
    <path d="M688 86l10 8-12 1z" fill="#ffe08a"/>
    <rect x="70" y="270" width="8" height="50" rx="3" fill="#c4844a"/>
    <ellipse cx="74" cy="258" rx="28" ry="12" fill="#7dce6a"/>
    <path d="M118 250l10 22 22 4-16 12 6 20-22-12-22 12 6-20-16-12 22-4z" fill="#ffd56a" stroke="#e09a30" stroke-width="2"/>
    <circle cx="128" cy="286" r="4" fill="#fff6c2"/>
    <rect x="230" y="250" width="7" height="55" rx="3" fill="#c4844a"/>
    <rect x="280" y="230" width="8" height="74" rx="3" fill="#c4844a"/>
    <rect x="320" y="258" width="6" height="44" rx="3" fill="#c4844a"/>
    <ellipse cx="234" cy="238" rx="26" ry="10" fill="#9be08a"/>
    <ellipse cx="286" cy="214" rx="34" ry="12" fill="#b6f0a0"/>
    <path d="M250 300l8 16 16 2-12 10 4 16-16-10-16 10 4-16-12-10 16-2z" fill="#ffe08a"/>
    <path d="M400 190c10 50 6 100 20 150" fill="none" stroke="#ffe08a" stroke-width="20" stroke-linecap="round"/>
    <path d="M408 200c6 40 2 80 12 130" fill="none" stroke="#fff6c8" stroke-width="6"/>
    <circle cx="430" cy="250" r="6" fill="#fff"/>
    <path d="M560 250c20-40 60-36 78-8" fill="none" stroke="#ffd56a" stroke-width="14" stroke-linecap="round"/>
    <path d="M548 270c18-32 50-30 66-6" fill="none" stroke="#ffe08a" stroke-width="12" stroke-linecap="round"/>
    <ellipse cx="640" cy="240" rx="18" ry="8" fill="#7dce6a" transform="rotate(24 640 240)"/>
    <path d="M30 470c50-36 110-16 140 16v36H24z" fill="#ffe7c2"/>
    <path d="M60 468c12-18 28-16 34 4" fill="#ffb3c7"/>
    <path d="M110 480l6 12 12 2-8 8 3 12-13-8-13 8 3-12-8-8 12-2z" fill="#ffe08a"/>
    <path d="M210 360c-8 50 24 80 8 130" fill="none" stroke="#f0c48a" stroke-width="16" stroke-linecap="round"/>
    <circle cx="214" cy="410" r="5" fill="#fff6d8"/>
    <circle cx="228" cy="450" r="5" fill="#fff6d8"/>
    <circle cx="250" cy="430" r="10" fill="#ff8fb8"/>
    <path d="M400 360l8 18 18 3-14 12 5 18-17-10-17 10 5-18-14-12 18-3z" fill="#ffd56a" stroke="#fff" stroke-width="3"/>
    <circle cx="408" cy="392" r="6" fill="#fff6c4"/>
    <path d="M560 350c16-24 80-28 100 10v90c-36 12-80 6-100-12z" fill="#c4844a"/>
    <path d="M590 390c10-18 46-16 54 6v54H588z" fill="#8a5a32"/>
    <ellipse cx="620" cy="460" rx="14" ry="8" fill="#ffe08a"/>
    <circle cx="656" cy="468" r="7" fill="#ffd56a"/>
    <path d="M0 560c50 18 90-12 140 2s90-14 140 6 90-8 150 8 100-12 160 6 90 2 150-8v90H0z" fill="#ff9eb8"/>
    <path d="M30 620c36 12 60-10 96 0" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
    <circle cx="80" cy="660" r="8" fill="#ffe08a"/>
    <rect x="210" y="548" width="130" height="16" rx="4" fill="#e7b27a"/>
    <rect x="228" y="564" width="10" height="34" rx="2" fill="#c4844a"/>
    <rect x="312" y="564" width="10" height="34" rx="2" fill="#c4844a"/>
    <path d="M248 530l8 16 16 2-12 10 4 14-16-8-16 8 4-14-12-10 16-2z" fill="#ffd56a"/>
    <path d="M300 536l6 12 12 2-10 8 3 12-11-7-11 7 3-12-10-8 12-2z" fill="#ffe08a"/>
    <circle cx="430" cy="620" r="34" fill="#fff8e4" stroke="#ffb703" stroke-width="6"/>
    <path d="M430 594l6 16 16 2-12 10 4 16-14-8-14 8 4-16-12-10 16-2z" fill="#ff8fb8"/>
    <circle cx="620" cy="600" r="8" fill="#ffe08a"/>
    <circle cx="660" cy="640" r="5" fill="#fff6c4"/>
    <circle cx="590" cy="660" r="6" fill="#fff"/>
    <path d="M600 700c30-20 80-16 100 8" fill="none" stroke="#ffe7a0" stroke-width="8" stroke-linecap="round" opacity=".8"/>
  `;

  const moonpearl = `
    <defs>
      <linearGradient id="m-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1d2458"/>
        <stop offset=".45" stop-color="#3a3e86"/>
        <stop offset="1" stop-color="#7aa0d8"/>
      </linearGradient>
    </defs>
    <rect width="800" height="800" fill="url(#m-sky)"/>
    <g fill="#fff">
      <circle cx="40" cy="40" r="2"/><circle cx="90" cy="80" r="1.6"/><circle cx="150" cy="36" r="2.2"/>
      <circle cx="220" cy="70" r="1.5"/><circle cx="300" cy="30" r="2"/><circle cx="360" cy="84" r="1.4"/>
      <circle cx="640" cy="50" r="1.8"/><circle cx="700" cy="90" r="1.4"/><circle cx="760" cy="40" r="2"/>
    </g>
    <circle cx="120" cy="90" r="36" fill="#fff6d4"/>
    <circle cx="108" cy="82" r="28" fill="#2a3270"/>
    <ellipse cx="400" cy="560" rx="470" ry="200" fill="#243e78"/>
    <ellipse cx="400" cy="520" rx="320" ry="150" fill="#c9c2ef"/>
    <ellipse cx="400" cy="555" rx="260" ry="28" fill="rgba(10,10,40,.28)"/>
    <ellipse cx="390" cy="480" rx="230" ry="100" fill="#6d7ec4"/>
    <ellipse cx="450" cy="460" rx="70" ry="20" fill="#9aa8e8" opacity=".55"/>
    <path d="M230 150c36-46 84-28 104-74 22 42 66 18 90 6v100z" fill="#8d7cbc"/>
    <ellipse cx="280" cy="160" rx="26" ry="9" fill="#b7c4ff"/>
    <rect x="276" y="160" width="5" height="20" rx="2" fill="#6a5a90"/>
    <path d="M620 70c20-6 36 6 56 0" fill="none" stroke="#d5dcff" stroke-width="5" stroke-linecap="round"/>
    <path d="M680 100l12 6-14 1z" fill="#e7e9ff"/>
    <circle cx="500" cy="110" r="26" fill="#f4f1ff" opacity=".35"/>
    <rect x="78" y="268" width="8" height="46" rx="3" fill="#6a5a90"/>
    <ellipse cx="82" cy="256" rx="24" ry="10" fill="#9aa8e8"/>
    <circle cx="130" cy="250" r="16" fill="#7dce6a"/>
    <circle cx="146" cy="242" r="9" fill="#7dce6a"/>
    <circle cx="150" cy="240" r="2.4" fill="#fff"/>
    <path d="M154 246c6 1 6 4 1 5" fill="#ffd56a"/>
    <rect x="236" y="250" width="6" height="50" rx="3" fill="#6a5a90"/>
    <rect x="280" y="232" width="7" height="68" rx="3" fill="#7a6aa0"/>
    <ellipse cx="240" cy="240" rx="24" ry="9" fill="#b7c6ff"/>
    <ellipse cx="286" cy="216" rx="30" ry="11" fill="#d5dcff"/>
    <path d="M400 200c8 46 4 96 16 150" fill="none" stroke="#d5e6ff" stroke-width="18" stroke-linecap="round"/>
    <path d="M408 210c5 40 2 80 10 120" fill="none" stroke="#fff" stroke-width="4" opacity=".7"/>
    <path d="M560 250c18-28 50-24 64-4" fill="none" stroke="#9fd0c0" stroke-width="10" stroke-linecap="round"/>
    <path d="M548 268c14-22 40-20 52-2" fill="none" stroke="#c6ead8" stroke-width="8" stroke-linecap="round"/>
    <path d="M20 470c48-30 100-10 130 18v40H16z" fill="#d9d4f4"/>
    <path d="M56 468c10-16 26-14 30 4" fill="#f4f1ff"/>
    <circle cx="100" cy="492" r="8" fill="#fff6d4" opacity=".9"/>
    <circle cx="130" cy="510" r="5" fill="#fff"/>
    <path d="M210 360c-8 48 22 78 6 128" fill="none" stroke="#c9b6ff" stroke-width="14" stroke-linecap="round"/>
    <circle cx="214" cy="410" r="4" fill="#fff"/>
    <circle cx="230" cy="452" r="4" fill="#fff6d4"/>
    <circle cx="400" cy="400" r="28" fill="#f7f4ff" stroke="#e7e0ff" stroke-width="4"/>
    <circle cx="400" cy="400" r="16" fill="#fff"/>
    <circle cx="394" cy="394" r="6" fill="#f4f7ff" opacity=".8"/>
    <path d="M560 350c14-20 74-22 92 8v86c-32 10-74 4-92-10z" fill="#2a2450"/>
    <path d="M588 386c8-16 42-14 50 4v52H586z" fill="#120e28"/>
    <ellipse cx="618" cy="456" rx="12" ry="7" fill="#d5dcff"/>
    <circle cx="652" cy="464" r="5" fill="#fff6d4"/>
    <path d="M0 560c46 16 88-12 136 2s88-12 136 6 90-8 146 8 100-10 156 6 90 0 146-6v90H0z" fill="#1c3c72"/>
    <path d="M24 620c34 10 54-8 88 0" fill="none" stroke="#d5e6ff" stroke-width="5" stroke-linecap="round"/>
    <circle cx="70" cy="650" r="3" fill="#fff"/>
    <circle cx="120" cy="670" r="2" fill="#fff6d4"/>
    <rect x="214" y="552" width="124" height="12" rx="4" fill="#8d7cbc"/>
    <rect x="230" y="564" width="8" height="30" rx="2" fill="#5c4e86"/>
    <rect x="312" y="564" width="8" height="30" rx="2" fill="#5c4e86"/>
    <path d="M250 552c6-16 28-18 36-4v16h-42z" fill="#e7e4ff"/>
    <circle cx="430" cy="624" r="32" fill="#1a2458" stroke="#d5dcff" stroke-width="5"/>
    <path d="M430 600l7 16 16 2-12 10 4 16-15-9-15 9 4-16-12-10 16-2z" fill="#fff6d4"/>
    <circle cx="620" cy="600" r="18" fill="#fff6d4" opacity=".85"/>
    <ellipse cx="640" cy="650" rx="36" ry="12" fill="#9fd7ff" opacity=".55"/>
    <circle cx="590" cy="640" r="3" fill="#fff"/>
    <circle cx="670" cy="630" r="2.2" fill="#fff6d4"/>
  `;

  return {
    SIZE: SIZE,
    CELL: CELL,
    scenes: { coconut: coconut, starfruit: starfruit, moonpearl: moonpearl }
  };
});
