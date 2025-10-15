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
}

export class ConformidadDocumentService {
  /**
   * Get current date and time formatted for the document
   */
  private static getCurrentDateTime(): { currentTime: string; currentDay: string; currentMonth: string } {
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

    return { currentTime, currentDay, currentMonth };
  }

  /**
   * Generate a filled Word document from the template
   */
  static async generateConformidadDocument(data: Omit<ConformidadData, 'currentTime' | 'currentDay' | 'currentMonth'>): Promise<Blob> {
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
   * Download PDF
   */
  static downloadPdf(pdfBytes: Uint8Array, filename: string = 'Conformidad_sobre_lacrado.pdf'): void {
    try {
      // Create a blob from PDF bytes
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  }

  /**
   * Generate and download conformidad PDF in one step
   */
  static async generateAndDownload(
    data: Omit<ConformidadData, 'currentTime' | 'currentDay' | 'currentMonth'>,
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
        throw new Error(result.error || 'Failed to convert DOCX to PDF');
      }

      // Convert array back to Uint8Array
      const pdfBytes = new Uint8Array(result.pdfBytes);
      console.log('[ConformidadDocumentService] PDF bytes received, size:', pdfBytes.length);

      // Download the PDF
      console.log('[ConformidadDocumentService] Downloading PDF...');
      this.downloadPdf(pdfBytes, pdfFilename);
      console.log('[ConformidadDocumentService] Download complete');
    } catch (error) {
      console.error('[ConformidadDocumentService] Error in generateAndDownload:', error);
      throw error;
    }
  }
}
