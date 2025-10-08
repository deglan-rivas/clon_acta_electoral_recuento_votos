// PDF save and open service with Electron API integration

import { ToastService } from "../ui/toastService";

export interface PdfSaveResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

/**
 * Saves PDF using Electron API or falls back to browser download
 * Automatically opens the PDF after saving
 */
export async function savePdfWithFallback(
  pdfBytes: Uint8Array,
  filename: string
): Promise<PdfSaveResult> {
  try {
    // Check if Electron API is available
    if (window.api && typeof window.api.savePdf === 'function') {
      // Use Electron API to save PDF to desktop
      const saveResult = await window.api.savePdf(pdfBytes, filename);

      if (saveResult.success && saveResult.filePath) {
        console.log("PDF guardado exitosamente en:", saveResult.filePath);

        ToastService.success(`PDF guardado en el escritorio: ${filename}`);

        // Automatically open the PDF
        const openResult = await window.api.openPdf(saveResult.filePath);

        if (openResult.success) {
          console.log("PDF abierto exitosamente");
        } else {
          console.error("Error al abrir PDF:", openResult.error);
          ToastService.error("PDF guardado pero no se pudo abrir automáticamente");
        }

        return { success: true, filePath: saveResult.filePath };
      } else {
        console.error("Error al guardar PDF:", saveResult.error);
        ToastService.error("Error al guardar el PDF");
        return { success: false, error: saveResult.error };
      }
    } else {
      // Fallback to browser download for web version
      const blob = new Blob([pdfBytes.slice()], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log("PDF generado y descarga iniciada (modo web).");

      ToastService.success(`PDF descargado: ${filename}`);

      return { success: true };
    }
  } catch (error) {
    console.error("Error en savePdfWithFallback:", error);
    ToastService.error("Error al guardar el PDF");
    return { success: false, error: String(error) };
  }
}

/**
 * Opens a PDF file using the system default PDF viewer (Electron only)
 */
export async function openPdfFile(filePath: string): Promise<PdfSaveResult> {
  if (window.api && typeof window.api.openPdf === 'function') {
    const result = await window.api.openPdf(filePath);
    return result;
  }
  return { success: false, error: "Electron API not available" };
}
