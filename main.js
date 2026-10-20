const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');
const Poster = require('./poster.js');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

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
const clean = (s) => String(s || '').replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/€/g, 'EUR').replace(/[^ -~ -ÿ]/g, '').replace(/\s+/g, ' ').trim();

async function buildDoc(id, cfg) {
  cfg = cfg || {};
  if (id === 'nota') {
    const pdf = await PDFDocument.load(fs.readFileSync(path.join(__dirname, 'assets', 'nota-esplicativa.pdf')));
    const page = pdf.getPage(0);
    const font = await pdf.embedFont(StandardFonts.HelveticaBold);
    const l1 = [clean(cfg.dicitura), clean(cfg.nome)].filter(Boolean).join(' ');
    const cf = clean(cfg.cf);
    const put = (txt, y) => {
      if (!txt) return;
      let size = 11;
      while (size > 7 && font.widthOfTextAtSize(txt, size) > 330) size -= 0.5;
      page.drawText(txt, { x: 302.9 - font.widthOfTextAtSize(txt, size) / 2, y, size, font, color: rgb(0.082, 0.082, 0.082) });
    };
    put(l1, 720.96); put(cf ? 'C.F. ' + cf : '', 708.72);
    return pdf.save();
  }
  if (id === 'tariffario') {
    const pdf = await PDFDocument.load(fs.readFileSync(path.join(__dirname, 'assets', 'tariffario.pdf')));
    const page = pdf.getPage(0);
    const font = await pdf.embedFont(StandardFonts.TimesRoman);
    const txt = clean(cfg.importo);
    if (txt) {
      let size = 13;
      while (size > 8 && font.widthOfTextAtSize(txt, size) > 41) size -= 0.5;
      page.drawText(txt, { x: 152.439, y: 387.847, size, font, color: rgb(0.1, 0.1, 0.1) });
    }
    return pdf.save();
  }
  throw new Error('Documento sconosciuto');
}
const DOC_NAMES = { nota: ['Nota-esplicativa', 'nome'], tariffario: ['Tariffario-Omnia-Casa', 'importo'] };

ipcMain.handle('doc-build', async (_e, { id, cfg }) => Buffer.from(await buildDoc(id, cfg)).toString('base64'));

ipcMain.handle('doc-export', async (_e, { id, cfg }) => {
  const [pre, key] = DOC_NAMES[id] || ['Documento', ''];
  const base = [pre, key && id === 'nota' ? safeName(cfg && cfg[key]) : ''].filter(Boolean).join('-');
  const res = process.env.OMNIA_TEST_SAVE_DIR ? { filePath: path.join(process.env.OMNIA_TEST_SAVE_DIR, id + '.pdf') } : await dialog.showSaveDialog(win, {
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

ipcMain.handle('reveal', (_e, p) => { if (typeof p === 'string') shell.showItemInFolder(p); });

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
