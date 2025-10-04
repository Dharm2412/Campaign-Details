// Google Sheet template generator for proper field mapping

import { EXPECTED_SHEET_HEADERS, generateSampleData, generateCSVHeader } from './fieldMapping';

export interface SheetTemplate {
  headers: string[];
  sampleData: Record<string, any>;
  csvContent: string;
  instructions: string[];
}

/**
 * Generate a complete Google Sheet template
 */
export function generateSheetTemplate(): SheetTemplate {
  const headers = EXPECTED_SHEET_HEADERS;
  const sampleData = generateSampleData();
  const csvContent = generateCSVContent();
  
  const instructions = [
    '1. Create a new Google Sheet',
    '2. Copy the CSV content below and paste it into the sheet',
    '3. Make sure the sheet is set to "Anyone with the link can view"',
    '4. Update the sheet ID in your application configuration',
    '5. Test the data fetching using the debug tool at /debug'
  ];

  return {
    headers,
    sampleData,
    csvContent,
    instructions
  };
}

/**
 * Generate CSV content for the template
 */
function generateCSVContent(): string {
  const headers = generateCSVHeader();
  const sampleData = generateSampleData();
  const sampleRow = Object.values(sampleData).map(value => 
    typeof value === 'string' && value.includes(',') ? `"${value}"` : value
  ).join(',');
  
  return `${headers}\n${sampleRow}`;
}

/**
 * Generate a Google Sheets URL for creating a new sheet with the template
 */
export function generateGoogleSheetsURL(): string {
  const template = generateSheetTemplate();
  const encodedCsv = encodeURIComponent(template.csvContent);
  
  // Note: This creates a data URI that can be used to pre-populate a new sheet
  // The user will need to manually create the sheet and paste the content
  return `data:text/csv;charset=utf-8,${encodedCsv}`;
}

/**
 * Generate field mapping documentation
 */
export function generateFieldMappingDoc(): string {
  return `
# Google Sheet Field Mapping

## Required Column Headers

The Google Sheet must have these exact column headers (case-sensitive):

${EXPECTED_SHEET_HEADERS.map((header, index) => `${index + 1}. ${header}`).join('\n')}

## Field Descriptions

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| Campaign Name | Text | Yes | Name of the campaign |
| Influencers Followers | Text | Yes | Follower count range (e.g., "10K-50K") |
| Campaign Type | Select | Yes | Type of campaign (Brand Collaboration, Product Launch, etc.) |
| Start Date | Date | Yes | Campaign start date (MM/DD/YYYY format) |
| Brand Name | Text | Yes | Name of the brand |
| End Date | Date | Yes | Campaign end date (MM/DD/YYYY format) |
| Niche | Text | Yes | Industry/category (e.g., Fashion, Tech, Food) |
| Priority | Select | Yes | Priority level (High, Medium, Low) |
| Budget | Number | Yes | Campaign budget amount |
| Notes | Text | No | Additional notes or comments |
| Deliverables | Text | Yes | What needs to be delivered |
| Platforms | Text | Yes | Social media platforms (comma-separated) |
| Attachment | Text | No | File name if attachment was uploaded |
| Submission Date | Date | No | When the form was submitted |

## Setup Instructions

1. Create a new Google Sheet
2. Add the column headers exactly as listed above
3. Set the sheet to "Anyone with the link can view"
4. Copy the sheet ID from the URL
5. Update your application configuration with the new sheet ID
6. Test using the debug tool at /debug

## Common Issues

- **Wrong column names**: Column headers must match exactly (case-sensitive)
- **Missing columns**: All required fields must be present
- **Wrong data types**: Ensure dates are in MM/DD/YYYY format, numbers are numeric
- **Sheet permissions**: Make sure the sheet is publicly viewable
`;
}

/**
 * Validate a Google Sheet URL and extract sheet ID
 */
export function extractSheetId(url: string): string | null {
  const patterns = [
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
    /\/d\/([a-zA-Z0-9-_]+)/,
    /^([a-zA-Z0-9-_]+)$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Generate a complete setup guide
 */
export function generateSetupGuide(): {
  title: string;
  steps: string[];
  template: string;
  validation: string[];
} {
  return {
    title: 'Google Sheet Setup Guide',
    steps: [
      '1. Go to Google Sheets (sheets.google.com)',
      '2. Click "Blank" to create a new sheet',
      '3. Copy the template below and paste it into cell A1',
      '4. Right-click on the sheet tab and rename it to "Campaign Data"',
      '5. Click "Share" in the top-right corner',
      '6. Change permissions to "Anyone with the link can view"',
      '7. Copy the sheet ID from the URL (the long string between /d/ and /edit)',
      '8. Update your application with the new sheet ID',
      '9. Test the connection using the debug tool at /debug'
    ],
    template: generateCSVContent(),
    validation: [
      '✓ All required column headers are present',
      '✓ Column names match exactly (case-sensitive)',
      '✓ Sheet is publicly viewable',
      '✓ Sheet ID is correctly configured',
      '✓ Data can be fetched successfully'
    ]
  };
}
