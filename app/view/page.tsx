'use client';

import { useState, useEffect } from 'react';

interface CampaignData {
  [key: string]: string | number;
}

export default function ViewDetailsPage() {
  const [data, setData] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);

  useEffect(() => {
    const fetchSheetData = async () => {
      try {
        setLoading(true);
        
        // Google Sheets ID from the URL
        const sheetId = '1Vd0HJJqjdEkCNs2F37B3OmQp7sFelpLibDUIBKmh_lw';
        const gid = '566681534';
        
        // Export as CSV
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
        
        const response = await fetch(csvUrl);
        
        if (!response.ok) {
          throw new Error('Failed to fetch data from Google Sheets');
        }
        
        const csvText = await response.text();
        
        // Parse CSV
        const rows = csvText.split('\n').filter(row => row.trim());
        
        if (rows.length === 0) {
          throw new Error('No data found in the sheet');
        }
        
        // Extract headers
        const headerRow = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
        setHeaders(headerRow);
        
        // Parse data rows
        const parsedData = rows.slice(1).map(row => {
          const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
          const rowData: CampaignData = {};
          
          headerRow.forEach((header, index) => {
            rowData[header] = values[index] || '';
          });
          
          return rowData;
        });
        
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading data from Google Sheets...</p>
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
          <div className="py-6">
            <h2 className="text-xl font-bold text-gray-900">Sync</h2>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Table Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Campaign Data Overview</h1>
              <p className="text-gray-600">Live data from Google Sheets</p>
            </div>
            <div className="text-sm font-medium text-gray-600">
              {data.length} {data.length === 1 ? 'record' : 'records'}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
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
                        <div className="text-sm text-gray-900">{row[header]}</div>
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