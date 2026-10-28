/* Punto d'ingresso: se è stato scaricato un aggiornamento leggero (update.asar) più recente
   della versione installata, lo usa al posto dei file inclusi nell'installer. */
'use strict';
const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SHELL = 1; // compatibilità con l'installer (cambia solo se serve reinstallare)

// Electron tratta i file .asar come cartelle: per leggerli/cancellarli come semplici file si disattiva il supporto asar
function raw(fn) { const prev = process.noAsar; process.noAsar = true; try { return fn(); } finally { process.noAsar = prev; } }

function cmp(a, b) {
  const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d; }
  return 0;
}

let root = __dirname;
const dir = path.join(app.getPath('userData'), 'update');
let meta = null;
try {
  meta = JSON.parse(fs.readFileSync(path.join(dir, 'update.json'), 'utf8'));
  const file = path.join(dir, path.basename(String(meta.file)));
  const bundled = require(path.join(__dirname, 'package.json')).version;
  if (meta.shell === SHELL && cmp(meta.version, bundled) > 0 &&
      raw(() => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')) === meta.sha256) {
    root = file;
  }
} catch (e) { /* nessun aggiornamento valido: si usa la versione installata */ }

// pulizia dei vecchi aggiornamenti
try {
  for (const f of fs.readdirSync(dir)) {
    if (/^update-.*\.asar$/.test(f) && path.join(dir, f) !== root) { try { raw(() => fs.unlinkSync(path.join(dir, f))); } catch (e) { /* in uso */ } }
  }
} catch (e) { /* cartella assente */ }

global.__OMNIA = { root, dir, shell: SHELL };
try {
  require(path.join(root, 'main.js'));
} catch (e) {
  if (root !== __dirname) {
    // aggiornamento difettoso: lo scarta e riparte dalla versione installata
    try { fs.unlinkSync(path.join(dir, 'update.json')); } catch (e2) { /* ignora */ }
    global.__OMNIA.root = __dirname;
    require(path.join(__dirname, 'main.js'));
  } else { throw e; }
}
