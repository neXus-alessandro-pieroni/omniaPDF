(function () {
  'use strict';
  var P = window.Poster;
  var KEY = 'omnia.locandina.v1';

  function defaults() {
    return {
      titolo: 'Riunione di condominio', condominio: '', indirizzo: '',
      data: '', ora: '', luogo1: P.SEDE.via, luogo2: P.SEDE.citta,
      zoom: true, zoomLink: '', zoomId: '', zoomPass: '',
      ordine: [''], orientamento: 'v',
    };
  }
  var state = defaults();
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && saved.state) { state = Object.assign(defaults(), saved.state); if (!Array.isArray(state.ordine) || !state.ordine.length) state.ordine = ['']; }
    if (state.orientamento !== 'h') state.orientamento = 'v';
  } catch (e) { /* ignora */ }

  var $ = function (id) { return document.getElementById(id); };
  var fields = ['titolo', 'condominio', 'indirizzo', 'data', 'ora', 'luogo1', 'luogo2', 'zoomLink', 'zoomId', 'zoomPass'];
  var assets = null, frameReady = false, drawTimer = null;

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify({ state: state })); } catch (e) { /* ignora */ }
  }

  /* ---------- form ---------- */
  function syncFormFromState() {
    fields.forEach(function (f) { $(f).value = state[f] || ''; });
    $('zoom').checked = !!state.zoom;
    $('zoomFields').hidden = !state.zoom;
    renderAgenda();
    setOrient(state.orientamento, true);
  }

  fields.forEach(function (f) {
    $(f).addEventListener('input', function () { state[f] = $(f).value; changed(); });
  });
  $('zoom').addEventListener('change', function () {
    state.zoom = $('zoom').checked; $('zoomFields').hidden = !state.zoom; changed();
  });
  $('btnSede').addEventListener('click', function () {
    state.luogo1 = P.SEDE.via; state.luogo2 = P.SEDE.citta;
    $('luogo1').value = state.luogo1; $('luogo2').value = state.luogo2; changed();
  });

  function renderAgenda(focusIdx) {
    var ol = $('ordine'); ol.innerHTML = '';
    state.ordine.forEach(function (txt, i) {
      var li = document.createElement('li');
      var n = document.createElement('span'); n.className = 'num'; n.textContent = i + 1;
      var inp = document.createElement('input'); inp.value = txt; inp.placeholder = 'es. Approvazione bilancio consuntivo';
      inp.setAttribute('aria-label', 'Punto ' + (i + 1));
      inp.addEventListener('input', function () { state.ordine[i] = inp.value; changed(); });
      var up = btn('▲', 'Sposta su', i === 0, function () { swap(i, i - 1); });
      var dn = btn('▼', 'Sposta giù', i === state.ordine.length - 1, function () { swap(i, i + 1); });
      var del = btn('✕', 'Elimina punto', false, function () {
        state.ordine.splice(i, 1); if (!state.ordine.length) state.ordine = [''];
        renderAgenda(); changed();
      }); del.classList.add('del');
      li.append(n, inp, up, dn, del); ol.appendChild(li);
    });
    $('btnAdd').disabled = state.ordine.length >= 10;
    if (focusIdx != null) { var el = ol.querySelectorAll('input')[focusIdx]; if (el) el.focus(); }
  }
  function btn(label, title, disabled, fn) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'icon-btn';
    b.textContent = label; b.title = title; b.setAttribute('aria-label', title); b.disabled = disabled;
    b.addEventListener('click', fn); return b;
  }
  function swap(a, b) {
    var t = state.ordine[a]; state.ordine[a] = state.ordine[b]; state.ordine[b] = t;
    renderAgenda(b); changed();
  }
  $('btnAdd').addEventListener('click', function () {
    if (state.ordine.length >= 10) return;
    state.ordine.push(''); renderAgenda(state.ordine.length - 1); changed();
  });
  $('btnNew').addEventListener('click', function () {
    if (confirm('Iniziare una nuova riunione? I dati inseriti verranno cancellati.')) {
      state = defaults(); syncFormFromState(); changed();
    }
  });

  /* ---------- orientamento ---------- */
  function setOrient(o, silent) {
    state.orientamento = o === 'h' ? 'h' : 'v';
    document.querySelectorAll('.seg button').forEach(function (b) {
      b.setAttribute('aria-checked', String(b.dataset.orient === state.orientamento));
    });
    if (!silent) { persist(); draw(); fit(); }
  }
  document.querySelectorAll('.seg button').forEach(function (b) {
    b.addEventListener('click', function () { setOrient(b.dataset.orient); });
  });

  /* ---------- anteprima ---------- */
  function previewCfg() {
    var c = Object.assign({}, state);
    var items = (c.ordine || []).filter(function (x) { return x && x.trim(); });
    if (!items.length) c.ordine = ['[Punto 1 — es. Approvazione bilancio consuntivo]', '[Punto 2 — es. Preventivo di spesa e ripartizione]', '[Punto 3 — es. Varie ed eventuali]'];
    if (c.zoom) {
      if (!(c.zoomId || '').trim()) c.zoomId = '[000 0000 0000]';
      if (!(c.zoomPass || '').trim()) c.zoomPass = '[CODICE]';
    }
    return c;
  }
  function draw() {
    drawTimer = null;
    if (!frameReady) return;
    var doc = $('preview').contentDocument;
    var r = doc && doc.getElementById('r');
    if (r) r.innerHTML = P.rootHtml(previewCfg(), assets.logo);
    var miss = P.missing(state), m = $('missing');
    if (miss.length) { m.hidden = false; m.textContent = 'Da completare: ' + miss.join(', '); } else { m.hidden = true; }
  }
  function changed() { persist(); if (drawTimer) clearTimeout(drawTimer); drawTimer = setTimeout(draw, 80); }

  function fit() {
    var dim = P.dims(state), W = dim.w, H = dim.h;
    var box = $('previewBox');
    var cs = getComputedStyle(box);
    var aw = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var ah = box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    var s = Math.max(0.1, Math.min(aw / W, ah / H));
    var wrap = $('previewFrameWrap');
    wrap.style.width = Math.floor(W * s) + 'px'; wrap.style.height = Math.floor(H * s) + 'px';
    var fr = $('preview');
    fr.style.width = W + 'px'; fr.style.height = H + 'px';
    fr.style.transform = 'scale(' + s + ')';
  }
  new ResizeObserver(fit).observe($('previewBox'));

  /* ---------- export ---------- */
  var toastTimer = null;
  function toast(msg, opts) {
    opts = opts || {};
    var t = $('toast'); t.innerHTML = ''; t.className = 'toast' + (opts.err ? ' err' : '');
    var s = document.createElement('span'); s.textContent = msg; t.appendChild(s);
    if (opts.path) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = 'Mostra nella cartella';
      b.addEventListener('click', function () { window.api.reveal(opts.path); }); t.appendChild(b);
    }
    t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, opts.err ? 9000 : 8000);
  }
  async function doExport(format) {
    var miss = P.missing(state);
    if (miss.length && !confirm('Mancano ancora alcuni dati:\n\n• ' + miss.join('\n• ') + '\n\nVuoi scaricare comunque la locandina?')) return;
    var b1 = $('btnPdf'), b2 = $('btnPng'); b1.disabled = b2.disabled = true;
    try {
      var res = await window.api.exportFile({ config: state, format: format });
      if (res.ok) toast('Locandina salvata', { path: res.path });
      else if (!res.canceled) toast('Non sono riuscito a salvare: ' + (res.error || 'errore sconosciuto'), { err: true });
    } catch (e) { toast('Errore durante il salvataggio', { err: true }); }
    b1.disabled = b2.disabled = false;
  }
  $('btnPdf').addEventListener('click', function () { doExport('pdf'); });
  $('btnPng').addEventListener('click', function () { doExport('png'); });

  /* ---------- avvio ---------- */
  syncFormFromState();
  window.api.getAssets().then(function (a) {
    assets = a;
    $('brandLogo').src = a.logo;
    var f = $('preview');
    f.addEventListener('load', function () { frameReady = true; draw(); fit(); });
    f.srcdoc = '<!doctype html><html><head><meta charset="utf-8"><style>' + a.fontCss +
      'html,body{margin:0;background:#0E3A25;overflow:hidden}body{font-family:Inter,sans-serif}</style></head><body><div id="r"></div></body></html>';
    fit();
  });
})();
