// PDF Text Rendering Utility

import type { PDFPage, PDFFont, RGB } from 'pdf-lib';
import type { TextItem } from '../types/pdfTypes';
import { PDF_COLORS } from '../../../config/pdfTemplateConstants';

/**
 * Handles text rendering operations on PDF pages
 */
export class PdfTextRenderer {
  private page: PDFPage;
  private font: PDFFont;
  private defaultColor: RGB;

  constructor(page: PDFPage, font: PDFFont, defaultColor: RGB = PDF_COLORS.black) {
    this.page = page;
    this.font = font;
    this.defaultColor = defaultColor;
  }

  /**
   * Draws a single text item on the PDF page
   */
  drawText(item: TextItem, color: RGB = this.defaultColor): void {
    this.page.drawText(item.texto, {
      x: item.x,
      y: item.y,
      font: this.font,
      size: item.size,
      color: color,
    });
  }

  /**
   * Draws multiple text items in batch
   */
  drawTextBatch(items: TextItem[], color: RGB = this.defaultColor): void {
    items.forEach(item => this.drawText(item, color));
  }

  /**
   * Draws a grid/table of numbers
   */
  drawTable(
    startX: number,
    startY: number,
    cellWidth: number,
    lineHeight: number,
    fontSize: number,
    data: Array<{ values: (number | string)[]; y?: number }>,
    color: RGB = this.defaultColor
  ): void {
    let currentY = startY;

    data.forEach((row) => {
      const rowY = row.y !== undefined ? row.y : currentY;

      row.values.forEach((value, colIndex) => {
        this.page.drawText(`${value}`, {
          x: startX + (colIndex * cellWidth),
          y: rowY,
          font: this.font,
          size: fontSize,
          color: color,
        });
      });

      if (row.y === undefined) {
        currentY -= lineHeight;
      }
    });
  }
}
