/**
 * LocalFarm Professional PDF Document Engine
 * Zero-dependency, standards-compliant PDF 1.4 vector generator.
 * Designed for high-elegance executive reports, audit logs, and compliance records.
 */

// Standard Helvetica Font Widths (1/1000 of em)
const HELVETICA_WIDTHS: Record<number, number> = {
  32: 278, 33: 278, 34: 355, 35: 556, 36: 556, 37: 889, 38: 667, 39: 191,
  40: 333, 41: 333, 42: 389, 43: 584, 44: 278, 45: 333, 46: 278, 47: 278,
  48: 556, 49: 556, 50: 556, 51: 556, 52: 556, 53: 556, 54: 556, 55: 556,
  56: 556, 57: 556, 58: 278, 59: 278, 60: 584, 61: 584, 62: 584, 63: 556,
  64: 1015, 65: 667, 66: 667, 67: 722, 68: 722, 69: 667, 70: 611, 71: 778,
  72: 722, 73: 278, 74: 500, 75: 667, 76: 556, 77: 833, 78: 722, 79: 778,
  80: 667, 81: 778, 82: 722, 83: 667, 84: 611, 85: 722, 86: 667, 87: 944,
  88: 667, 89: 667, 90: 611, 91: 278, 92: 278, 93: 278, 94: 469, 95: 556,
  96: 333, 97: 556, 98: 556, 99: 500, 100: 556, 101: 556, 102: 278, 103: 556,
  104: 556, 105: 222, 106: 222, 107: 500, 108: 222, 109: 833, 110: 556, 111: 556,
  112: 556, 113: 556, 114: 333, 115: 500, 116: 278, 117: 556, 118: 500, 119: 722,
  120: 500, 121: 500, 122: 500, 123: 334, 124: 260, 125: 334, 126: 584
};

export type RGB = [number, number, number];

export interface ColumnDef {
  header: string;
  width: number;
  align?: 'left' | 'center' | 'right';
}

export interface TableCell {
  text: string;
  color?: RGB;
  badge?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  bold?: boolean;
}

export interface KpiCard {
  label: string;
  value: string;
  subtitle?: string;
  color?: RGB;
}

export interface PdfReportOptions {
  title: string;
  subtitle: string;
  department?: string;
  documentRef?: string;
  adminEmail?: string;
  orientation?: 'landscape' | 'portrait';
  kpis?: KpiCard[];
  columns: ColumnDef[];
  rows: (TableCell | string)[][];
}

export class PdfDocument {
  private width: number;
  private height: number;
  private pagesOps: string[][] = [];
  private currentOps: string[] = [];

  constructor(orientation: 'landscape' | 'portrait' = 'landscape') {
    if (orientation === 'landscape') {
      this.width = 841.89; // A4 Landscape
      this.height = 595.28;
    } else {
      this.width = 595.28; // A4 Portrait
      this.height = 841.89;
    }
  }

  public get pageWidth(): number {
    return this.width;
  }

  public get pageHeight(): number {
    return this.height;
  }

  public get pageCount(): number {
    return this.pagesOps.length + (this.currentOps.length > 0 ? 1 : 0);
  }

  public newPage(): void {
    if (this.currentOps.length > 0) {
      this.pagesOps.push([...this.currentOps]);
      this.currentOps = [];
    }
  }

  public escapePdfString(str: string): string {
    if (!str) return '';
    const clean = str
      .replace(/[₱]/g, 'PHP ')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[–—]/g, '-')
      .replace(/[\r\n\t]/g, ' ')
      .replace(/[^\x20-\x7E]/g, '');

    return clean
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }

  public measureTextWidth(text: string, size: number, bold = false): number {
    let units = 0;
    const factor = bold ? 1.05 : 1.0;
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      const w = HELVETICA_WIDTHS[code] || 500;
      units += w * factor;
    }
    return (units * size) / 1000;
  }

  public fitText(text: string, maxWidth: number, size: number, bold = false): string {
    if (this.measureTextWidth(text, size, bold) <= maxWidth) {
      return text;
    }
    let truncated = text;
    while (truncated.length > 0 && this.measureTextWidth(truncated + '...', size, bold) > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    return truncated ? truncated + '...' : '';
  }

  public drawRect(
    x: number,
    y: number,
    w: number,
    h: number,
    opts: { fill?: RGB; stroke?: RGB; lineWidth?: number } = {}
  ): void {
    const ops: string[] = ['q'];
    if (opts.lineWidth) {
      ops.push(`${opts.lineWidth.toFixed(2)} w`);
    }
    if (opts.stroke) {
      ops.push(`${opts.stroke[0].toFixed(3)} ${opts.stroke[1].toFixed(3)} ${opts.stroke[2].toFixed(3)} RG`);
    }
    if (opts.fill) {
      ops.push(`${opts.fill[0].toFixed(3)} ${opts.fill[1].toFixed(3)} ${opts.fill[2].toFixed(3)} rg`);
    }

    ops.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re`);

    if (opts.fill && opts.stroke) {
      ops.push('B');
    } else if (opts.fill) {
      ops.push('f');
    } else if (opts.stroke) {
      ops.push('S');
    } else {
      ops.push('n');
    }
    ops.push('Q');
    this.currentOps.push(ops.join(' '));
  }

  public drawLine(x1: number, y1: number, x2: number, y2: number, color: RGB = [0.8, 0.8, 0.8], lineWidth = 0.75): void {
    const ops = [
      'q',
      `${lineWidth.toFixed(2)} w`,
      `${color[0].toFixed(3)} ${color[1].toFixed(3)} ${color[2].toFixed(3)} RG`,
      `${x1.toFixed(2)} ${y1.toFixed(2)} m`,
      `${x2.toFixed(2)} ${y2.toFixed(2)} l`,
      'S',
      'Q'
    ];
    this.currentOps.push(ops.join(' '));
  }

  public drawText(
    text: string,
    x: number,
    y: number,
    opts: {
      font?: 'F1' | 'F2' | 'F3';
      size?: number;
      color?: RGB;
      align?: 'left' | 'center' | 'right';
      maxWidth?: number;
    } = {}
  ): void {
    const font = opts.font || 'F1';
    const size = opts.size || 10;
    const color = opts.color || [0.1, 0.1, 0.1];
    const align = opts.align || 'left';
    const isBold = font === 'F2';

    let renderText = text;
    if (opts.maxWidth && opts.maxWidth > 0) {
      renderText = this.fitText(renderText, opts.maxWidth, size, isBold);
    }

    const textWidth = this.measureTextWidth(renderText, size, isBold);
    let startX = x;
    if (align === 'center') {
      startX = x - textWidth / 2;
    } else if (align === 'right') {
      startX = x - textWidth;
    }

    const escaped = this.escapePdfString(renderText);
    const ops = [
      'BT',
      `/${font} ${size.toFixed(2)} Tf`,
      `${color[0].toFixed(3)} ${color[1].toFixed(3)} ${color[2].toFixed(3)} rg`,
      `1 0 0 1 ${startX.toFixed(2)} ${y.toFixed(2)} Tm`,
      `(${escaped}) Tj`,
      'ET'
    ];
    this.currentOps.push(ops.join(' '));
  }

  public drawBadge(
    text: string,
    x: number,
    y: number,
    type: 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'neutral',
    align: 'left' | 'center' | 'right' = 'left'
  ): void {
    const size = 7;
    const cleanText = text.toUpperCase();
    const textW = this.measureTextWidth(cleanText, size, true);
    const padX = 5;
    const badgeW = textW + padX * 2;
    const badgeH = 13;

    let badgeX = x;
    if (align === 'center') badgeX = x - badgeW / 2;
    if (align === 'right') badgeX = x - badgeW;

    let fill: RGB;
    let stroke: RGB;
    let textCol: RGB;

    switch (type) {
      case 'success':
        fill = [0.93, 0.98, 0.95]; // emerald-50
        stroke = [0.68, 0.88, 0.74];
        textCol = [0.08, 0.42, 0.22]; // dark green
        break;
      case 'warning':
        fill = [0.99, 0.96, 0.89]; // amber-50
        stroke = [0.94, 0.84, 0.58];
        textCol = [0.65, 0.35, 0.05]; // dark amber
        break;
      case 'danger':
        fill = [0.99, 0.93, 0.93]; // rose-50
        stroke = [0.96, 0.70, 0.70];
        textCol = [0.75, 0.12, 0.15]; // dark red
        break;
      case 'info':
        fill = [0.93, 0.96, 0.99]; // sky-50
        stroke = [0.70, 0.84, 0.95];
        textCol = [0.08, 0.35, 0.65]; // dark blue
        break;
      default:
        fill = [0.95, 0.96, 0.97]; // slate-100
        stroke = [0.85, 0.87, 0.90];
        textCol = [0.30, 0.35, 0.42]; // slate-700
    }

    this.drawRect(badgeX, y - 2, badgeW, badgeH, { fill, stroke, lineWidth: 0.5 });
    this.drawText(cleanText, badgeX + padX, y + 1.5, {
      font: 'F2',
      size,
      color: textCol,
      align: 'left'
    });
  }

  /**
   * Finalize all pages and inject standard footers on every page
   */
  public finalizeWithFooters(options: { docRef?: string } = {}): void {
    if (this.currentOps.length > 0) {
      this.pagesOps.push([...this.currentOps]);
      this.currentOps = [];
    }

    const totalPages = this.pagesOps.length;
    const marginX = 36;
    const marginBottom = 28;
    const usableWidth = this.width - marginX * 2;
    const docRef = options.docRef || 'LF-OFFICIAL';

    for (let i = 0; i < totalPages; i++) {
      const ops = this.pagesOps[i];
      const pageNum = i + 1;

      // Divider Line
      const divLine = [
        'q',
        '0.50 w',
        '0.880 0.900 0.920 RG',
        `${marginX.toFixed(2)} ${(marginBottom + 12).toFixed(2)} m`,
        `${(marginX + usableWidth).toFixed(2)} ${(marginBottom + 12).toFixed(2)} l`,
        'S',
        'Q'
      ].join(' ');

      // Left Confidential Notice
      const leftText = `CONFIDENTIAL & OFFICIAL LOCALFARM AUDIT REPORT  •  SECURITY CLASSIFICATION: LEVEL-1 RESTRICTED  •  REF: ${docRef}`;
      const escapedLeft = this.escapePdfString(leftText);
      const leftOps = [
        'BT',
        '/F1 6.50 Tf',
        '0.480 0.520 0.580 rg',
        `1 0 0 1 ${marginX.toFixed(2)} ${marginBottom.toFixed(2)} Tm`,
        `(${escapedLeft}) Tj`,
        'ET'
      ].join(' ');

      // Right Page Number
      const rightText = `PAGE ${pageNum} OF ${totalPages}`;
      const escapedRight = this.escapePdfString(rightText);
      const rightW = this.measureTextWidth(rightText, 7, true);
      const rightX = marginX + usableWidth - rightW;
      const rightOps = [
        'BT',
        '/F2 7.00 Tf',
        '0.250 0.300 0.360 rg',
        `1 0 0 1 ${rightX.toFixed(2)} ${marginBottom.toFixed(2)} Tm`,
        `(${escapedRight}) Tj`,
        'ET'
      ].join(' ');

      ops.push(divLine, leftOps, rightOps);
    }
  }

  public toBuffer(): Buffer {
    if (this.currentOps.length > 0) {
      this.pagesOps.push([...this.currentOps]);
      this.currentOps = [];
    }

    const totalPages = Math.max(1, this.pagesOps.length);
    const chunks: string[] = [];
    const offsets: number[] = [];

    // Header
    const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    chunks.push(header);
    let currentOffset = Buffer.byteLength(header, 'latin1');

    // Obj 1: Catalog
    offsets[1] = currentOffset;
    const catalog = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
    chunks.push(catalog);
    currentOffset += Buffer.byteLength(catalog, 'latin1');

    // Obj 3: Font Helvetica
    offsets[3] = currentOffset;
    const font1 = `3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n`;
    chunks.push(font1);
    currentOffset += Buffer.byteLength(font1, 'latin1');

    // Obj 4: Font Helvetica-Bold
    offsets[4] = currentOffset;
    const font2 = `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n`;
    chunks.push(font2);
    currentOffset += Buffer.byteLength(font2, 'latin1');

    // Obj 5: Font Helvetica-Oblique
    offsets[5] = currentOffset;
    const font3 = `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>\nendobj\n`;
    chunks.push(font3);
    currentOffset += Buffer.byteLength(font3, 'latin1');

    // Page IDs: 6, 8, 10, ...
    // Stream IDs: 7, 9, 11, ...
    const pageObjIds: number[] = [];
    for (let i = 0; i < totalPages; i++) {
      pageObjIds.push(6 + i * 2);
    }

    // Obj 2: Pages root
    offsets[2] = currentOffset;
    const kidsStr = pageObjIds.map((id) => `${id} 0 R`).join(' ');
    const pagesRoot = `2 0 obj\n<< /Type /Pages /Kids [${kidsStr}] /Count ${totalPages} >>\nendobj\n`;
    chunks.push(pagesRoot);
    currentOffset += Buffer.byteLength(pagesRoot, 'latin1');

    // Write Pages and Streams
    for (let i = 0; i < totalPages; i++) {
      const pageId = 6 + i * 2;
      const streamId = 7 + i * 2;
      const content = (this.pagesOps[i] || []).join('\n');
      const streamLen = Buffer.byteLength(content, 'latin1');

      // Page Object
      offsets[pageId] = currentOffset;
      const pageObj = `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.width.toFixed(2)} ${this.height.toFixed(2)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> /ProcSet [/PDF /Text] >> /Contents ${streamId} 0 R >>\nendobj\n`;
      chunks.push(pageObj);
      currentOffset += Buffer.byteLength(pageObj, 'latin1');

      // Stream Object
      offsets[streamId] = currentOffset;
      const streamObj = `${streamId} 0 obj\n<< /Length ${streamLen} >>\nstream\n${content}\nendstream\nendobj\n`;
      chunks.push(streamObj);
      currentOffset += Buffer.byteLength(streamObj, 'latin1');
    }

    // XRef Table (Standard 20-byte lines: 10 digits + space + 5 digits + space + n + space + \n)
    const startXref = currentOffset;
    const maxObjId = 7 + (totalPages - 1) * 2;
    let xref = `xref\n0 ${maxObjId + 1}\n0000000000 65535 f \n`;

    for (let id = 1; id <= maxObjId; id++) {
      const off = offsets[id] || 0;
      xref += `${off.toString().padStart(10, '0')} 00000 n \n`;
    }

    const trailer = `trailer\n<< /Size ${maxObjId + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
    chunks.push(xref);
    chunks.push(trailer);

    return Buffer.from(chunks.join(''), 'latin1');
  }
}

/**
 * Generate a complete, elegant, branded LocalFarm PDF Report
 */
export function buildLocalFarmPdfReport(opts: PdfReportOptions): Uint8Array {
  const orientation = opts.orientation || 'landscape';
  const doc = new PdfDocument(orientation);

  const marginX = 36;
  const marginTop = 34;
  const marginBottom = 46; // Space for footer
  const usableWidth = doc.pageWidth - marginX * 2;
  const pageHeight = doc.pageHeight;

  const totalRows = opts.rows.length;
  const dateFormatted = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const timeFormatted = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  const docRef = opts.documentRef || `LF-ADM-${Math.floor(100000 + Math.random() * 900000)}`;
  const adminEmail = opts.adminEmail || 'admin@localfarm.com';

  // Normalize column widths to fill usableWidth
  const totalSpecWidth = opts.columns.reduce((acc, col) => acc + col.width, 0);
  const scale = usableWidth / totalSpecWidth;
  const columns = opts.columns.map((c) => ({
    ...c,
    width: Math.round(c.width * scale * 10) / 10
  }));

  // Re-adjust last column width so sum strictly equals usableWidth
  const currentTotal = columns.reduce((acc, c) => acc + c.width, 0);
  const diff = usableWidth - currentTotal;
  columns[columns.length - 1].width += diff;

  let cursorY = pageHeight - marginTop;
  const rowHeight = 20;
  const headerHeight = 22;

  // Helper to draw executive top header
  function renderHeader(isFirstPage: boolean) {
    if (isFirstPage) {
      // 1. Top Accent Forest Green Stripe
      doc.drawRect(marginX, pageHeight - marginTop, usableWidth, 3.5, {
        fill: [0.106, 0.369, 0.125] // #1b5e20
      });

      // 2. Organization / Department Brand
      doc.drawText('LOCALFARM PHILIPPINES', marginX, pageHeight - marginTop - 16, {
        font: 'F2',
        size: 9.5,
        color: [0.106, 0.369, 0.125]
      });

      doc.drawText(
        opts.department ? ` • ${opts.department.toUpperCase()}` : ' • CENTRAL ADMINISTRATIVE PLATFORM',
        marginX + doc.measureTextWidth('LOCALFARM PHILIPPINES', 9.5, true) + 2,
        pageHeight - marginTop - 16,
        {
          font: 'F1',
          size: 9.5,
          color: [0.45, 0.50, 0.56]
        }
      );

      // 3. Document Title
      doc.drawText(opts.title.toUpperCase(), marginX, pageHeight - marginTop - 35, {
        font: 'F2',
        size: 15,
        color: [0.06, 0.09, 0.16] // slate-900
      });

      // 4. Subtitle
      doc.drawText(opts.subtitle, marginX, pageHeight - marginTop - 48, {
        font: 'F1',
        size: 8.5,
        color: [0.40, 0.45, 0.52]
      });

      // 5. Meta Box on Top Right
      const metaBoxW = 220;
      const metaBoxH = 46;
      const metaBoxX = doc.pageWidth - marginX - metaBoxW;
      const metaBoxY = pageHeight - marginTop - 50;

      doc.drawRect(metaBoxX, metaBoxY, metaBoxW, metaBoxH, {
        fill: [0.98, 0.985, 0.99],
        stroke: [0.88, 0.91, 0.94],
        lineWidth: 0.75
      });

      doc.drawText('DOCUMENT REF:', metaBoxX + 10, metaBoxY + 33, { font: 'F2', size: 7.5, color: [0.45, 0.50, 0.56] });
      doc.drawText(docRef, metaBoxX + 82, metaBoxY + 33, { font: 'F2', size: 7.5, color: [0.106, 0.369, 0.125] });

      doc.drawText('ISSUED DATE:', metaBoxX + 10, metaBoxY + 21, { font: 'F2', size: 7.5, color: [0.45, 0.50, 0.56] });
      doc.drawText(`${dateFormatted} at ${timeFormatted}`, metaBoxX + 82, metaBoxY + 21, { font: 'F1', size: 7.5, color: [0.15, 0.20, 0.26] });

      doc.drawText('GENERATED BY:', metaBoxX + 10, metaBoxY + 9, { font: 'F2', size: 7.5, color: [0.45, 0.50, 0.56] });
      doc.drawText(adminEmail, metaBoxX + 82, metaBoxY + 9, { font: 'F1', size: 7.5, color: [0.15, 0.20, 0.26], maxWidth: 130 });

      cursorY = pageHeight - marginTop - 64;

      // 6. Executive KPI Cards (if provided)
      if (opts.kpis && opts.kpis.length > 0) {
        const kpiCount = opts.kpis.length;
        const cardGap = 10;
        const totalGap = cardGap * (kpiCount - 1);
        const cardW = (usableWidth - totalGap) / kpiCount;
        const cardH = 38;

        const kpiY = cursorY - cardH;
        opts.kpis.forEach((kpi, idx) => {
          const cardX = marginX + idx * (cardW + cardGap);
          // Background
          doc.drawRect(cardX, kpiY, cardW, cardH, {
            fill: [0.985, 0.99, 0.995],
            stroke: [0.88, 0.91, 0.94],
            lineWidth: 0.65
          });

          // Left subtle accent pill
          doc.drawRect(cardX, kpiY, 3, cardH, {
            fill: kpi.color || [0.106, 0.369, 0.125]
          });

          // KPI Value
          doc.drawText(kpi.value, cardX + 10, kpiY + 21, {
            font: 'F2',
            size: 12,
            color: kpi.color || [0.06, 0.09, 0.16]
          });

          // KPI Label
          doc.drawText(kpi.label.toUpperCase(), cardX + 10, kpiY + 9.5, {
            font: 'F2',
            size: 6.8,
            color: [0.45, 0.50, 0.56]
          });

          // KPI Subtitle
          if (kpi.subtitle) {
            doc.drawText(kpi.subtitle, cardX + cardW - 8, kpiY + 9.5, {
              font: 'F1',
              size: 6.5,
              color: [0.55, 0.60, 0.66],
              align: 'right'
            });
          }
        });

        cursorY = kpiY - 12;
      }
    } else {
      // Continuation Header for Subsequent Pages
      doc.drawRect(marginX, pageHeight - marginTop, usableWidth, 2.5, {
        fill: [0.106, 0.369, 0.125]
      });

      doc.drawText(`LOCALFARM PLATFORM REPORT  •  ${opts.title.toUpperCase()} (CONTINUED)`, marginX, pageHeight - marginTop - 14, {
        font: 'F2',
        size: 8.5,
        color: [0.106, 0.369, 0.125]
      });

      doc.drawText(`Ref: ${docRef}  •  ${dateFormatted}`, doc.pageWidth - marginX, pageHeight - marginTop - 14, {
        font: 'F1',
        size: 8,
        color: [0.5, 0.55, 0.6],
        align: 'right'
      });

      doc.drawLine(marginX, pageHeight - marginTop - 18, doc.pageWidth - marginX, pageHeight - marginTop - 18, [0.88, 0.91, 0.94]);
      cursorY = pageHeight - marginTop - 26;
    }

    // Render Table Column Headers
    const tblHeadY = cursorY - headerHeight;
    doc.drawRect(marginX, tblHeadY, usableWidth, headerHeight, {
      fill: [0.106, 0.369, 0.125] // Forest green #1b5e20
    });

    let currentX = marginX;
    columns.forEach((col) => {
      let textX = currentX + 8;
      if (col.align === 'center') textX = currentX + col.width / 2;
      if (col.align === 'right') textX = currentX + col.width - 8;

      doc.drawText(col.header.toUpperCase(), textX, tblHeadY + 7, {
        font: 'F2',
        size: 7.5,
        color: [1, 1, 1], // Pure white
        align: col.align || 'left',
        maxWidth: col.width - 12
      });
      currentX += col.width;
    });

    cursorY = tblHeadY;
  }

  // Draw first page header
  renderHeader(true);

  // Render Rows
  opts.rows.forEach((row, rowIndex) => {
    // Check if new page is needed
    if (cursorY - rowHeight < marginBottom + 10) {
      doc.newPage();
      renderHeader(false);
    }

    const rowY = cursorY - rowHeight;
    const isEven = rowIndex % 2 === 0;

    // Alternating zebra background
    if (!isEven) {
      doc.drawRect(marginX, rowY, usableWidth, rowHeight, {
        fill: [0.976, 0.984, 0.98] // Clean soft organic tint
      });
    }

    // Subtle bottom border
    doc.drawLine(marginX, rowY, marginX + usableWidth, rowY, [0.90, 0.92, 0.94], 0.5);

    // Cell content
    let currentX = marginX;
    columns.forEach((col, colIdx) => {
      const rawCell = row[colIdx];
      let cellText = '';
      let cellBadge: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | undefined;
      let cellBold = false;
      let cellColor: RGB = [0.15, 0.19, 0.24];

      if (typeof rawCell === 'object' && rawCell !== null) {
        cellText = String(rawCell.text || '');
        cellBadge = rawCell.badge;
        cellBold = !!rawCell.bold;
        if (rawCell.color) cellColor = rawCell.color;
      } else {
        cellText = String(rawCell ?? '');
      }

      if (cellBadge) {
        let badgeCenterX = currentX + 8;
        if (col.align === 'center') badgeCenterX = currentX + col.width / 2;
        if (col.align === 'right') badgeCenterX = currentX + col.width - 8;

        doc.drawBadge(cellText, badgeCenterX, rowY + 4, cellBadge, col.align || 'left');
      } else {
        let textX = currentX + 8;
        if (col.align === 'center') textX = currentX + col.width / 2;
        if (col.align === 'right') textX = currentX + col.width - 8;

        doc.drawText(cellText, textX, rowY + 6, {
          font: cellBold ? 'F2' : 'F1',
          size: 7.5,
          color: cellColor,
          align: col.align || 'left',
          maxWidth: col.width - 16
        });
      }

      currentX += col.width;
    });

    cursorY = rowY;
  });

  // Table Outer Frame Line
  doc.drawLine(marginX, cursorY, marginX + usableWidth, cursorY, [0.75, 0.80, 0.85], 0.75);

  // Summary Row / Total Record Count
  const summaryY = cursorY - 14;
  doc.drawText(`RECORD COUNT: ${totalRows} REGISTERED AUDIT ENTRIES`, marginX, summaryY + 4, {
    font: 'F2',
    size: 7,
    color: [0.40, 0.45, 0.50]
  });

  // Finalize with Footers across every page
  doc.finalizeWithFooters({ docRef });

  return new Uint8Array(doc.toBuffer());
}
