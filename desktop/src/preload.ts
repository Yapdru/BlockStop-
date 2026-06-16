/**
 * Preload Script
 * Exposes safe IPC API to renderer process
 */

import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) =>
      ipcRenderer.invoke(channel, ...args),
    on: (channel: string, callback: (event: any, ...args: any[]) => void) =>
      ipcRenderer.on(channel, callback),
    off: (channel: string, callback: (event: any, ...args: any[]) => void) =>
      ipcRenderer.off(channel, callback),
    removeAllListeners: (channel: string) =>
      ipcRenderer.removeAllListeners(channel),
    send: (channel: string, ...args: any[]) =>
      ipcRenderer.send(channel, ...args),
  },
};

contextBridge.exposeInMainWorld('electron', electronAPI);

// Global type definitions
declare global {
  interface Window {
    electron: typeof electronAPI;
  }
}
