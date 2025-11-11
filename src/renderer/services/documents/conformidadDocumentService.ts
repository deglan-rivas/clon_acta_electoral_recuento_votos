// Service for generating Conformidad documents from Word template
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

// Import template file using Vite's ?url syntax for proper path resolution
import templateFile from '/FormatoConformidad.docx?url';

export interface ConformidadData {
  jee: string;
  mesaNumber: string;
  departamento: string;
  provincia: string;
  distrito: string;
  ciudad: string;
  currentTime: string;
  currentDay: string;
  currentMonth: string;
  currentYear: string;
  // JEE Presidente fields
  PRESIDENTE_NOMBRES: string;
  PRESIDENTE_APELLIDOPATERNO: string;
  PRESIDENTE_APELLIDOMATERNO: string;
  // JEE Segundo Miembro fields
  SEGUNDO_MIEMBRO_NOMBRES: string;
  SEGUNDO_MIEMBRO_APELLIDOPATERNO: string;
  SEGUNDO_MIEMBRO_APELLIDOMATERNO: string;
  // JEE Tercer Miembro fields
  TERCER_MIEMBRO_NOMBRES: string;
  TERCER_MIEMBRO_APELLIDOPATERNO: string;
  TERCER_MIEMBRO_APELLIDOMATERNO: string;
}

export class ConformidadDocumentService {
  /**
   * Get current date and time formatted for the document
   */
  private static getCurrentDateTime(): { currentTime: string; currentDay: string; currentMonth: string; currentYear: string } {
    const now = new Date();

    // Format time in 24-hour format (HH:MM)
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;

    // Get day
    const currentDay = now.getDate().toString();

    // Get month in Spanish
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const currentMonth = months[now.getMonth()];

    // Get year
    const currentYear = now.getFullYear().toString();

    return { currentTime, currentDay, currentMonth, currentYear };
  }

  /**
   * Generate a filled Word document from the template
   */
  static async generateConformidadDocument(data: Omit<ConformidadData, 'currentTime' | 'currentDay' | 'currentMonth' | 'currentYear'>): Promise<Blob> {
    try {
      // Add current date/time to data
      const dateTime = this.getCurrentDateTime();
      const completeData: ConformidadData = {
        ...data,
        ...dateTime
      };

      // Fetch the template file using Vite-resolved path
      console.log('[ConformidadDocumentService] Fetching template from:', templateFile);

      const response = await fetch(templateFile);

      if (!response.ok) {
        console.error('[ConformidadDocumentService] Failed to fetch template:', response.status, response.statusText);
        throw new Error(`Failed to fetch template: ${response.status} ${response.statusText}`);
      }

      console.log('[ConformidadDocumentService] Template fetched successfully, size:', response.headers.get('content-length'));
      const templateArrayBuffer = await response.arrayBuffer();
      console.log('[ConformidadDocumentService] Template loaded, size:', templateArrayBuffer.byteLength);

      // Load the template with PizZip
      const zip = new PizZip(templateArrayBuffer);

      // Create docxtemplater instance
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // Set the template variables
      doc.setData(completeData);

      try {
        // Render the document (replace template variables with actual data)
        doc.render();
      } catch (error: any) {
        console.error('Error rendering template:', error);
        throw new Error(`Template rendering error: ${error.message}`);
      }

      // Generate the document as a blob
      const out = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      return out;
    } catch (error) {
      console.error('Error generating conformidad document:', error);
      throw error;
    }
  }

  /**
   * Open PDF directly using Electron API or browser fallback
   * Similar to how "Ver Acta" opens PDFs
   */
  static async openPdf(pdfBytes: Uint8Array, filename: string = 'Conformidad_sobre_lacrado.pdf'): Promise<void> {
    try {
      // Check if Electron API is available
      if (window.api && typeof window.api.savePdf === 'function') {
        // Use Electron API to save PDF to desktop
        const saveResult = await window.api.savePdf(pdfBytes, filename);

        if (saveResult.success && saveResult.filePath) {
          console.log('[ConformidadDocumentService] PDF guardado exitosamente en:', saveResult.filePath);

          // Automatically open the PDF
          const openResult = await window.api.openPdf(saveResult.filePath);

          if (openResult.success) {
            console.log('[ConformidadDocumentService] PDF abierto exitosamente');
          } else {
            console.error('[ConformidadDocumentService] Error al abrir PDF:', openResult.error);
            throw new Error('PDF guardado pero no se pudo abrir automáticamente');
          }
        } else {
          console.error('[ConformidadDocumentService] Error al guardar PDF:', saveResult.error);
          throw new Error(saveResult.error || 'Error al guardar el PDF');
        }
      } else {
        // Fallback to browser - open in new tab instead of download
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        // Open in new tab
        const newWindow = window.open(url, '_blank');

        if (!newWindow) {
          console.warn('[ConformidadDocumentService] Could not open new window, falling back to download');
          // Fallback to download if popup was blocked
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        // Cleanup URL after a delay to ensure it's been loaded
        setTimeout(() => URL.revokeObjectURL(url), 1000);

        console.log('[ConformidadDocumentService] PDF abierto en nueva pestaña (modo web)');
      }
    } catch (error) {
      console.error('[ConformidadDocumentService] Error opening PDF:', error);
      throw error;
    }
  }

  /**
   * Generate and open conformidad PDF directly (like "Ver Acta" button)
   */
  static async generateAndDownload(
    data: Omit<ConformidadData, 'currentTime' | 'currentDay' | 'currentMonth' | 'currentYear'>,
    filename?: string
  ): Promise<void> {
    try {
      console.log('[ConformidadDocumentService] Starting generateAndDownload with data:', data);

      // Generate DOCX first
      console.log('[ConformidadDocumentService] Generating DOCX document...');
      const docxBlob = await this.generateConformidadDocument(data);
      console.log('[ConformidadDocumentService] DOCX generated, size:', docxBlob.size);

      // Convert blob to Uint8Array
      const docxArrayBuffer = await docxBlob.arrayBuffer();
      const docxBytes = new Uint8Array(docxArrayBuffer);
      console.log('[ConformidadDocumentService] DOCX converted to Uint8Array, size:', docxBytes.length);

      // Prepare filename
      const docxFilename = filename || 'Conformidad_sobre_lacrado.docx';
      const pdfFilename = docxFilename.replace(/\.docx$/i, '.pdf');
      console.log('[ConformidadDocumentService] Converting to PDF, filename:', pdfFilename);

      // Convert DOCX to PDF using IPC
      // @ts-ignore - window.api is defined in preload
      const result = await window.api.convertDocxToPdf(docxBytes, docxFilename);
      console.log('[ConformidadDocumentService] Conversion result:', result.success ? 'Success' : 'Failed', result.error || '');

      if (!result.success || !result.pdfBytes) {
        // Check for specific error types to show user-friendly messages
        if (result.error === 'OFFICE_NOT_INSTALLED') {
          throw new Error('Microsoft Office Word no está instalado en este equipo. Por favor, instale Microsoft Office para generar el formato de conformidad en PDF.');
        }
        throw new Error(result.error || 'Failed to convert DOCX to PDF');
      }

      // Convert array back to Uint8Array
      const pdfBytes = new Uint8Array(result.pdfBytes);
      console.log('[ConformidadDocumentService] PDF bytes received, size:', pdfBytes.length);

      // Open the PDF directly (like "Ver Acta")
      console.log('[ConformidadDocumentService] Opening PDF...');
      await this.openPdf(pdfBytes, pdfFilename);
      console.log('[ConformidadDocumentService] PDF opened successfully');
    } catch (error) {
      console.error('[ConformidadDocumentService] Error in generateAndDownload:', error);
      throw error;
    }
  }
}
