const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  getAssets: () => ipcRenderer.invoke('get-assets'),
  exportFile: (payload) => ipcRenderer.invoke('export', payload),
  docBuild: (id, cfg) => ipcRenderer.invoke('doc-build', { id, cfg }),
  docExport: (id, cfg) => ipcRenderer.invoke('doc-export', { id, cfg }),
  printImages: (images, landscape) => ipcRenderer.invoke('print-images', { images, landscape }),
  printPoster: (config) => ipcRenderer.invoke('print-poster', { config }),
  reveal: (p) => ipcRenderer.invoke('reveal', p),
});
