import { KBDocument, Playbook, Runbook, Procedure } from './types';
import { KB_CONFIG, ERROR_MESSAGES } from './constants';

export interface ExportFormat {
  format: 'json' | 'markdown' | 'csv' | 'html';
  includeVersionHistory: boolean;
  includeMetadata: boolean;
  includeAccessControl: boolean;
  prettyPrint: boolean;
}

export interface ExportResult {
  filename: string;
  format: string;
  size: number;
  documentCount: number;
  createdAt: Date;
  content: string;
}

export class ExportManager {
  private exportHistory: ExportResult[] = [];

  async exportDocuments(
    documents: KBDocument[],
    format: ExportFormat
  ): Promise<ExportResult> {
    if (documents.length > KB_CONFIG.EXPORT_MAX_DOCUMENTS) {
      throw new Error(`Export limit exceeded: ${KB_CONFIG.EXPORT_MAX_DOCUMENTS} documents max`);
    }

    let content: string;

    switch (format.format) {
      case 'json':
        content = this.exportAsJSON(documents, format);
        break;
      case 'markdown':
        content = this.exportAsMarkdown(documents);
        break;
      case 'csv':
        content = this.exportAsCSV(documents);
        break;
      case 'html':
        content = this.exportAsHTML(documents);
        break;
      default:
        throw new Error(`Unsupported format: ${format.format}`);
    }

    const result: ExportResult = {
      filename: `kb_export_${Date.now()}.${format.format}`,
      format: format.format,
      size: content.length,
      documentCount: documents.length,
      createdAt: new Date(),
      content,
    };

    this.exportHistory.push(result);
    return result;
  }

  async exportPlaybooks(playbookIds: string[], documents: Map<string, Playbook>): Promise<ExportResult> {
    const playbookDocs = playbookIds
      .map(id => documents.get(id))
      .filter((p): p is Playbook => p !== undefined);

    return this.exportDocuments(playbookDocs, {
      format: 'markdown',
      includeVersionHistory: false,
      includeMetadata: true,
      includeAccessControl: false,
      prettyPrint: true,
    });
  }

  async exportRunbooks(runbookIds: string[], documents: Map<string, Runbook>): Promise<ExportResult> {
    const runbookDocs = runbookIds
      .map(id => documents.get(id))
      .filter((r): r is Runbook => r !== undefined);

    return this.exportDocuments(runbookDocs, {
      format: 'markdown',
      includeVersionHistory: false,
      includeMetadata: true,
      includeAccessControl: false,
      prettyPrint: true,
    });
  }

  private exportAsJSON(documents: KBDocument[], format: ExportFormat): string {
    const data = documents.map(doc => {
      const exported: any = {
        id: doc.id,
        title: doc.title,
        content: doc.content,
        category: doc.category,
        tags: doc.tags,
        isPublished: doc.isPublished,
      };

      if (format.includeMetadata) {
        exported.metadata = doc.metadata;
        exported.createdAt = doc.createdAt;
        exported.updatedAt = doc.updatedAt;
        exported.createdBy = doc.createdBy;
        exported.version = doc.version;
      }

      if (format.includeAccessControl) {
        exported.accessLevel = doc.accessLevel;
      }

      return exported;
    });

    return format.prettyPrint ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  }

  private exportAsMarkdown(documents: KBDocument[]): string {
    const lines: string[] = [
      '# Knowledge Base Export',
      `Generated: ${new Date().toISOString()}`,
      `Documents: ${documents.length}`,
      '',
    ];

    documents.forEach((doc, index) => {
      lines.push(`## ${index + 1}. ${doc.title}`);
      lines.push(`**Category:** ${doc.category}`);
      lines.push(`**Tags:** ${doc.tags.join(', ')}`);
      lines.push(`**Published:** ${doc.isPublished ? 'Yes' : 'No'}`);
      lines.push('');
      lines.push(doc.content);
      lines.push('');
      lines.push('---');
      lines.push('');
    });

    return lines.join('\n');
  }

  private exportAsCSV(documents: KBDocument[]): string {
    const headers = ['ID', 'Title', 'Category', 'Tags', 'Published', 'Created By', 'Created At'];
    const rows = [headers.join(',')];

    documents.forEach(doc => {
      const row = [
        this.escapeCSV(doc.id),
        this.escapeCSV(doc.title),
        this.escapeCSV(doc.category),
        this.escapeCSV(doc.tags.join(';')),
        doc.isPublished ? 'Yes' : 'No',
        this.escapeCSV(doc.createdBy),
        doc.createdAt.toISOString(),
      ];
      rows.push(row.join(','));
    });

    return rows.join('\n');
  }

  private exportAsHTML(documents: KBDocument[]): string {
    const html: string[] = [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '<meta charset="UTF-8">',
      '<title>Knowledge Base Export</title>',
      '<style>',
      'body { font-family: Arial, sans-serif; margin: 20px; }',
      '.document { margin-bottom: 30px; border: 1px solid #ccc; padding: 15px; }',
      '.title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }',
      '.metadata { color: #666; font-size: 12px; margin-bottom: 10px; }',
      'pre { background: #f4f4f4; padding: 10px; overflow-x: auto; }',
      '</style>',
      '</head>',
      '<body>',
      `<h1>Knowledge Base Export - ${new Date().toLocaleString()}</h1>`,
      `<p>Total Documents: ${documents.length}</p>`,
      '<hr>',
    ];

    documents.forEach((doc, index) => {
      html.push('<div class="document">');
      html.push(`<div class="title">${doc.title}</div>`);
      html.push('<div class="metadata">');
      html.push(`Category: ${doc.category}<br>`);
      html.push(`Tags: ${doc.tags.join(', ')}<br>`);
      html.push(`Published: ${doc.isPublished ? 'Yes' : 'No'}<br>`);
      html.push(`</div>`);
      html.push(`<div>${this.escapeHTML(doc.content).substring(0, 500)}...</div>`);
      html.push('</div>');
    });

    html.push('</body>');
    html.push('</html>');

    return html.join('\n');
  }

  async getExportHistory(limit: number = 50): Promise<ExportResult[]> {
    return this.exportHistory.slice(-limit).reverse();
  }

  async deleteExportHistory(beforeDate: Date): Promise<number> {
    const initial = this.exportHistory.length;
    this.exportHistory = this.exportHistory.filter(e => e.createdAt >= beforeDate);
    return initial - this.exportHistory.length;
  }

  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private escapeHTML(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
