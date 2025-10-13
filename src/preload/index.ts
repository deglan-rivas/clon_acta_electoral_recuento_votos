import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import log from 'electron-log/renderer'

// Configure renderer logging
log.transports.ipc.level = 'info'

// Custom APIs for renderer
const api = {
  // Expose localStorage utilities for developer menu
  clearElectoralData: () => {
    // This will be implemented in the renderer
    return window.postMessage({ type: 'CLEAR_ELECTORAL_DATA' }, '*')
  },
  debugElectoralData: () => {
    // This will be implemented in the renderer
    return window.postMessage({ type: 'DEBUG_ELECTORAL_DATA' }, '*')
  },
  // PDF handling APIs
  savePdf: (pdfBytes: Uint8Array, filename: string): Promise<{ success: boolean; filePath?: string; error?: string }> => {
    return ipcRenderer.invoke('save-pdf', pdfBytes, filename)
  },
  openPdf: (filePath: string): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke('open-pdf', filePath)
  },
  // Trial expiration APIs
  checkExpiration: (): Promise<{
    success: boolean;
    status?: string;
    daysRemaining?: number;
    expirationDate?: string;
    message?: string;
    allowAccess?: boolean;
    error?: string;
  }> => {
    return ipcRenderer.invoke('check-expiration')
  },
  // Expose logging to renderer
  log: {
    info: (message: string, ...args: unknown[]) => log.info(message, ...args),
    warn: (message: string, ...args: unknown[]) => log.warn(message, ...args),
    error: (message: string, ...args: unknown[]) => log.error(message, ...args),
    debug: (message: string, ...args: unknown[]) => log.debug(message, ...args)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
console.log('Preload script executing...')
console.log('process.contextIsolated:', process.contextIsolated)
console.log('api object:', api)

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    console.log('APIs exposed successfully via contextBridge')
  } catch (error) {
    console.error('Error exposing APIs:', error)
    log.error('Failed to expose APIs to renderer:', error)
  }
} else {
  // @ts-expect-error - window.electron is defined in global.d.ts
  window.electron = electronAPI
  window.api = api
  console.log('APIs added to window object directly')
}