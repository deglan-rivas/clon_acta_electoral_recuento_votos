import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

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
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}