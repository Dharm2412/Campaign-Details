'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchSheetData, formatCellValue, SHEET_CONFIGS, type CampaignData } from '../../lib/sheetUtils';

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
    const loadData = async () => {
      setLoading(true);
      const result = await fetchSheetData(SHEET_CONFIGS.dashboard);
      
      if (result.error) {
        setError(result.error);
        setData([]);
        setHeaders([]);
      } else {
        setData(result.data);
        setHeaders(result.headers);
        setError(null);
      }
      setLoading(false);
    };

    loadData();
  }, []);


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