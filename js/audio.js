/* Tiny WebAudio chirps. Nothing is fetched; silence is fine if audio is blocked. */
(function (root) {
  'use strict';
  let ctx = null, master = null, muted = false, calm = false;

  function ensure() {
    if (muted) return null;
    const AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = calm ? 0.12 : 0.22;
      master.connect(ctx.destination);
    } else {
      master.gain.value = calm ? 0.12 : 0.22;
      if (ctx.state === 'suspended') ctx.resume();
    }
    return ctx;
  }

  function tone(freq, start, dur, type, vol, slide) {
    if (!ensure()) return;
    const t0 = ctx.currentTime + (start || 0);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  const N = n => 440 * Math.pow(2, (n - 69) / 12);

  const SFX = {
    tap: () => { tone(N(79), 0, 0.06, 'sine', 0.2); },
    crack: () => {
      tone(N(72), 0, 0.08, 'triangle', 0.3, N(64));
      tone(N(88), 0.08, 0.1, 'sine', 0.25, N(96));
    },
    common: () => { [76, 79, 84].forEach((n, i) => tone(N(n), i * 0.07, 0.16, 'triangle', 0.22)); },
    epic: () => { [79, 84, 88, 91].forEach((n, i) => tone(N(n), i * 0.07, 0.18, 'triangle', 0.24)); },
    legendary: () => {
      [67, 72, 76, 79, 84, 91, 96].forEach((n, i) => tone(N(n), i * 0.09, 0.28, 'triangle', 0.24));
      tone(N(103), 0.62, 0.35, 'sine', 0.16);
    },
    extra: () => {
      [72, 76, 79, 84, 88, 91, 96, 103].forEach((n, i) => tone(N(n), i * 0.08, 0.3, 'sine', 0.2));
      tone(N(108), 0.7, 0.4, 'triangle', 0.12);
    },
    place: () => { tone(N(84), 0, 0.08, 'sine', 0.25, N(96)); tone(N(103), 0.08, 0.12, 'triangle', 0.16); },
    snap: () => {
      tone(N(91), 0, 0.05, 'triangle', 0.28, N(103));
      tone(N(108), 0.05, 0.12, 'sine', 0.2);
      tone(N(115), 0.12, 0.14, 'sine', 0.1);
    },
    complete: () => { [72, 76, 79, 84, 88, 91, 96].forEach((n, i) => tone(N(n), i * 0.09, 0.28, 'triangle', 0.24)); },
    trade: () => { tone(N(76), 0, 0.08, 'sine', 0.2, N(84)); tone(N(88), 0.1, 0.1, 'sine', 0.16); },
    collect: () => { [84, 88, 91].forEach((n, i) => tone(N(n), i * 0.05, 0.1, 'sine', 0.2)); },
    pop: () => { tone(N(86), 0, 0.09, 'sine', 0.2, N(98)); },
    no: () => { tone(N(62), 0, 0.12, 'triangle', 0.12, N(55)); },
    chirp: () => { tone(N(88), 0, 0.07, 'sine', 0.22, N(96)); tone(N(100), 0.08, 0.1, 'sine', 0.16); },
    'chirp-mango': () => { tone(N(84), 0, 0.08, 'sine', 0.22, N(91)); tone(N(96), 0.09, 0.1, 'triangle', 0.16); },
    'chirp-pip': () => { tone(N(91), 0, 0.07, 'sine', 0.2, N(98)); tone(N(103), 0.08, 0.12, 'sine', 0.16); },
    'chirp-nova': () => { tone(N(76), 0, 0.12, 'sine', 0.16, N(84)); tone(N(91), 0.12, 0.16, 'triangle', 0.12); },
    'chirp-lulu': () => { tone(N(88), 0, 0.06, 'sine', 0.18, N(95)); tone(N(100), 0.07, 0.08, 'sine', 0.16); tone(N(103), 0.14, 0.1, 'triangle', 0.12); },
    'chirp-sol': () => { tone(N(79), 0, 0.1, 'triangle', 0.18, N(86)); tone(N(91), 0.1, 0.14, 'sine', 0.16); },
    gift: () => { [76, 81, 84, 88, 93].forEach((n, i) => tone(N(n), i * 0.06, 0.16, 'triangle', 0.2)); },
    butterfly: () => { [91, 96, 100, 103].forEach((n, i) => tone(N(n), i * 0.05, 0.14, 'sine', 0.16)); }
  };

  let musicOn = false, musicTimer = null, musicStep = 0;
  const PHRASE = [0, 4, 7, 9, 7, 4, 2, 4, 0, 7, 4, 2];
  function stopMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  }
  function musicTick() {
    if (!musicOn || muted) return;
    const n = (calm ? 67 : 72) + PHRASE[musicStep % PHRASE.length];
    tone(N(n), 0, 0.42, 'sine', calm ? 0.045 : 0.08);
    if (musicStep % 4 === 0) tone(N(48), 0, 0.5, 'triangle', 0.035);
    musicStep++;
  }
  function setMusic(on) {
    const want = !!on && !muted;
    if (want === musicOn && (!!musicTimer) === want) return;
    musicOn = want;
    stopMusic();
    if (musicOn) {
      ensure();
      musicTimer = setInterval(musicTick, 520);
    }
  }

  root.PP_AUDIO = {
    setMuted: v => { muted = !!v; if (muted) stopMusic(); else if (musicOn) setMusic(true); },
    setCalm: v => { calm = !!v; },
    setMusic: setMusic,
    play: name => {
      try {
        const fn = SFX[name] || (name && String(name).indexOf('chirp') === 0 ? SFX.chirp : null);
        if (fn) fn();
      } catch (e) { /* ignore */ }
    }
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
