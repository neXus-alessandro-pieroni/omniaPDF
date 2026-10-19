const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  getAssets: () => ipcRenderer.invoke('get-assets'),
  exportFile: (payload) => ipcRenderer.invoke('export', payload),
  notaBuild: (cfg) => ipcRenderer.invoke('nota-build', cfg),
  notaExport: (cfg) => ipcRenderer.invoke('nota-export', cfg),
  reveal: (p) => ipcRenderer.invoke('reveal', p),
});
