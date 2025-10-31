// Global type declarations for Electron preload API

interface Window {
  api: {
    savePdf: (pdfBytes: Uint8Array, filename: string) => Promise<{
      success: boolean;
      filePath?: string;
      error?: string;
    }>;
    openPdf: (filePath: string) => Promise<{
      success: boolean;
      error?: string;
    }>;
    showConfirmDialog: (title: string, message: string, detail?: string) => Promise<{
      success: boolean;
      confirmed: boolean;
      error?: string;
    }>;
  };
  clearElectoralData?: () => Promise<void>;
  debugElectoralData?: () => Promise<void>;
}

// Asset and resource imports
declare module '*?asset' {
  const value: string;
  export default value;
}

declare module '*?url' {
  const value: string;
  export default value;
}
