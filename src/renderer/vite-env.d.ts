/// <reference types="vite/client" />

interface ElectronAPI {
  savePdf: (pdfBytes: Uint8Array, filename: string) => Promise<{ success: boolean; filePath?: string; error?: string }>
  openPdf: (filePath: string) => Promise<{ success: boolean; error?: string }>
  log: {
    info: (message: string, ...args: any[]) => void
    warn: (message: string, ...args: any[]) => void
    error: (message: string, ...args: any[]) => void
    debug: (message: string, ...args: any[]) => void
  }
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
