// Utility functions for Google Sheets data fetching and parsing

import { 
  findColumnHeader, 
  createFormattedRowData, 
  validateSheetStructure, 
  EXPECTED_SHEET_HEADERS,
  type FormField 
} from './fieldMapping';

export interface CampaignData {
  [key: string]: string | number;
}

export interface SheetConfig {
  sheetId: string;
  gid?: string;
  name: string;
}

// Sheet configurations
export const SHEET_CONFIGS: Record<string, SheetConfig> = {
  dashboard: {
    sheetId: '1sJGO3IZ8Cev8F5pkdDo8uxXL7oCVlmsRtrGERsZHxSM',
    gid: '0',
    name: 'Dashboard Sheet'
  },
  view: {
    sheetId: '1Vd0HJJqjdEkCNs2F37B3OmQp7sFelpLibDUIBKmh_lw',
    gid: '566681534',
    name: 'View Sheet'
  }
};

/**
 * Parse CSV row properly handling quotes and commas
 */
export function parseCSVRow(row: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    const nextChar = row[i + 1];
    
    if (char === '"' && nextChar === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

/**
 * Fetch data from Google Sheets with improved error handling
 */
export async function fetchSheetData(config: SheetConfig): Promise<{
  data: CampaignData[];
  headers: string[];
  error?: string;
}> {
  try {
    // Build CSV URL
    const csvUrl = config.gid 
      ? `https://docs.google.com/spreadsheets/d/${config.sheetId}/export?format=csv&gid=${config.gid}`
      : `https://docs.google.com/spreadsheets/d/${config.sheetId}/export?format=csv`;
    
    console.log(`Fetching data from ${config.name}:`, csvUrl);
    
    const response = await fetch(csvUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch ${config.name}:`, response.status, errorText);
      
      // Check if it's a redirect (sheet might be private)
      if (response.status === 302 || response.status === 301 || response.url.includes('accounts.google.com')) {
        throw new Error(`Sheet "${config.name}" appears to be private or inaccessible. Please ensure the sheet is publicly viewable.`);
      }
      
      throw new Error(`Failed to fetch data from ${config.name}. Status: ${response.status}`);
    }
    
    const csvText = await response.text();
    
    // Check if we got HTML instead of CSV (sheet might be private)
    if (csvText.trim().startsWith('<HTML>') || csvText.trim().startsWith('<!DOCTYPE')) {
      throw new Error(`Sheet "${config.name}" appears to be private. Please make the sheet publicly viewable.`);
    }
    
    const rows = csvText.split('\n').filter(row => row.trim());
    
    if (rows.length === 0) {
      throw new Error(`No data found in ${config.name}`);
    }
    
    // Parse headers
    const headerRow = parseCSVRow(rows[0]).map(h => h.replace(/"/g, ''));
    console.log(`Headers from ${config.name}:`, headerRow);
    
    // Validate sheet structure
    const validation = validateSheetStructure(headerRow);
    console.log(`Sheet validation for ${config.name}:`, validation);
    
    // Find columns to exclude (common patterns)
    const emailTemplateIndex = headerRow.findIndex(h =>
      h.toLowerCase().includes('email template') ||
      h.toLowerCase().includes('emailtemplate')
    );
    
    const idColumnIndex = headerRow.findIndex(h =>
      h.toLowerCase() === 'id' ||
      h.toLowerCase() === 'campaign id' ||
      h.toLowerCase() === 'record id'
    );
    
    const sheetIdIndex = headerRow.findIndex(h =>
      h.toLowerCase().includes('sheet id') ||
      h.toLowerCase().includes('sheetid')
    );
    
    // Filter out excluded columns from headers
    const filteredHeaders = headerRow.filter((_, idx) =>
      idx !== emailTemplateIndex && idx !== idColumnIndex && idx !== sheetIdIndex
    );
    
    // Parse data rows
    const parsedData: CampaignData[] = [];
    const seen = new Set<string>();
    
        for (let i = 1; i < rows.length; i++) {
          const values = parseCSVRow(rows[i]).map(v => v.replace(/"/g, ''));
          
          // Store sheet ID before filtering (needed for navigation)
          const sheetIdValue = sheetIdIndex !== -1 ? values[sheetIdIndex] : '';
          
          // Filter out excluded columns from values
          const filteredValues = values.filter((_, idx) =>
            idx !== emailTemplateIndex && idx !== idColumnIndex && idx !== sheetIdIndex
          );
          
          // Skip empty rows
          if (filteredValues.every(v => !v || v.trim() === '')) continue;
          
          const rowData: CampaignData = {};
          let rowKey = '';
          
          // Map values to headers using proper field mapping
          filteredHeaders.forEach((header, idx) => {
            const value = filteredValues[idx] || '';
            
            // Try to find the correct field mapping
            const mappedHeader = findColumnHeader(header, EXPECTED_SHEET_HEADERS) || header;
            rowData[mappedHeader] = value;
            rowKey += value; // Create unique key for duplicate detection
          });
          
          // Store sheet ID separately for navigation (not displayed in table)
          if (sheetIdValue) {
            rowData['_sheetId'] = sheetIdValue;
          }
          
          // Skip duplicates
          if (!seen.has(rowKey)) {
            seen.add(rowKey);
            parsedData.push(rowData);
          }
        }
    
    console.log(`Successfully fetched ${parsedData.length} rows from ${config.name}`);
    
    return {
      data: parsedData,
      headers: filteredHeaders
    };
    
  } catch (error) {
    console.error(`Error fetching data from ${config.name}:`, error);
    return {
      data: [],
      headers: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Format cell value for display
 */
export function formatCellValue(value: string | number, header: string): string {
  if (value === null || value === undefined) return '';
  
  const strValue = String(value).trim();
  
  if (!strValue) return '';
  
  // Format dates
  if (header.toLowerCase().includes('date') && strValue) {
    try {
      const date = new Date(strValue);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
    } catch (e) {
      // If date parsing fails, return original value
    }
  }
  
  // Format currency
  if (header.toLowerCase().includes('budget') || header.toLowerCase().includes('price')) {
    const numValue = parseFloat(strValue);
    if (!isNaN(numValue)) {
      return `$${numValue.toLocaleString()}`;
    }
  }
  
  // Truncate long text
  if (strValue.length > 50) {
    return strValue.substring(0, 47) + '...';
  }
  
  return strValue;
}
