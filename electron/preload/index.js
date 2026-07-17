import { contextBridge, ipcRenderer } from 'electron';

const localPortArg = process.argv.find(arg => arg.startsWith('--local-server-port='));
const localPort = localPortArg ? parseInt(localPortArg.split('=')[1], 10) : 0;

contextBridge.exposeInMainWorld('electronAPI', {
  localServerPort: localPort,
  platform: {
    isElectron: true,
    platform: process.platform // 'darwin' or 'win32'
  },
  templates: {
    list: () => ipcRenderer.invoke('templates:list'),
    save: (template) => ipcRenderer.invoke('templates:save', template),
    delete: (id) => ipcRenderer.invoke('templates:delete', id),
    importFrame: () => ipcRenderer.invoke('templates:importFrame')
  },
  print: {
    printImage: (options) => ipcRenderer.invoke('print', options),
    convertToCmyk: (dataUrl) => ipcRenderer.invoke('image:convertToCmyk', dataUrl),
    getPrinters: () => ipcRenderer.invoke('print:getPrinters')
  },
  sync: {
    getState: () => ipcRenderer.invoke('sync:getState'),
    saveState: (state) => ipcRenderer.invoke('sync:saveState', state)
  },
  updater: {
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (_, info) => callback(info)),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (_, info) => callback(info)),
    onUpdateError: (callback) => ipcRenderer.on('update-error', (_, err) => callback(err)),
    installUpdate: () => ipcRenderer.invoke('updater:install')
  },
  editor: {
    setMenu: (isEditor) => ipcRenderer.invoke('editor:setMenu', isEditor),
    onAction: (callback) => {
      const handler = (_, action) => callback(action);
      ipcRenderer.on('editor:action', handler);
      return () => ipcRenderer.off('editor:action', handler);
    }
  }
});
