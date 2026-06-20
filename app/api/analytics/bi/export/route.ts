/**
 * API Route: POST /api/analytics/bi/export
 * Exports analytics data in various formats (CSV, Excel, PDF)
 */

import { NextRequest, NextResponse } from 'next/server';

interface ExportRequest {
  format: 'csv' | 'excel' | 'pdf';
  data: any[];
  filename?: string;
  columns?: string[];
}

interface ExportResponse {
  success: boolean;
  message: string;
  fileUrl?: string;
  mimeType?: string;
  size?: number;
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data: any[], columns?: string[]): string {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  // Determine columns
  const cols =
    columns || (Object.keys(data[0] || {}) as string[]);

  // Create header row
  const headerRow = cols.map(col => `"${col}"`).join(',');

  // Create data rows
  const dataRows = data.map(row =>
    cols
      .map(col => {
        const value = row[col];
        if (value === null || value === undefined) return '';
        const stringValue = String(value).replace(/"/g, '""');
        return `"${stringValue}"`;
      })
      .join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Convert data to Excel format (XLSX)
 * Note: This is a simplified implementation. In production, use libraries like xlsx or exceljs
 */
function convertToExcel(data: any[], columns?: string[]): Buffer {
  try {
    // Create simple Excel XML structure
    const cols = columns || (Object.keys(data[0] || {}) as string[]);

    let excelContent = `<?xml version="1.0" encoding="UTF-8"?>
<ss:Workbook xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:html="http://www.w3.org/TR/REC-html40">
<ss:Worksheet ss:Name="Sheet1">
<ss:Table>`;

    // Add header row
    excelContent += '<ss:Row>';
    for (const col of cols) {
      excelContent += `<ss:Cell><ss:Data ss:Type="String">${col}</ss:Data></ss:Cell>`;
    }
    excelContent += '</ss:Row>';

    // Add data rows
    for (const row of data) {
      excelContent += '<ss:Row>';
      for (const col of cols) {
        const value = row[col] ?? '';
        const type = typeof value === 'number' ? 'Number' : 'String';
        excelContent += `<ss:Cell><ss:Data ss:Type="${type}">${value}</ss:Data></ss:Cell>`;
      }
      excelContent += '</ss:Row>';
    }

    excelContent += '</ss:Table></ss:Worksheet></ss:Workbook>';

    return Buffer.from(excelContent, 'utf-8');
  } catch (error) {
    console.error('Excel conversion error:', error);
    throw new Error('Failed to convert data to Excel format');
  }
}

/**
 * Convert data to PDF format
 * Note: This is a simplified implementation. In production, use libraries like pdfkit or html2pdf
 */
function convertToPDF(data: any[], columns?: string[]): Buffer {
  try {
    // Create simple PDF structure
    const cols = columns || (Object.keys(data[0] || {}) as string[]);

    let pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/MediaBox [0 0 612 792]
/Contents 5 0 R
>>
endobj
4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
5 0 obj
<<
/Length ${100 + data.length * 20}
>>
stream
BT
/F1 12 Tf
50 750 Td
(Analytics Export) Tj
0 -20 Td
`;

    // Add header
    for (const col of cols) {
      pdfContent += `(${col}) Tj
15 0 Td
`;
    }

    pdfContent += '0 -20 Td\n';

    // Add data rows (simplified)
    for (const row of data.slice(0, 50)) {
      for (const col of cols) {
        const value = row[col] ?? '';
        pdfContent += `(${String(value).substring(0, 20)}) Tj
15 0 Td
`;
      }
      pdfContent += '0 -20 Td\n';
    }

    pdfContent += `ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000244 00000 n
0000000333 00000 n
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
500
%%EOF`;

    return Buffer.from(pdfContent, 'utf-8');
  } catch (error) {
    console.error('PDF conversion error:', error);
    throw new Error('Failed to convert data to PDF format');
  }
}

/**
 * POST /api/analytics/bi/export
 * Export analytics data in requested format
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as ExportRequest;

    // Validate request
    if (!body.format || !['csv', 'excel', 'pdf'].includes(body.format)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid format. Use csv, excel, or pdf.',
        } as ExportResponse,
        { status: 400 }
      );
    }

    if (!Array.isArray(body.data)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Data must be an array',
        } as ExportResponse,
        { status: 400 }
      );
    }

    if (body.data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Data array cannot be empty',
        } as ExportResponse,
        { status: 400 }
      );
    }

    const filename =
      body.filename || `export_${Date.now()}`;
    const columns = body.columns;

    let fileContent: Buffer | string;
    let mimeType: string;
    let fileExtension: string;

    // Convert based on format
    switch (body.format) {
      case 'csv':
        fileContent = convertToCSV(body.data, columns);
        mimeType = 'text/csv';
        fileExtension = 'csv';
        break;

      case 'excel':
        fileContent = convertToExcel(body.data, columns);
        mimeType =
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileExtension = 'xlsx';
        break;

      case 'pdf':
        fileContent = convertToPDF(body.data, columns);
        mimeType = 'application/pdf';
        fileExtension = 'pdf';
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            message: 'Unsupported format',
          } as ExportResponse,
          { status: 400 }
        );
    }

    // Create response with file download
    const responseHeaders = new Headers({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}.${fileExtension}"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });

    if (typeof fileContent === 'string') {
      return new NextResponse(fileContent, {
        headers: responseHeaders,
      });
    } else {
      return new NextResponse(fileContent, {
        headers: responseHeaders,
      });
    }
  } catch (error) {
    console.error('Export error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        message: `Export failed: ${errorMessage}`,
      } as ExportResponse,
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/bi/export
 * Get export format options and requirements
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    return NextResponse.json({
      success: true,
      message: 'Export formats available',
      formats: [
        {
          name: 'csv',
          description: 'Comma-separated values',
          mimeType: 'text/csv',
          extension: 'csv',
        },
        {
          name: 'excel',
          description: 'Microsoft Excel format',
          mimeType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          extension: 'xlsx',
        },
        {
          name: 'pdf',
          description: 'Portable Document Format',
          mimeType: 'application/pdf',
          extension: 'pdf',
        },
      ],
      example: {
        format: 'csv',
        data: [
          { id: 1, name: 'Item 1', value: 100 },
          { id: 2, name: 'Item 2', value: 200 },
        ],
        filename: 'my_export',
        columns: ['id', 'name', 'value'],
      },
    });
  } catch (error) {
    console.error('Get formats error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get export formats',
      },
      { status: 500 }
    );
  }
}
