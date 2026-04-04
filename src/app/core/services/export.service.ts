import { Injectable } from '@angular/core';

/**
 * Achievement data for export
 */
export interface ExportAchievement {
  studentName?: string;
  title: string;
  type: string;
  eventName?: string;
  position?: string;
  achievedDate: string;
  isVerified: boolean;
  description?: string;
}

/**
 * Service for exporting data to various formats
 */
@Injectable({
  providedIn: 'root'
})
export class ExportService {

  /**
   * Exports achievements to CSV format
   * @param achievements Array of achievements to export
   * @param filename Output filename
   */
  exportToCSV(achievements: ExportAchievement[], filename: string = 'achievements.csv'): void {
    if (!achievements || achievements.length === 0) {
      console.warn('No data to export');
      return;
    }

    const headers = ['Student Name', 'Title', 'Type', 'Event', 'Position', 'Date', 'Verified', 'Description'];
    const rows = achievements.map(a => [
      a.studentName || 'N/A',
      a.title || '',
      a.type || '',
      a.eventName || 'N/A',
      a.position || 'N/A',
      a.achievedDate || '',
      a.isVerified ? 'Yes' : 'No',
      a.description || 'N/A'
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => this.escapeCSVCell(String(cell))).join(','))
    ].join('\n');

    this.downloadFile(csv, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * Exports achievements to JSON format
   * @param achievements Array of achievements to export
   * @param filename Output filename
   */
  exportToJSON(achievements: ExportAchievement[], filename: string = 'achievements.json'): void {
    if (!achievements || achievements.length === 0) {
      console.warn('No data to export');
      return;
    }

    const json = JSON.stringify(achievements, null, 2);
    this.downloadFile(json, filename, 'application/json');
  }

  /**
   * Exports achievements to Excel-compatible format (CSV with UTF-8 BOM)
   * @param achievements Array of achievements to export
   * @param filename Output filename
   */
  exportToExcel(achievements: ExportAchievement[], filename: string = 'achievements.csv'): void {
    if (!achievements || achievements.length === 0) {
      console.warn('No data to export');
      return;
    }

    const headers = ['Student Name', 'Title', 'Type', 'Event', 'Position', 'Date', 'Verified', 'Description'];
    const rows = achievements.map(a => [
      a.studentName || 'N/A',
      a.title || '',
      a.type || '',
      a.eventName || 'N/A',
      a.position || 'N/A',
      a.achievedDate || '',
      a.isVerified ? 'Yes' : 'No',
      a.description || 'N/A'
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => this.escapeCSVCell(String(cell))).join(','))
    ].join('\n');

    // Add UTF-8 BOM for Excel compatibility
    const bom = '\uFEFF';
    this.downloadFile(bom + csv, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * Escapes a CSV cell value to handle commas, quotes, and newlines
   * @param cell Cell value to escape
   * @returns Escaped cell value
   */
  private escapeCSVCell(cell: string): string {
    // If cell contains comma, quote, or newline, wrap in quotes and escape quotes
    if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
      return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
  }

  /**
   * Triggers a file download in the browser
   * @param content File content
   * @param filename Filename
   * @param mimeType MIME type
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * Exports data to a printable HTML format
   * @param achievements Array of achievements to export
   * @param title Report title
   */
  exportToPrint(achievements: ExportAchievement[], title: string = 'Achievements Report'): void {
    if (!achievements || achievements.length === 0) {
      console.warn('No data to export');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      console.error('Failed to open print window. Please check popup blocker settings.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #4CAF50; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .verified { color: green; font-weight: bold; }
          .not-verified { color: orange; font-weight: bold; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <button onclick="window.print()">Print</button>
        <table>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Title</th>
              <th>Type</th>
              <th>Event</th>
              <th>Position</th>
              <th>Date</th>
              <th>Verified</th>
            </tr>
          </thead>
          <tbody>
            ${achievements.map(a => `
              <tr>
                <td>${this.escapeHtml(a.studentName || 'N/A')}</td>
                <td>${this.escapeHtml(a.title)}</td>
                <td>${this.escapeHtml(a.type)}</td>
                <td>${this.escapeHtml(a.eventName || 'N/A')}</td>
                <td>${this.escapeHtml(a.position || 'N/A')}</td>
                <td>${this.escapeHtml(a.achievedDate)}</td>
                <td class="${a.isVerified ? 'verified' : 'not-verified'}">
                  ${a.isVerified ? 'Yes' : 'No'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }

  /**
   * Escapes HTML special characters
   * @param text Text to escape
   * @returns Escaped text
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
