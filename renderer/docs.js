(function () {
  'use strict';
  var KEY = 'omnia.docs.v1';
  var $ = function (id) { return document.getElementById(id); };
  var TITLES = { locandina: 'Locandina riunione', nota: 'Nota esplicativa', tariffario: 'Tariffario Omnia Casa' };
  var DEF = { nota: { dicitura: 'Condominio', nome: 'Vespucci', cf: '90016320443' }, tariffario: { importo: '450.00' } };
  var st = JSON.parse(JSON.stringify(DEF));
  try {
    var s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s) { Object.keys(DEF).forEach(function (k) { st[k] = Object.assign({}, DEF[k], s[k] || {}); }); }
    else { var old = JSON.parse(localStorage.getItem('omnia.nota.v1') || 'null'); if (old && old.st) st.nota = Object.assign({}, DEF.nota, old.st); }
  } catch (e) { /* ignora */ }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* ignora */ } }

  var mode = 'home';
  var pdfjs = window.pdfjsLib;
  if (pdfjs) pdfjs.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';

  var inputs = { nDicitura: ['nota', 'dicitura'], nNome: ['nota', 'nome'], nCf: ['nota', 'cf'], tImporto: ['tariffario', 'importo'] };
  Object.keys(inputs).forEach(function (id) {
    var d = inputs[id][0], k = inputs[id][1];
    $(id).value = st[d][k] || '';
    $(id).addEventListener('input', function () { st[d][k] = $(id).value; persist(); schedule(); });
  });

  /* ---------- anteprima PDF ---------- */
  var timer = null, busy = false, again = false;
  function schedule() { clearTimeout(timer); timer = setTimeout(render, 150); }
  function b64ToBytes(b64) { var bin = atob(b64), u8 = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return u8; }
  async function openDoc(id) {
    return pdfjs.getDocument({ data: b64ToBytes(await window.api.docBuild(id, st[id])) }).promise;
  }
  async function render() {
    if (mode !== 'nota' && mode !== 'tariffario') return;
    if (!pdfjs) return;
    if (busy) { again = true; return; }
    busy = true;
    var id = mode;
    try {
      var doc = await openDoc(id);
      var box = $('notaPages'), frag = document.createDocumentFragment();
      var width = Math.max(300, Math.min(box.clientWidth - 40, 820));
      for (var n = 1; n <= doc.numPages; n++) {
        var pg = await doc.getPage(n);
        var base = pg.getViewport({ scale: 1 });
        var vp = pg.getViewport({ scale: (width / base.width) * (window.devicePixelRatio || 1) });
        var cv = document.createElement('canvas');
        cv.width = Math.floor(vp.width); cv.height = Math.floor(vp.height); cv.style.width = width + 'px';
        await pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
        frag.appendChild(cv);
      }
      if (mode === id) { var top = box.scrollTop; box.innerHTML = ''; box.appendChild(frag); box.scrollTop = top; }
    } catch (e) { console.error(e); }
    busy = false;
    if (again) { again = false; render(); }
  }

  /* ---------- schermate ---------- */
  function setMode(m) {
    mode = TITLES[m] ? m : 'home';
    var home = mode === 'home', poster = mode === 'locandina', pdf = !home && !poster;
    window.__notaMode = pdf;
    $('home').hidden = !home;
    document.querySelector('.main').hidden = home;
    $('btnMenu').hidden = home;
    $('docTitle').textContent = home ? '' : TITLES[mode];
    $('notaForm').hidden = mode !== 'nota'; $('tarForm').hidden = mode !== 'tariffario'; $('posterForm').hidden = !poster;
    $('notaPages').hidden = !pdf; $('previewBox').hidden = !poster;
    $('segBox').hidden = !poster; $('btnPng').hidden = !poster; $('btnNew').hidden = !poster;
    if (!poster) $('missing').hidden = true;
    $('fmtLbl').textContent = poster ? 'Foglio A4' : (mode === 'nota' ? 'A4 · 2 pagine' : 'A4 · 3 pagine');
    if (pdf) { $('notaPages').innerHTML = ''; render(); }
    else if (poster) window.dispatchEvent(new Event('resize'));
  }
  document.querySelectorAll('[data-open]').forEach(function (b) { b.addEventListener('click', function () { setMode(b.dataset.open); }); });
  $('btnMenu').addEventListener('click', function () { setMode('home'); });

  /* ---------- toast ---------- */
  function toast(msg, path, err) {
    var t = $('toast'); t.innerHTML = ''; t.className = 'toast' + (err ? ' err' : '');
    var sp = document.createElement('span'); sp.textContent = msg; t.appendChild(sp);
    if (path) { var bt = document.createElement('button'); bt.type = 'button'; bt.textContent = 'Mostra nella cartella'; bt.addEventListener('click', function () { window.api.reveal(path); }); t.appendChild(bt); }
    t.hidden = false; setTimeout(function () { t.hidden = true; }, err ? 9000 : 8000);
  }

  /* ---------- scarica PDF (modelli PDF) ---------- */
  $('btnPdf').addEventListener('click', async function (ev) {
    if (!window.__notaMode) return;
    ev.stopImmediatePropagation();
    var b = $('btnPdf'); b.disabled = true;
    try {
      var res = await window.api.docExport(mode, st[mode]);
      if (res.ok) toast('Documento salvato', res.path); else if (!res.canceled) toast('Non sono riuscito a salvare: ' + (res.error || 'errore'), null, true);
    } catch (e) { toast('Errore durante il salvataggio', null, true); }
    b.disabled = false;
  }, true);

  /* ---------- stampa ---------- */
  $('btnPrint').addEventListener('click', async function () {
    var b = $('btnPrint'); b.disabled = true;
    try {
      var res;
      if (mode === 'locandina') {
        var cfg = window.__getState();
        res = await window.api.printPoster(cfg);
      } else {
        var doc = await openDoc(mode), imgs = [], land = false;
        for (var n = 1; n <= doc.numPages; n++) {
          var pg = await doc.getPage(n), base = pg.getViewport({ scale: 1 });
          if (n === 1) land = base.width > base.height;
          var vp = pg.getViewport({ scale: 2480 / Math.min(base.width, base.height) });
          var cv = document.createElement('canvas'); cv.width = Math.floor(vp.width); cv.height = Math.floor(vp.height);
          var ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
          await pg.render({ canvasContext: ctx, viewport: vp }).promise;
          imgs.push(cv.toDataURL('image/jpeg', 0.92));
        }
        res = await window.api.printImages(imgs, land);
      }
      if (res && !res.ok && !res.canceled) toast('Stampa non riuscita: ' + (res.error || 'errore'), null, true);
    } catch (e) { toast('Stampa non riuscita', null, true); }
    b.disabled = false;
  });

  setMode('home');
})();
