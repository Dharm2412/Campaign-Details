// Field mapping between form data and Google Sheet columns

export interface FormField {
  formKey: string;
  displayName: string;
  required: boolean;
  type: 'text' | 'date' | 'number' | 'select' | 'textarea' | 'file' | 'platforms';
  options?: string[];
}

// All form fields with their exact names and properties
export const FORM_FIELDS: FormField[] = [
  {
    formKey: 'campaignName',
    displayName: 'Campaign Name',
    required: true,
    type: 'text'
  },
  {
    formKey: 'influencersFollowers',
    displayName: 'Influencers Followers',
    required: true,
    type: 'text'
  },
  {
    formKey: 'campaignType',
    displayName: 'Campaign Type',
    required: true,
    type: 'select',
    options: ['Brand Collaboration', 'Product Launch', 'Event Promotion', 'Content Creation', 'Other']
  },
  {
    formKey: 'startDate',
    displayName: 'Start Date',
    required: true,
    type: 'date'
  },
  {
    formKey: 'brandName',
    displayName: 'Brand Name',
    required: true,
    type: 'text'
  },
  {
    formKey: 'endDate',
    displayName: 'End Date',
    required: true,
    type: 'date'
  },
  {
    formKey: 'niche',
    displayName: 'Niche',
    required: true,
    type: 'text'
  },
  {
    formKey: 'priority',
    displayName: 'Priority',
    required: true,
    type: 'select',
    options: ['High', 'Medium', 'Low']
  },
  {
    formKey: 'budget',
    displayName: 'Budget',
    required: true,
    type: 'number'
  },
  {
    formKey: 'notes',
    displayName: 'Notes',
    required: false,
    type: 'textarea'
  },
  {
    formKey: 'deliverables',
    displayName: 'Deliverables',
    required: true,
    type: 'textarea'
  },
  {
    formKey: 'platforms',
    displayName: 'Platforms',
    required: true,
    type: 'platforms',
    options: ['Instagram', 'Facebook', 'YouTube']
  },
  {
    formKey: 'attachment',
    displayName: 'Attachment',
    required: false,
    type: 'file'
  },
  {
    formKey: 'timestamp',
    displayName: 'Submission Date',
    required: false,
    type: 'date'
  }
];

// Expected Google Sheet column headers (exact match with form fields)
export const EXPECTED_SHEET_HEADERS = FORM_FIELDS.map(field => field.displayName);

// Field mapping for different naming conventions
export const FIELD_MAPPING: Record<string, string[]> = {
  'Campaign Name': ['campaign name', 'campaign_name', 'campaignname', 'campaign'],
  'Influencers Followers': ['influencers followers', 'influencers_followers', 'influencersfollowers', 'followers', 'influencer count'],
  'Campaign Type': ['campaign type', 'campaign_type', 'campaigntype', 'type'],
  'Start Date': ['start date', 'start_date', 'startdate', 'start', 'campaign start'],
  'Brand Name': ['brand name', 'brand_name', 'brandname', 'brand'],
  'End Date': ['end date', 'end_date', 'enddate', 'end', 'campaign end'],
  'Niche': ['niche', 'category', 'industry'],
  'Priority': ['priority', 'urgency', 'level'],
  'Budget': ['budget', 'amount', 'cost', 'price'],
  'Notes': ['notes', 'comments', 'description', 'additional info'],
  'Deliverables': ['deliverables', 'requirements', 'scope', 'what to deliver'],
  'Platforms': ['platforms', 'social media', 'channels', 'platform'],
  'Attachment': ['attachment', 'file', 'document', 'upload'],
  'Submission Date': ['submission date', 'submission_date', 'submissiondate', 'timestamp', 'created', 'date submitted']
};

// Function to find the correct column header for a form field
export function findColumnHeader(formFieldName: string, sheetHeaders: string[]): string | null {
  const field = FORM_FIELDS.find(f => f.formKey === formFieldName);
  if (!field) return null;

  const displayName = field.displayName;
  
  // First, try exact match
  if (sheetHeaders.includes(displayName)) {
    return displayName;
  }

  // Then try case-insensitive match
  const exactMatch = sheetHeaders.find(header => 
    header.toLowerCase() === displayName.toLowerCase()
  );
  if (exactMatch) return exactMatch;

  // Finally, try mapping variations
  const variations = FIELD_MAPPING[displayName] || [];
  for (const variation of variations) {
    const match = sheetHeaders.find(header => 
      header.toLowerCase().includes(variation.toLowerCase()) ||
      variation.toLowerCase().includes(header.toLowerCase())
    );
    if (match) return match;
  }

  return null;
}

// Function to create a properly formatted row data object
export function createFormattedRowData(formData: Record<string, any>): Record<string, any> {
  const rowData: Record<string, any> = {};
  
  // Add all form fields with proper formatting
  FORM_FIELDS.forEach(field => {
    const value = formData[field.formKey];
    
    switch (field.type) {
      case 'platforms':
        if (Array.isArray(value)) {
          rowData[field.displayName] = value.join(', ');
        } else if (typeof value === 'object' && value !== null) {
          const selectedPlatforms = Object.entries(value)
            .filter(([_, isSelected]) => isSelected)
            .map(([platform, _]) => platform.charAt(0).toUpperCase() + platform.slice(1));
          rowData[field.displayName] = selectedPlatforms.length > 0 ? selectedPlatforms.join(', ') : 'None';
        } else {
          rowData[field.displayName] = value || 'None';
        }
        break;
        
      case 'date':
        if (value) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            rowData[field.displayName] = date.toLocaleDateString();
          } else {
            rowData[field.displayName] = value;
          }
        } else {
          rowData[field.displayName] = '';
        }
        break;
        
      case 'number':
        if (value) {
          const num = parseFloat(value);
          rowData[field.displayName] = isNaN(num) ? value : num;
        } else {
          rowData[field.displayName] = '';
        }
        break;
        
      case 'file':
        if (value && value instanceof File) {
          rowData[field.displayName] = value.name;
        } else {
          rowData[field.displayName] = value || '';
        }
        break;
        
      default:
        rowData[field.displayName] = value || '';
    }
  });
  
  return rowData;
}

// Function to validate sheet structure
export function validateSheetStructure(sheetHeaders: string[]): {
  isValid: boolean;
  missingFields: string[];
  extraFields: string[];
  suggestions: Record<string, string>;
} {
  const missingFields: string[] = [];
  const extraFields: string[] = [];
  const suggestions: Record<string, string> = {};
  
  // Check for missing required fields
  FORM_FIELDS.forEach(field => {
    if (field.required) {
      const found = findColumnHeader(field.formKey, sheetHeaders);
      if (!found) {
        missingFields.push(field.displayName);
      }
    }
  });
  
  // Check for extra fields
  sheetHeaders.forEach(header => {
    const isExpected = FORM_FIELDS.some(field => field.displayName === header);
    if (!isExpected) {
      extraFields.push(header);
      
      // Try to suggest a mapping
      const field = FORM_FIELDS.find(f => 
        f.displayName.toLowerCase().includes(header.toLowerCase()) ||
        header.toLowerCase().includes(f.displayName.toLowerCase())
      );
      if (field) {
        suggestions[header] = field.displayName;
      }
    }
  });
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
    extraFields,
    suggestions
  };
}

// Generate CSV header row for creating new sheets
export function generateCSVHeader(): string {
  return EXPECTED_SHEET_HEADERS.join(',');
}

// Generate sample data row for testing
export function generateSampleData(): Record<string, any> {
  return {
    'Campaign Name': 'Sample Campaign',
    'Influencers Followers': '10K-50K',
    'Campaign Type': 'Brand Collaboration',
    'Start Date': '12/01/2024',
    'Brand Name': 'Sample Brand',
    'End Date': '12/31/2024',
    'Niche': 'Fashion',
    'Priority': 'High',
    'Budget': '5000',
    'Notes': 'Sample campaign notes',
    'Deliverables': '3 Instagram posts, 2 Stories',
    'Platforms': 'Instagram, Facebook',
    'Attachment': 'campaign_brief.pdf',
    'Submission Date': new Date().toLocaleDateString()
  };
}
