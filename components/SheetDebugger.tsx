'use client';

import { useState } from 'react';
import { fetchSheetData, SHEET_CONFIGS } from '../lib/sheetUtils';
import { validateSheetStructure, EXPECTED_SHEET_HEADERS } from '../lib/fieldMapping';
import { generateSheetTemplate, generateSetupGuide } from '../lib/sheetTemplate';

interface DebugResult {
  config: string;
  success: boolean;
  error?: string;
  headers: string[];
  dataCount: number;
  sampleData?: any;
  rawCsv?: string;
  validation?: {
    isValid: boolean;
    missingFields: string[];
    extraFields: string[];
    suggestions: Record<string, string>;
  };
}

export default function SheetDebugger() {
  const [results, setResults] = useState<DebugResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customSheetId, setCustomSheetId] = useState('');
  const [showTemplate, setShowTemplate] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  const testAllSheets = async () => {
    setIsLoading(true);
    const newResults: DebugResult[] = [];

    // Test configured sheets
    for (const [key, config] of Object.entries(SHEET_CONFIGS)) {
      try {
        console.log(`Testing ${config.name}...`);
        const result = await fetchSheetData(config);
        
        const validation = result.headers.length > 0 ? validateSheetStructure(result.headers) : undefined;
        
        newResults.push({
          config: `${key} (${config.name})`,
          success: !result.error,
          error: result.error,
          headers: result.headers,
          dataCount: result.data.length,
          sampleData: result.data.slice(0, 2),
          validation
        });
      } catch (error) {
        newResults.push({
          config: `${key} (${config.name})`,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          headers: [],
          dataCount: 0
        });
      }
    }

    setResults(newResults);
    setIsLoading(false);
  };

  const testCustomSheet = async () => {
    if (!customSheetId.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await fetchSheetData({
        sheetId: customSheetId.trim(),
        name: `Custom Sheet ${customSheetId}`
      });
      
      const validation = result.headers.length > 0 ? validateSheetStructure(result.headers) : undefined;
      
      setResults(prev => [...prev, {
        config: `Custom (${customSheetId})`,
        success: !result.error,
        error: result.error,
        headers: result.headers,
        dataCount: result.data.length,
        sampleData: result.data.slice(0, 2),
        validation
      }]);
    } catch (error) {
      setResults(prev => [...prev, {
        config: `Custom (${customSheetId})`,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        headers: [],
        dataCount: 0
      }]);
    }
    setIsLoading(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Google Sheets Data Fetcher Debugger</h2>
      
      <div className="space-y-6">
        {/* Test Controls */}
        <div className="flex flex-wrap gap-4 items-end">
          <button
            onClick={testAllSheets}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Testing...' : 'Test All Configured Sheets'}
          </button>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={customSheetId}
              onChange={(e) => setCustomSheetId(e.target.value)}
              placeholder="Enter custom sheet ID"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={testCustomSheet}
              disabled={isLoading || !customSheetId.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Test Custom Sheet
            </button>
          </div>
          
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Clear Results
          </button>
          
          <button
            onClick={() => setShowTemplate(!showTemplate)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            {showTemplate ? 'Hide Template' : 'Show Template'}
          </button>
          
          <button
            onClick={() => setShowSetupGuide(!showSetupGuide)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            {showSetupGuide ? 'Hide Setup Guide' : 'Show Setup Guide'}
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  result.success 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{result.config}</h4>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    result.success 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? 'SUCCESS' : 'FAILED'}
                  </span>
                </div>
                
                {result.error && (
                  <div className="mb-3 p-3 bg-red-100 border border-red-300 rounded text-red-700">
                    <strong>Error:</strong> {result.error}
                  </div>
                )}
                
                {result.validation && (
                  <div className={`mb-3 p-3 border rounded ${
                    result.validation.isValid 
                      ? 'bg-green-100 border-green-300 text-green-700' 
                      : 'bg-yellow-100 border-yellow-300 text-yellow-700'
                  }`}>
                    <strong>Field Mapping Validation:</strong>
                    {result.validation.isValid ? (
                      <span className="ml-2">✅ All required fields are present</span>
                    ) : (
                      <div className="mt-2">
                        {result.validation.missingFields.length > 0 && (
                          <div>
                            <strong>Missing Fields:</strong>
                            <ul className="list-disc list-inside ml-4">
                              {result.validation.missingFields.map(field => (
                                <li key={field}>{field}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {result.validation.extraFields.length > 0 && (
                          <div className="mt-2">
                            <strong>Extra Fields:</strong>
                            <ul className="list-disc list-inside ml-4">
                              {result.validation.extraFields.map(field => (
                                <li key={field}>
                                  {field}
                                  {result.validation!.suggestions[field] && (
                                    <span className="text-gray-600"> → Suggested: {result.validation!.suggestions[field]}</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <strong>Headers ({result.headers.length}):</strong>
                    <div className="mt-1 max-h-32 overflow-y-auto">
                      {result.headers.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                          {result.headers.map((header, idx) => (
                            <li key={idx} className="text-gray-600">{header}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-500">No headers found</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <strong>Data Rows:</strong>
                    <div className="mt-1 text-gray-600">
                      {result.dataCount} row{result.dataCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  <div>
                    <strong>Sample Data:</strong>
                    <div className="mt-1 max-h-32 overflow-y-auto">
                      {result.sampleData && result.sampleData.length > 0 ? (
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.sampleData, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-gray-500">No sample data</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">How to use this debugger:</h4>
          <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
            <li>Click "Test All Configured Sheets" to test the sheets currently configured in the app</li>
            <li>Enter a custom Google Sheet ID to test any other sheet</li>
            <li>Check the results to see if sheets are accessible and what data is being fetched</li>
            <li>If a sheet shows "FAILED", check if the sheet is publicly accessible</li>
            <li>Compare headers between sheets to ensure field mapping is correct</li>
          </ul>
        </div>

        {/* Template Section */}
        {showTemplate && (
          <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-2">Google Sheet Template</h4>
            <p className="text-purple-800 text-sm mb-3">
              Copy this template and paste it into a new Google Sheet to ensure proper field mapping:
            </p>
            <div className="bg-gray-100 p-3 rounded border">
              <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                {generateSheetTemplate().csvContent}
              </pre>
            </div>
            <div className="mt-3 text-sm text-purple-700">
              <strong>Instructions:</strong>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                {generateSheetTemplate().instructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* Setup Guide Section */}
        {showSetupGuide && (
          <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <h4 className="font-semibold text-indigo-900 mb-2">{generateSetupGuide().title}</h4>
            <div className="space-y-4">
              <div>
                <h5 className="font-medium text-indigo-800 mb-2">Setup Steps:</h5>
                <ol className="list-decimal list-inside space-y-1 text-indigo-700 text-sm">
                  {generateSetupGuide().steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
              
              <div>
                <h5 className="font-medium text-indigo-800 mb-2">Template CSV:</h5>
                <div className="bg-gray-100 p-3 rounded border">
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                    {generateSetupGuide().template}
                  </pre>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-indigo-800 mb-2">Validation Checklist:</h5>
                <ul className="space-y-1 text-indigo-700 text-sm">
                  {generateSetupGuide().validation.map((item, index) => (
                    <li key={index} className="flex items-center">
                      <span className="mr-2">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Common Issues */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-900 mb-2">Common Issues & Solutions:</h4>
          <ul className="list-disc list-inside space-y-1 text-yellow-800 text-sm">
            <li><strong>Sheet appears private:</strong> Make sure the Google Sheet is set to "Anyone with the link can view"</li>
            <li><strong>No data found:</strong> Check if the sheet has data in the first tab (gid=0)</li>
            <li><strong>Wrong headers:</strong> Use the template above to ensure correct column names</li>
            <li><strong>Missing fields:</strong> Check the validation results and add missing required fields</li>
            <li><strong>CSV parsing errors:</strong> Check for special characters in cell values that might break CSV parsing</li>
            <li><strong>Empty rows:</strong> The app filters out completely empty rows, which is normal</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
