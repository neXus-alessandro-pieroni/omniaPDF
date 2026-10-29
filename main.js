const { app, BrowserWindow, Menu, dialog, ipcMain, shell, net } = require('electron');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const Poster = require('./poster.js');
const APP_VERSION = require('./package.json').version;
const OMNIA = global.__OMNIA || { root: __dirname, dir: path.join(app.getPath('userData'), 'update'), shell: 1 };

const FONTS = [
  ['Inter-Regular.woff', 400], ['Inter-Medium.woff', 500], ['Inter-SemiBold.woff', 600],
  ['Inter-Bold.woff', 700], ['Inter-ExtraBold.woff', 800], ['Inter-Black.woff', 900],
];

let assetsCache = null;
function getAssets() {
  if (assetsCache) return assetsCache;
  const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, 'assets', 'logo.png')).toString('base64');
  const fontCss = FONTS.map(([file, w]) => {
    const b64 = fs.readFileSync(path.join(__dirname, 'fonts', file)).toString('base64');
    return `@font-face{font-family:Inter;font-weight:${w};font-style:normal;src:url(data:font/woff;base64,${b64}) format("woff")}`;
  }).join('');
  assetsCache = { logo, fontCss };
  return assetsCache;
}

let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1360, height: 880, minWidth: 1040, minHeight: 700,
    backgroundColor: '#0E3A25',
    title: 'Omnia Print by neXus',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
    },
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    { role: 'editMenu' },
    { label: 'Vista', submenu: [{ role: 'reload' }, { role: 'togglefullscreen' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'resetZoom' }] },
    { role: 'windowMenu' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}


async function renderWindow(config) {
  const { logo, fontCss } = getAssets();
  const html = Poster.documentHtml(config, { logo, fontCss });
  const tmp = path.join(os.tmpdir(), `omnia-locandina-${process.pid}-${Date.now()}.html`);
  fs.writeFileSync(tmp, html);
  const dim = Poster.dims(config);
  const w = new BrowserWindow({
    show: false, width: dim.w, height: dim.h, useContentSize: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, javascript: true },
  });
  await w.loadFile(tmp);
  await w.webContents.executeJavaScript('document.fonts.ready.then(() => true)');
  return { w, tmp };
}

function safeName(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);
}

ipcMain.handle('get-assets', () => getAssets());

ipcMain.handle('export', async (_e, { config, format }) => {
  const fmt = format === 'png' ? 'png' : 'pdf';
  const land = config.orientamento === 'h';
  const { w: POSTER_W, h: POSTER_H } = Poster.dims(config);
  const d = Poster.parseDate(config.data);
  const base = ['Locandina', safeName(config.condominio), d ? config.data : ''].filter(Boolean).join('-');
  const defName = fmt === 'pdf' ? `${base}${land ? '-orizzontale' : ''}.pdf` : `${base}${land ? '-orizzontale' : ''}.png`;
  const res = await dialog.showSaveDialog(win, {
    title: fmt === 'pdf' ? 'Salva la locandina (PDF)' : 'Salva la locandina (immagine)',
    defaultPath: path.join(app.getPath('documents'), defName),
    filters: fmt === 'pdf' ? [{ name: 'PDF', extensions: ['pdf'] }] : [{ name: 'Immagine PNG', extensions: ['png'] }],
  });
  if (res.canceled || !res.filePath) return { ok: false, canceled: true };

  let rw, tmp;
  try {
    ({ w: rw, tmp } = await renderWindow(config));
    if (fmt === 'pdf') {
      const pageWpx = ((land ? 297 : 210) / 25.4) * 96;
      const data = await rw.webContents.printToPDF({
        pageSize: 'A4', landscape: land, printBackground: true,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        scale: (pageWpx / POSTER_W) * 0.9995,
      });
      fs.writeFileSync(res.filePath, data);
    } else {
      // PNG a doppia risoluzione per stampa/condivisione nitida
      await rw.webContents.executeJavaScript('document.body.style.zoom = 2; true');
      rw.setContentSize(POSTER_W * 2, POSTER_H * 2);
      await new Promise((r) => setTimeout(r, 400));
      const img = await rw.webContents.capturePage({ x: 0, y: 0, width: POSTER_W * 2, height: POSTER_H * 2 });
      fs.writeFileSync(res.filePath, img.toPNG());
    }
    return { ok: true, path: res.filePath };
  } catch (err) {
    return { ok: false, error: String(err && err.message || err) };
  } finally {
    if (rw && !rw.isDestroyed()) rw.destroy();
    if (tmp) fs.rm(tmp, () => {});
  }
});

/* ---------- Documenti PDF modificabili (nota esplicativa, tariffario) ---------- */

async function buildDoc(id, cfg) {
  cfg = cfg || {};
  if (id === 'nota') return buildNota(cfg);
  if (id === 'tariffario') return buildTariffario(cfg);
  throw new Error('Documento sconosciuto');
}

/* Tariffario: pagine HTML (template) rese in PDF; si modifica solo l'importo annuo per l'intero condominio */
function parseImporto(v) {
  let s = String(v == null ? '' : v).replace(/[€\s]/g, '');
  if (!/^\d[\d.,]*$/.test(s)) return null;
  if (s.includes('.') && s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (s.includes(',')) s = s.replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const n = Number(s);
  return Number.isFinite(n) && n > 0 && n < 10000000 ? n : null;
}
function formatImporto(v) {
  const n = parseImporto(v);
  return n === null ? '€ ___,__' : '€ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let docChain = Promise.resolve();
const docCache = {};
/* Rende in PDF un template HTML (A4, CSS @page) sostituendo i segnaposto; una sola resa alla volta, con cache sull'ultimo risultato */
function renderTemplate(name, vars) {
  const key = JSON.stringify(vars);
  const job = docChain.then(async () => {
    if (docCache[name] && docCache[name].key === key) return docCache[name].data;
    let html = fs.readFileSync(path.join(__dirname, 'assets', name + '.tpl.html'), 'utf8');
    Object.keys(vars).forEach((k) => { html = html.split('{{' + k + '}}').join(vars[k]); });
    const tmp = path.join(os.tmpdir(), `omnia-${name}-${process.pid}-${Date.now()}.html`);
    fs.writeFileSync(tmp, html);
    const w = new BrowserWindow({ show: false, width: 794, height: 1123, webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true } });
    try {
      await w.loadFile(tmp);
      await w.webContents.executeJavaScript('document.fonts.ready.then(() => true)');
      const data = await w.webContents.printToPDF({ pageSize: 'A4', printBackground: true, preferCSSPageSize: true, margins: { top: 0, bottom: 0, left: 0, right: 0 } });
      docCache[name] = { key, data };
      return data;
    } finally { if (!w.isDestroyed()) w.destroy(); fs.rm(tmp, () => {}); }
  });
  docChain = job.catch(() => {});
  return job;
}
function buildTariffario(cfg) { return renderTemplate('tariffario', { IMPORTO: formatImporto(cfg && cfg.importo) }); }
function buildNota(cfg) {
  cfg = cfg || {};
  const l1 = [cfg.dicitura, cfg.nome].map((x) => String(x || '').trim()).filter(Boolean).join(' ');
  const cf = String(cfg.cf || '').trim();
  const dest = (l1 ? '<b>' + esc(l1) + '</b>' : '') + (cf ? '<span>C.F. ' + esc(cf) + '</span>' : '');
  return renderTemplate('nota', { DESTINATARIO: dest });
}
const DOC_NAMES = { nota: ['Nota-esplicativa', 'nome'], tariffario: ['Tariffario-Omnia-Casa', 'importo'] };

ipcMain.handle('doc-build', async (_e, { id, cfg }) => Buffer.from(await buildDoc(id, cfg)).toString('base64'));

ipcMain.handle('doc-export', async (_e, { id, cfg }) => {
  const [pre, key] = DOC_NAMES[id] || ['Documento', ''];
  const base = [pre, key && id === 'nota' ? safeName(cfg && cfg[key]) : ''].filter(Boolean).join('-');
  const res = await dialog.showSaveDialog(win, {
    title: 'Salva il documento (PDF)',
    defaultPath: path.join(app.getPath('documents'), base + '.pdf'),
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });
  if (res.canceled || !res.filePath) return { ok: false, canceled: true };
  try { fs.writeFileSync(res.filePath, await buildDoc(id, cfg)); return { ok: true, path: res.filePath }; }
  catch (err) { return { ok: false, error: String(err && err.message || err) }; }
});

/* ---------- Stampa ---------- */
async function printImages(images, landscape) {
  const tmp = path.join(os.tmpdir(), `omnia-stampa-${process.pid}-${Date.now()}.html`);
  const pw = landscape ? '297mm' : '210mm', ph = landscape ? '210mm' : '297mm';
  const pages = images.map((u) => `<div class="p"><img src="${u}"></div>`).join('');
  fs.writeFileSync(tmp, `<!doctype html><meta charset="utf-8"><style>@page{size:A4 ${landscape ? 'landscape' : 'portrait'};margin:0}html,body{margin:0;background:#fff}.p{width:${pw};height:${ph};overflow:hidden;page-break-after:always;break-after:page}.p:last-child{page-break-after:auto;break-after:auto}.p img{width:100%;height:100%;display:block;object-fit:fill}</style>${pages}`);
  const w = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true } });
  try {
    await w.loadFile(tmp);
    await w.webContents.executeJavaScript('Promise.all(Array.from(document.images).map(i=>i.decode().catch(()=>0))).then(()=>true)');
    return await new Promise((resolve) => {
      w.webContents.print({ silent: false, printBackground: true, landscape: !!landscape, pageSize: 'A4', margins: { marginType: 'none' } },
        (ok, reason) => resolve(ok ? { ok: true } : { ok: false, canceled: /cancel/i.test(reason || ''), error: reason }));
    });
  } finally { if (!w.isDestroyed()) w.destroy(); fs.rm(tmp, () => {}); }
}

ipcMain.handle('print-images', async (_e, { images, landscape }) => {
  if (!Array.isArray(images) || !images.length || !images.every((u) => typeof u === 'string' && u.startsWith('data:image/'))) return { ok: false, error: 'Nessuna pagina da stampare' };
  try { return await printImages(images, !!landscape); } catch (err) { return { ok: false, error: String(err && err.message || err) }; }
});

ipcMain.handle('print-poster', async (_e, { config }) => {
  let rw, tmp;
  try {
    ({ w: rw, tmp } = await renderWindow(config));
    const { w: W, h: H } = Poster.dims(config);
    await rw.webContents.executeJavaScript('document.body.style.zoom = 2; true');
    rw.setContentSize(W * 2, H * 2);
    await new Promise((r) => setTimeout(r, 400));
    const img = await rw.webContents.capturePage({ x: 0, y: 0, width: W * 2, height: H * 2 });
    const url = 'data:image/png;base64,' + img.toPNG().toString('base64');
    rw.destroy(); rw = null;
    return await printImages([url], config.orientamento === 'h');
  } catch (err) { return { ok: false, error: String(err && err.message || err) }; }
  finally { if (rw && !rw.isDestroyed()) rw.destroy(); if (tmp) fs.rm(tmp, () => {}); }
});

/* ---------- Aggiornamenti leggeri ---------- */
const REPO = 'neXus-alessandro-pieroni/omniaPDF';
function cmpVer(a, b) {
  const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d; }
  return 0;
}
function notify(channel, payload) { if (win && !win.isDestroyed()) win.webContents.send(channel, payload); }
let pendingUpdate = null;
async function checkUpdate() {
  try {
    const H = { headers: { 'User-Agent': 'OmniaPrint', Accept: 'application/vnd.github+json' } };
    const rel = await (await net.fetch(`https://api.github.com/repos/${REPO}/releases/latest`, H)).json();
    const metaAsset = (rel.assets || []).find((a) => a.name === 'update.json');
    if (!metaAsset) return;
    const meta = await (await net.fetch(metaAsset.browser_download_url)).json();
    if (!meta || !meta.version || cmpVer(meta.version, APP_VERSION) <= 0) return;
    if (meta.shell !== OMNIA.shell) { notify('update-full', { version: meta.version, url: rel.html_url }); return; }
    if (pendingUpdate === meta.version) { notify('update-ready', { version: meta.version }); return; }
    const asset = (rel.assets || []).find((a) => a.name === meta.file);
    if (!asset || !/^update-[\w.]+\.asar$/.test(meta.file) || !/^[0-9a-f]{64}$/.test(meta.sha256)) return;
    const buf = Buffer.from(await (await net.fetch(asset.browser_download_url)).arrayBuffer());
    if (crypto.createHash('sha256').update(buf).digest('hex') !== meta.sha256) return;
    fs.mkdirSync(OMNIA.dir, { recursive: true });
    const prevNoAsar = process.noAsar; process.noAsar = true;
    try { fs.writeFileSync(path.join(OMNIA.dir, meta.file), buf); } finally { process.noAsar = prevNoAsar; }
    fs.writeFileSync(path.join(OMNIA.dir, 'update.json'), JSON.stringify({ version: meta.version, shell: meta.shell, file: meta.file, sha256: meta.sha256 }));
    pendingUpdate = meta.version;
    notify('update-ready', { version: meta.version });
  } catch (e) { /* offline o errore di rete: riprova al prossimo avvio */ }
}
ipcMain.handle('get-version', () => APP_VERSION);
ipcMain.handle('restart-app', () => { app.relaunch(); app.exit(0); });
ipcMain.handle('open-external', (_e, u) => { if (typeof u === 'string' && u.startsWith('https://github.com/')) shell.openExternal(u); });

ipcMain.handle('reveal', (_e, p) => { if (typeof p === 'string') shell.showItemInFolder(p); });

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  if (app.isPackaged) setTimeout(checkUpdate, 6000);
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
