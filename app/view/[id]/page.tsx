'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface CampaignData {
  [key: string]: string | number;
}

export default function ViewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sheetId = params.id as string;
  
  const [data, setData] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);

  useEffect(() => {
    const fetchSheetData = async () => {
      try {
        setLoading(true);
        
        // Use the sheet ID from URL parameter to fetch from that specific Google Sheet
        // Export without specifying gid - will export the first tab
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
        
        const response = await fetch(csvUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data from Google Sheets. Please verify that Sheet ID "${sheetId}" is valid and publicly accessible.`);
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
        
        // Filter out excluded columns from headers
        const filteredHeaders = headerRow.filter((_, idx) =>
          idx !== emailTemplateIndex && idx !== idColumnIndex
        );
        setHeaders(filteredHeaders);
        
        const parsedData: CampaignData[] = [];
        
        for (let i = 1; i < rows.length; i++) {
          const values = parseCSVRow(rows[i]).map(v => v.replace(/"/g, ''));
          
          // Filter out excluded columns from values
          const filteredValues = values.filter((_, idx) =>
            idx !== emailTemplateIndex && idx !== idColumnIndex
          );
          
          if (filteredValues.every(v => !v || v.trim() === '')) continue;
          
          const rowData: CampaignData = {};
          filteredHeaders.forEach((header, idx) => {
            rowData[header] = filteredValues[idx] || '';
          });
          
          parsedData.push(rowData);
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
  }, [sheetId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading data...</p>
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
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sheet Details</h2>
            <p className="text-gray-600 mt-1">Sheet ID: {sheetId}</p>
          </div>
          <div className="text-sm text-gray-500">
            {data.length} record{data.length !== 1 ? 's' : ''}
          </div>
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{rowIndex + 1}</div>
                    </td>
                    {headers.map((header, colIndex) => (
                      <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {String(row[header] || '-')}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}