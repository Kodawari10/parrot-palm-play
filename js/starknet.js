/* Optional Starknet keepsakes. Legendary tiles, the extra tile, and the finished chart can be minted.
 * Cartridge (StarkZap) or a browser wallet (Ready, Braavos via get-starknet). Both bundles are local.
 * With no wallet, this file never touches the network and the game is unchanged. */
(function () {
  'use strict';
  const C = Object.assign({}, window.PP_STARKNET_CONFIG || {});
  if (!C.enabled || !window.PP_SELECTORS) return;
  const SEL = window.PP_SELECTORS;
  const KEY = 'parrot-palm-chain-v1';
  const $ = s => document.querySelector(s);
  let G = null;
  let wallet = null, address = null, chainOk = true, busy = false, walletKind = null;
  let feeMode = (C.cartridge && C.cartridge.feeMode) || { type: 'paymaster' };
  let feeFallbackUsed = false;
  let cs = loadCs();
  const mintedTiles = new Set((cs.tiles || []).map(Number));
  let mintedChart = !!cs.chart;
  const configured = /^0x[0-9a-fA-F]{1,64}$/.test(C.contractAddress || '');
  const cartridgeOn = !!(C.cartridge && C.cartridge.enabled !== false);

  function loadCs() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function saveCs() {
    cs.tiles = [...mintedTiles];
    cs.chart = mintedChart;
    try { localStorage.setItem(KEY, JSON.stringify(cs)); } catch (e) { /* ignore */ }
    push();
  }
  function push() {
    try { if (G && G.setChain) G.setChain({ tiles: address ? [...mintedTiles] : [], chart: address ? mintedChart : false }); } catch (e) { /* ignore */ }
  }
  const short = a => a ? a.slice(0, 6) + '…' + a.slice(-4) : '';
  const hex = n => '0x' + BigInt(n).toString(16);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function displayWalletName(w) {
    const id = String((w && w.id) || '').toLowerCase();
    const name = String((w && w.name) || '');
    if (/argent|ready/i.test(id) || /argent/i.test(name)) return 'Ready';
    return name || (w && w.id) || 'Wallet';
  }

  let gsnP = null, szP = null;
  function loadScript(src, ready) {
    return new Promise((res, rej) => {
      if (ready()) return res();
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => ready() ? res() : rej(new Error('library failed'));
      s.onerror = () => rej(new Error('library failed'));
      document.head.appendChild(s);
    });
  }
  function loadGsn() {
    if (!gsnP) gsnP = loadScript('js/vendor/get-starknet-core.js', () => window.PP_GSN || window.EF_GSN).then(() => window.PP_GSN || window.EF_GSN);
    return gsnP;
  }
  function loadStarkzap() {
    if (!szP) szP = loadScript('js/vendor/starkzap.js', () => (window.PP_STARKZAP || window.EF_STARKZAP) && (window.PP_STARKZAP || window.EF_STARKZAP).connect).then(() => window.PP_STARKZAP || window.EF_STARKZAP);
    return szP;
  }
  function walletWindow() {
    const o = {};
    Object.getOwnPropertyNames(window).forEach(k => { if (k.startsWith('starknet')) o[k] = window[k]; });
    return o;
  }
  async function gsn() { const lib = await loadGsn(); return lib.getStarknet({ windowObject: walletWindow() }); }
  function iconSrc(w) { const i = w && w.icon; if (!i) return ''; if (typeof i === 'string') return i; return i.light || i.dark || ''; }
  function policies() {
    if (!configured) return [];
    const methods = (C.cartridge && C.cartridge.methods) || ['mint_tile', 'mint_chart'];
    return methods.map(method => ({ target: C.contractAddress, method }));
  }

  const ERR = {
    USER_CANCELLED: 'Cancelled, no worries ♡',
    POPUP_BLOCKED: 'Allow popups for this site, then try Cartridge again.',
    INSUFFICIENT_FUNDS: 'Your wallet needs a little test STRK for the fee.',
    CHAIN_MISMATCH: 'Switch the wallet to ' + (C.networkName || 'the configured network') + '.',
    SPONSORSHIP_UNAVAILABLE: 'Free minting isn’t available right now.',
    UNKNOWN: 'Something went wrong'
  };
  function classify(err) {
    const m = err && err.message ? err.message : String(err || '');
    if (/reject|cancel|denied by user|user (closed|dismissed)/i.test(m)) return 'USER_CANCELLED';
    if (/popup/i.test(m)) return 'POPUP_BLOCKED';
    if (/insufficient|not enough/i.test(m)) return 'INSUFFICIENT_FUNDS';
    if (/chain.?id|wrong network/i.test(m)) return 'CHAIN_MISMATCH';
    if (/paymaster|sponsor|SNIP-9/i.test(m)) return 'SPONSORSHIP_UNAVAILABLE';
    return 'UNKNOWN';
  }
  function friendly(err) {
    const code = classify(err);
    return ERR[code] || ERR.UNKNOWN;
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  async function rpc(method, params) {
    const r = await fetch(C.rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params })
    });
    const j = await r.json();
    if (j.error) throw new Error(j.error.message || 'RPC error');
    return j.result;
  }
  const call = (fn, calldata) => rpc('starknet_call', {
    request: { contract_address: C.contractAddress, entry_point_selector: SEL[fn], calldata: calldata || [] },
    block_id: 'latest'
  });
  async function waitTx(hash) {
    for (let i = 0; i < 40; i++) {
      try {
        const r = await rpc('starknet_getTransactionReceipt', { transaction_hash: hash });
        if (r && r.execution_status === 'REVERTED') throw new Error('Transaction reverted');
        if (r && r.execution_status === 'SUCCEEDED') return r;
      } catch (e) { if (/reverted/.test(e.message)) throw e; }
      await sleep(i < 4 ? 1500 : 3000);
    }
    throw new Error('Timed out waiting for the transaction');
  }
  function normalize(a) { return '0x' + BigInt(a).toString(16).padStart(64, '0'); }

  function openPicker() { G.ui.openModal('wallets'); renderPicker(); }
  async function renderPicker() {
    const box = $('#walletList');
    $('#walletsNet').textContent = C.networkName || C.network || '';
    box.innerHTML = '<p class="muted">Looking for wallets…</p>';
    let list = [];
    try { list = await (await gsn()).getAvailableWallets(); } catch (e) { list = []; }
    const parts = [];
    if (cartridgeOn) {
      parts.push(`<button type="button" class="btn wide wallet-opt" id="optCartridge"><span class="wallet-meta"><b>Play with Cartridge</b><small>Social / passkey · session can only mint Parrot Palm keepsakes</small></span></button>`);
      if (list.length) parts.push('<p class="muted">— or a browser wallet —</p>');
    }
    list.forEach((w, i) => {
      const label = displayWalletName(w);
      parts.push(`<button type="button" class="btn wide wallet-opt" data-ext="${i}">${iconSrc(w) ? `<img src="${esc(iconSrc(w))}" alt="" width="28" height="28">` : '✦ '}${esc(label)}</button>`);
    });
    if (!cartridgeOn && !list.length) {
      parts.push(`<div class="nowallet"><p><b>No Starknet wallet found</b></p><p class="muted">The game is happy to play without one.</p>${(C.installLinks || []).map(l => `<a class="btn wide" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.name)} ↗</a>`).join('')}</div>`);
    }
    box.innerHTML = parts.join('');
    const cart = $('#optCartridge');
    if (cart) cart.onclick = () => connectCartridge();
    box.querySelectorAll('[data-ext]').forEach(b => { b.onclick = () => connectExtension(list[Number(b.getAttribute('data-ext'))]); });
  }

  async function connectCartridge() {
    try {
      const sz = await loadStarkzap();
      const cart = C.cartridge || {};
      const connected = await sz.connect({
        network: C.network || 'sepolia',
        rpcUrl: C.rpcUrl,
        policies: policies(),
        preset: cart.preset,
        url: cart.url,
        feeMode: cart.feeMode || { type: 'paymaster' },
        deploy: cart.deploy || 'if_needed'
      });
      wallet = connected;
      walletKind = 'cartridge';
      address = normalize(connected.address);
      if (cs.address !== address) { mintedTiles.clear(); mintedChart = false; }
      cs.walletId = 'cartridge';
      cs.address = address;
      saveCs();
      G.ui.closeModal('wallets');
      refreshButton();
      G.ui.toast('Connected with Cartridge ✦ ' + short(address));
      await sync(true);
    } catch (e) {
      G.ui.toast(classify(e) === 'USER_CANCELLED' ? ERR.USER_CANCELLED : 'Cartridge: ' + friendly(e));
    }
  }

  async function connectExtension(w) {
    try {
      const g = await gsn();
      const sw = await g.enable(w);
      const accts = await sw.request({ type: 'wallet_requestAccounts', params: {} });
      if (!accts || !accts.length) throw new Error('No account was shared');
      wallet = sw;
      walletKind = 'extension';
      address = normalize(accts[0]);
      let chainId = null;
      try { chainId = await sw.request({ type: 'wallet_requestChainId' }); } catch (e) { /* older wallets */ }
      chainOk = !chainId || BigInt(chainId) === BigInt(C.chainId);
      if (cs.address !== address) { mintedTiles.clear(); mintedChart = false; }
      cs.walletId = w.id;
      cs.address = address;
      saveCs();
      G.ui.closeModal('wallets');
      refreshButton();
      G.ui.toast(chainOk ? 'Connected ✦ ' + short(address) : 'Connected, but switch to ' + C.networkName);
      await sync(true);
    } catch (e) {
      G.ui.toast(classify(e) === 'USER_CANCELLED' ? ERR.USER_CANCELLED : 'Wallet: ' + friendly(e));
    }
  }

  async function disconnect() {
    try {
      if (walletKind === 'cartridge' && wallet && wallet.disconnect) await wallet.disconnect();
    } catch (e) { /* ignore */ }
    wallet = null; walletKind = null; address = null;
    cs = {}; mintedTiles.clear(); mintedChart = false; saveCs();
    refreshButton();
    G.ui.closeModal('chainPanel');
    G.ui.toast('Wallet disconnected. Your tiles stay on this device.');
  }

  async function sync(loud) {
    if (!configured || !address) { push(); return; }
    try {
      const tiles = await call('minted_tiles_of', [address]);
      const n = parseInt(tiles[0], 16) || 0;
      mintedTiles.clear();
      tiles.slice(1, 1 + n).forEach(x => { const id = parseInt(x, 16); if (id) mintedTiles.add(id); });
      const chart = await call('has_chart', [address]);
      mintedChart = BigInt(chart[0] || 0) !== 0n;
      saveCs();
      if (loud) G.ui.toast(mintedTiles.size ? '✦ ' + mintedTiles.size + ' keepsake' + (mintedTiles.size > 1 ? 's' : '') + ' on Starknet' : 'No keepsakes on this wallet yet');
    } catch (e) {
      if (loud) G.ui.toast('Could not reach Starknet right now.');
    }
  }

  function isSponsored(m) { return m === 'sponsored' || (m && m.type === 'paymaster'); }
  async function execute(calldata, entry) {
    const call = { contractAddress: C.contractAddress, entrypoint: entry, calldata: calldata };
    if (walletKind === 'cartridge') {
      const mode = feeFallbackUsed ? ((C.cartridge && C.cartridge.fallbackFeeMode) || 'user_pays') : feeMode;
      try {
        if (typeof wallet.preflight === 'function') {
          const pf = await wallet.preflight({ calls: [call], feeMode: mode });
          if (pf && pf.ok === false) throw new Error(pf.reason || 'preflight failed');
        }
        return await wallet.execute([call], { feeMode: mode });
      } catch (err) {
        if (!feeFallbackUsed && isSponsored(mode) && classify(err) === 'SPONSORSHIP_UNAVAILABLE') {
          feeFallbackUsed = true;
          G.ui.toast(ERR.SPONSORSHIP_UNAVAILABLE + ' Your wallet can pay the fee.');
          return await wallet.execute([call], { feeMode: (C.cartridge && C.cartridge.fallbackFeeMode) || 'user_pays' });
        }
        throw err;
      }
    }
    return await wallet.request({
      type: 'wallet_addInvokeTransaction',
      params: { calls: [{ contract_address: C.contractAddress, entry_point: entry, calldata: calldata }] }
    });
  }

  function needWallet() {
    if (wallet && address) return true;
    openPicker();
    return false;
  }

  async function mintTile(tile, statusEl) {
    if (!tile) return;
    if (tile.rarity !== 'legendary' && tile.rarity !== 'extra') {
      G.ui.toast('Only legendary and extra tiles become keepsakes.');
      return;
    }
    if (!configured) {
      G.ui.toast('Collectibles aren’t deployed yet. This tile is safe in your album.');
      if (statusEl) statusEl.textContent = 'Minting opens once the contract address is set.';
      return;
    }
    if (mintedTiles.has(tile.n)) { G.ui.toast('Already minted ✦'); return; }
    if (!needWallet() || busy) return;
    if (!chainOk) { G.ui.toast(ERR.CHAIN_MISMATCH); return; }
    busy = true;
    if (statusEl) statusEl.textContent = 'Check your wallet to mint ' + tile.name + '…';
    try {
      const res = await execute([hex(tile.n)], 'mint_tile');
      const h = res && (res.transaction_hash || res.transactionHash || res.hash);
      if (!h) throw new Error('no transaction hash');
      if (statusEl) statusEl.innerHTML = 'Minting… <a href="' + esc(C.explorerTx + h) + '" target="_blank" rel="noopener noreferrer">view tx</a>';
      await waitTx(h);
      mintedTiles.add(tile.n);
      saveCs();
      if (statusEl) statusEl.textContent = 'Minted on Starknet ✦';
      G.ui.toast('✦ ' + tile.name + ' is a keepsake now');
      G.ui.confetti(24);
    } catch (e) {
      if (statusEl) statusEl.textContent = classify(e) === 'USER_CANCELLED' ? ERR.USER_CANCELLED : friendly(e);
      G.ui.toast(friendly(e));
    } finally { busy = false; }
  }

  async function mintChart(statusEl) {
    if (!G.isComplete()) { G.ui.toast('Finish the map first.'); return; }
    if (!configured) {
      G.ui.toast('The chart contract isn’t deployed yet. The treasure stays in your game.');
      if (statusEl) statusEl.textContent = 'Minting opens once the contract address is set.';
      return;
    }
    if (mintedChart) { G.ui.toast('Chart already minted ✦'); return; }
    if (!needWallet() || busy) return;
    busy = true;
    if (statusEl) statusEl.textContent = 'Check your wallet to mint the chart…';
    try {
      const res = await execute([], 'mint_chart');
      const h = res && (res.transaction_hash || res.transactionHash || res.hash);
      if (!h) throw new Error('no transaction hash');
      if (statusEl) statusEl.innerHTML = 'Minting… <a href="' + esc(C.explorerTx + h) + '" target="_blank" rel="noopener noreferrer">view tx</a>';
      await waitTx(h);
      mintedChart = true;
      saveCs();
      if (statusEl) statusEl.textContent = 'Chart minted ✦';
      G.ui.toast('✦ Coconut Isle is on Starknet');
      G.ui.confetti(40);
    } catch (e) {
      if (statusEl) statusEl.textContent = friendly(e);
      G.ui.toast(friendly(e));
    } finally { busy = false; }
  }

  function refreshButton() {
    const btn = $('#btnWallet');
    if (!btn) return;
    btn.hidden = false;
    btn.classList.toggle('connected', !!address);
    btn.classList.toggle('wrongnet', !!address && !chainOk);
    $('#btnWalletLbl').textContent = address ? short(address) : 'Connect';
    btn.setAttribute('aria-label', address ? 'Starknet wallet connected' : 'Connect a Starknet wallet (optional)');
  }

  function renderPanel() {
    const body = $('#chainBody');
    if (!body) return;
    const via = walletKind === 'cartridge' ? ' · Cartridge' : '';
    body.innerHTML = `
      <p class="muted">${esc(C.networkName || '')}${esc(via)}</p>
      <p><b>${esc(short(address))}</b></p>
      ${configured ? '' : '<div class="chain-note">The keepsake contract isn’t deployed yet, so minting is off. Tiles stay saved on this device. Deploy notes live in contracts/README.md.</div>'}
      <p>${mintedTiles.size} rare tile${mintedTiles.size === 1 ? '' : 's'} minted${mintedChart ? ' · chart minted' : ''}</p>
      ${configured && C.contractAddress ? `<p><a href="${esc(C.explorerContract + C.contractAddress)}" target="_blank" rel="noopener noreferrer">View contract ↗</a></p>` : ''}
      <button type="button" class="btn wide" id="syncNow">↻ Sync</button>
      <button type="button" class="btn wide" id="disc">Disconnect</button>`;
    const syncBtn = $('#syncNow');
    if (syncBtn) syncBtn.onclick = () => sync(true);
    const disc = $('#disc');
    if (disc) disc.onclick = disconnect;
  }

  function boot() {
    G = window.PP_GAME;
    if (!G) return;
    const btn = $('#btnWallet');
    if (!btn) return;
    refreshButton();
    push();
    btn.addEventListener('click', () => { if (address) { G.ui.openModal('chainPanel'); renderPanel(); } else openPicker(); });
    window.PP_CHAIN = { mintTile: mintTile, mintChart: mintChart, sync: sync };
  }

  if (window.PP_GAME) boot();
  else document.addEventListener('pp:ready', boot, { once: true });
})();
