'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CampaignData {
  [key: string]: string | number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [selectedRow, setSelectedRow] = useState<CampaignData | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleShowDetails = (row: CampaignData) => {
    setSelectedRow(row);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedRow(null);
  };

  useEffect(() => {
    const fetchSheetData = async () => {
      try {
        setLoading(true);
        
        const sheetId = '1sJGO3IZ8Cev8F5pkdDo8uxXL7oCVlmsRtrGERsZHxSM';
        const gid = '0';
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
        
        const response = await fetch(csvUrl);
        
        if (!response.ok) {
          throw new Error('Failed to fetch data from Google Sheets');
        }
        
        const csvText = await response.text();
        const rows = csvText.split('\n').filter(row => row.trim());
        
        if (rows.length === 0) {
          throw new Error('No data found in the sheet');
        }
        
        // Parse CSV properly handling quotes and commas
        const parseCSVRow = (row: string): string[] => {
          const values: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < row.length; i++) {
            const char = row[i];
            const nextChar = row[i + 1];
            
            if (char === '"' && nextChar === '"') {
              // Handle escaped quotes
              current += '"';
              i++; // Skip next quote
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
        };
        
        const headerRow = parseCSVRow(rows[0]).map(h => h.replace(/"/g, ''));
        
        // Find columns to exclude
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
        setHeaders(filteredHeaders);
        
        // Parse and clean data rows
        const parsedData: CampaignData[] = [];
        const seen = new Set<string>();
        
        for (let i = 1; i < rows.length; i++) {
          const values = parseCSVRow(rows[i]).map(v => v.replace(/"/g, ''));
          
          // Store sheet ID before filtering (needed for View button)
          const sheetIdValue = sheetIdIndex !== -1 ? values[sheetIdIndex] : '';
          
          // Filter out excluded columns from values
          const filteredValues = values.filter((_, idx) =>
            idx !== emailTemplateIndex && idx !== idColumnIndex && idx !== sheetIdIndex
          );
          
          // Skip empty rows
          if (filteredValues.every(v => !v || v.trim() === '')) continue;
          
          const rowData: CampaignData = {};
          let rowKey = '';
          
          // Map filtered values to filtered headers
          filteredHeaders.forEach((header, idx) => {
            const value = filteredValues[idx] || '';
            rowData[header] = value;
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
        
        setData(parsedData);
        setError(null);
      } catch (err) {
        console.error('Error fetching sheet data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchSheetData();
  }, []);

  const formatCellValue = (value: string | number, header: string): string => {
    const strValue = String(value).trim();
    
    // Return "-" for blank fields
    if (!strValue || strValue === '') {
      return '-';
    }
    
    // Format dates
    if (header.toLowerCase().includes('date') && strValue.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      return strValue;
    }
    
    // Format currency/budget
    if (header.toLowerCase().includes('budget') && strValue.match(/^\d+$/)) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0
      }).format(Number(strValue));
    }
    
    // Capitalize first letter for status/priority fields
    if ((header.toLowerCase().includes('status') || header.toLowerCase().includes('priority')) && strValue) {
      return strValue.charAt(0).toUpperCase() + strValue.slice(1).toLowerCase();
    }
    
    return strValue;
  };

  const getCellClassName = (header: string, value: string | number): string => {
    const strValue = String(value).toLowerCase();
    
    // Priority colors
    if (header.toLowerCase().includes('priority')) {
      if (strValue === 'high') return 'bg-red-100 text-red-800';
      if (strValue === 'medium') return 'bg-yellow-100 text-yellow-800';
      if (strValue === 'low') return 'bg-green-100 text-green-800';
    }
    
    // Status colors
    if (header.toLowerCase().includes('status')) {
      if (strValue === 'active' || strValue === 'in progress') return 'bg-blue-100 text-blue-800';
      if (strValue === 'completed' || strValue === 'done') return 'bg-green-100 text-green-800';
      if (strValue === 'pending') return 'bg-gray-100 text-gray-800';
      if (strValue === 'cancelled') return 'bg-red-100 text-red-800';
    }
    
    return '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg border border-red-200 max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">Error Loading Data</h3>
          <p className="text-gray-600 text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">Sync</h1>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              New Campaign
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Table Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Campaign Dashboard</h2>
        </div>
        
        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No.
                  </th>
                  {headers.map((header, index) => (
                    <th
                      key={index}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{rowIndex + 1}</div>
                    </td>
                    {headers.map((header, colIndex) => {
                      const value = row[header];
                      const cellClass = getCellClassName(header, value);
                      const formattedValue = formatCellValue(value, header);
                      
                      // Skip rendering Email Template column
                      if (header.toLowerCase().includes('email template') ||
                          header.toLowerCase().includes('emailtemplate')) {
                        return null;
                      }
                      
                      return (
                        <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                          {cellClass ? (
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${cellClass}`}>
                              {formattedValue}
                            </span>
                          ) : (
                            <div className="text-sm text-gray-900">{formattedValue}</div>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => router.push(`/view/${row['_sheetId'] || rowIndex}`)}
                        className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">Details</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              {headers.map((header, index) => (
                <div key={index} className="border-b border-gray-200 pb-3">
                  <p className="text-sm font-medium text-gray-500 mb-1">{header}</p>
                  <p className="text-base text-gray-900">{selectedRow[header]}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}