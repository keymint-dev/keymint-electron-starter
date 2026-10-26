import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('licenseAPI', {
  activate: (key: string) => ipcRenderer.invoke('license:activate', key),
  importOffline: (contents: string) => ipcRenderer.invoke('license:importOffline', contents),
  getStatus: () => ipcRenderer.invoke('license:getStatus'),
  deactivate: () => ipcRenderer.invoke('license:deactivate'),
});
