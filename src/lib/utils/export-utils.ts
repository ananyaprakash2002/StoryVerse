import type { CategoryItem, CategoryField } from '$lib/types/category';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Format field value for export (Excel/PDF)
 */
function formatFieldValue(value: any, fieldType: string, maxLength?: number): string {
    let formatted: string;

    switch (fieldType) {
        case 'boolean':
            formatted = value ? 'Yes' : 'No';
            break;
        case 'rating':
            const rating = value || 0;
            formatted = '★'.repeat(rating) + '☆'.repeat(5 - rating) + ` (${rating}/5)`;
            break;
        case 'tags':
        case 'multiselect':
            formatted = Array.isArray(value) ? value.join(', ') : '';
            break;
        case 'date':
            formatted = value ? new Date(value).toLocaleDateString() : '';
            break;
        case 'textarea':
        case 'text':
        case 'url':
        default:
            formatted = value?.toString() || '';
            break;
    }

    // Truncate if maxLength is specified
    if (maxLength && formatted.length > maxLength) {
        return formatted.substring(0, maxLength - 3) + '...';
    }

    return formatted;
}

/**
 * Export items as JSON
 */
export function exportToJSON(items: CategoryItem[], categoryName: string) {
    const data = {
        category: categoryName,
        exportDate: new Date().toISOString(),
        itemCount: items.length,
        version: '1.0',
        items: items.map((item) => ({
            data: item.data,
            cover_image_url: item.cover_image_url || null,
            cover_image_path: item.cover_image_path || null,
            api_source: item.api_source || null,
            api_id: item.api_id || null
        }))
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizeFilename(categoryName)}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Parse and validate imported JSON
 */
export async function parseImportedJSON(file: File): Promise<{ items: any[]; category: string; itemCount: number }> {
    const text = await file.text();
    const data = JSON.parse(text);

    // Validate structure
    if (!data.items || !Array.isArray(data.items)) {
        throw new Error('Invalid JSON format: missing or invalid "items" array');
    }

    return {
        items: data.items,
        category: data.category || 'Unknown',
        itemCount: data.itemCount || data.items.length
    };
}

/**
 * Export items as Excel
 */
export function exportToExcel(items: CategoryItem[], fields: CategoryField[], categoryName: string) {
    // Create worksheet data
    const headers = fields.map((f) => f.label);
    const rows = items.map((item) => fields.map((f) => formatFieldValue(item.data[f.name], f.field_type)));

    const wsData = [headers, ...rows];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = fields.map(() => ({ wch: 20 }));

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(categoryName));

    // Add metadata sheet
    const metaWs = XLSX.utils.aoa_to_sheet([
        ['Category', categoryName],
        ['Export Date', new Date().toLocaleString()],
        ['Total Items', items.length],
        ['Fields', fields.length]
    ]);
    XLSX.utils.book_append_sheet(wb, metaWs, 'Metadata');

    // Download
    XLSX.writeFile(wb, `${sanitizeFilename(categoryName)}-${Date.now()}.xlsx`);
}

/**
 * Export items as PDF
 */
export function exportToPDF(items: CategoryItem[], fields: CategoryField[], categoryName: string) {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(categoryName, 14, 22);

    // Metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Exported: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Items: ${items.length}`, 14, 36);

    // Prepare table data
    const headers = fields.map((f) => f.label);
    const rows = items.map((item) =>
        fields.map((f) => formatFieldValue(item.data[f.name], f.field_type, 50))
    );

    // Generate table
    autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 45,
        styles: {
            fontSize: 8,
            cellPadding: 2,
            overflow: 'linebreak',
            cellWidth: 'wrap'
        },
        headStyles: {
            fillColor: [96, 165, 250],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'left'
        },
        alternateRowStyles: {
            fillColor: [245, 247, 250]
        },
        margin: { top: 45, right: 14, bottom: 14, left: 14 },
        didDrawPage: (data) => {
            // Footer with page numbers
            const pageCount = doc.getNumberOfPages();
            doc.setFontSize(8);
            doc.text(
                `Page ${data.pageNumber} of ${pageCount}`,
                doc.internal.pageSize.width / 2,
                doc.internal.pageSize.height - 10,
                { align: 'center' }
            );
        }
    });

    // Download
    doc.save(`${sanitizeFilename(categoryName)}-${Date.now()}.pdf`);
}

/**
 * Sanitize filename for safe file downloads
 */
function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[^a-z0-9]/gi, '_')
        .replace(/_+/g, '_')
        .toLowerCase();
}

/**
 * Sanitize sheet name for Excel (max 31 chars, no special chars)
 */
function sanitizeSheetName(name: string): string {
    return name
        .replace(/[:\\/?*\[\]]/g, '')
        .substring(0, 31);
}
