const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  getAssets: () => ipcRenderer.invoke('get-assets'),
  exportFile: (payload) => ipcRenderer.invoke('export', payload),
  docBuild: (id, cfg) => ipcRenderer.invoke('doc-build', { id, cfg }),
  docExport: (id, cfg) => ipcRenderer.invoke('doc-export', { id, cfg }),
  printImages: (images, landscape) => ipcRenderer.invoke('print-images', { images, landscape }),
  printPoster: (config) => ipcRenderer.invoke('print-poster', { config }),
  getVersion: () => ipcRenderer.invoke('get-version'),
  restartApp: () => ipcRenderer.invoke('restart-app'),
  openExternal: (u) => ipcRenderer.invoke('open-external', u),
  onUpdateReady: (cb) => ipcRenderer.on('update-ready', (_e, p) => cb(p)),
  onUpdateFull: (cb) => ipcRenderer.on('update-full', (_e, p) => cb(p)),
  reveal: (p) => ipcRenderer.invoke('reveal', p),
});
