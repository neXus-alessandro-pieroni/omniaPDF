const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');
const Poster = require('./poster.js');

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

ipcMain.handle('reveal', (_e, p) => { if (typeof p === 'string') shell.showItemInFolder(p); });

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
