const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  getAssets: () => ipcRenderer.invoke('get-assets'),
  exportFile: (payload) => ipcRenderer.invoke('export', payload),
  reveal: (p) => ipcRenderer.invoke('reveal', p),
});
