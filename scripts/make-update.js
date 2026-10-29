/* Crea l'aggiornamento leggero: dist-update/update-<versione>.asar + update.json */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const asar = require('@electron/asar');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist-update');
const stage = path.join(out, 'stage');
const pkg = require(path.join(root, 'package.json'));
const SHELL = 1;

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(stage, { recursive: true });
for (const f of ['main.js', 'preload.js', 'poster.js']) fs.copyFileSync(path.join(root, f), path.join(stage, f));
for (const d of ['renderer', 'assets', 'fonts']) fs.cpSync(path.join(root, d), path.join(stage, d), { recursive: true });
fs.writeFileSync(path.join(stage, 'package.json'), JSON.stringify({
  name: pkg.name, productName: pkg.productName, version: pkg.version, main: 'main.js', dependencies: pkg.dependencies,
}, null, 2));
cp.execSync('npm install --omit=dev --ignore-scripts --no-audit --no-fund', { cwd: stage, stdio: 'inherit' });

// toglie da node_modules ciò che non serve a runtime (mappe, tipi, build per browser)
(function prune(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      prune(p);
    } else if (/\.(map|ts)$/.test(e.name)) fs.rmSync(p, { force: true });
  }
})(path.join(stage, 'node_modules'));

const file = `update-${pkg.version}.asar`;
asar.createPackage(stage, path.join(out, file)).then(() => {
  const sha256 = crypto.createHash('sha256').update(fs.readFileSync(path.join(out, file))).digest('hex');
  fs.writeFileSync(path.join(out, 'update.json'), JSON.stringify({ version: pkg.version, shell: SHELL, file, sha256 }));
  fs.rmSync(stage, { recursive: true, force: true });
  console.log('Aggiornamento creato:', file, (fs.statSync(path.join(out, file)).size / 1048576).toFixed(1) + ' MB');
});
