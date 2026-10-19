(function () {
  'use strict';
  var KEY = 'omnia.nota.v1';
  var $ = function (id) { return document.getElementById(id); };
  var st = { dicitura: 'Condominio', nome: 'Vespucci', cf: '90016320443' };
  var mode = 'locandina';
  try { var s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) { st = Object.assign(st, s.st || {}); mode = s.mode === 'nota' ? 'nota' : 'locandina'; } } catch (e) { /* ignora */ }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify({ st: st, mode: mode })); } catch (e) { /* ignora */ } }

  var pdfjs = window.pdfjsLib;
  if (pdfjs) pdfjs.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';

  var fields = { nDicitura: 'dicitura', nNome: 'nome', nCf: 'cf' };
  Object.keys(fields).forEach(function (id) {
    $(id).value = st[fields[id]] || '';
    $(id).addEventListener('input', function () { st[fields[id]] = $(id).value; persist(); schedule(); });
  });

  var timer = null, busy = false, again = false;
  function schedule() { clearTimeout(timer); timer = setTimeout(render, 150); }
  async function render() {
    if (mode !== 'nota' || !pdfjs) return;
    if (busy) { again = true; return; }
    busy = true;
    try {
      var b64 = await window.api.notaBuild(st);
      var bin = atob(b64), u8 = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      var doc = await pdfjs.getDocument({ data: u8 }).promise;
      var box = $('notaPages'), frag = document.createDocumentFragment();
      var width = Math.max(300, Math.min(box.clientWidth - 40, 820));
      for (var n = 1; n <= doc.numPages; n++) {
        var pg = await doc.getPage(n);
        var base = pg.getViewport({ scale: 1 });
        var k = (width / base.width) * (window.devicePixelRatio || 1);
        var vp = pg.getViewport({ scale: k });
        var cv = document.createElement('canvas');
        cv.width = Math.floor(vp.width); cv.height = Math.floor(vp.height);
        cv.style.width = width + 'px';
        await pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
        frag.appendChild(cv);
      }
      var top = box.scrollTop;
      box.innerHTML = ''; box.appendChild(frag); box.scrollTop = top;
    } catch (e) { console.error(e); }
    busy = false;
    if (again) { again = false; render(); }
  }

  function setMode(m) {
    mode = m === 'nota' ? 'nota' : 'locandina';
    var nota = mode === 'nota'; window.__notaMode = nota;
    document.querySelectorAll('.tabs button').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.doc === mode)); });
    $('notaForm').hidden = !nota; $('posterForm').hidden = nota;
    $('notaPages').hidden = !nota; $('previewBox').hidden = nota;
    $('segBox').hidden = nota; $('btnPng').hidden = nota; $('btnNew').hidden = nota;
    $('missing').hidden = true;
    $('fmtLbl').textContent = nota ? 'A4 · 2 pagine' : 'Foglio A4';
    persist();
    if (nota) render(); else if (window.dispatchEvent) window.dispatchEvent(new Event('resize'));
  }
  document.querySelectorAll('.tabs button').forEach(function (b) { b.addEventListener('click', function () { setMode(b.dataset.doc); }); });

  // PDF: in modalità nota intercetta il pulsante prima del gestore della locandina
  $('btnPdf').addEventListener('click', async function (ev) {
    if (mode !== 'nota') return;
    ev.stopImmediatePropagation();
    var b = $('btnPdf'); b.disabled = true;
    try {
      var res = await window.api.notaExport(st);
      var t = $('toast');
      if (res.ok || !res.canceled) {
        t.innerHTML = ''; t.className = 'toast' + (res.ok ? '' : ' err');
        var sp = document.createElement('span'); sp.textContent = res.ok ? 'Nota esplicativa salvata' : 'Non sono riuscito a salvare: ' + (res.error || 'errore'); t.appendChild(sp);
        if (res.ok) { var bt = document.createElement('button'); bt.type = 'button'; bt.textContent = 'Mostra nella cartella'; bt.addEventListener('click', function () { window.api.reveal(res.path); }); t.appendChild(bt); }
        t.hidden = false; setTimeout(function () { t.hidden = true; }, 8000);
      }
    } catch (e) { /* ignora */ }
    b.disabled = false;
  }, true);

  setMode(mode);
})();
