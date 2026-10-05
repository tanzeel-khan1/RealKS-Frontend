import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { Loader2, Sparkles, Table2, RefreshCw } from 'lucide-react';

const CATEGORY_COLORS = {
  marketing: 'bg-blue-100 text-blue-700', salaries: 'bg-purple-100 text-purple-700',
  software: 'bg-cyan-100 text-cyan-700', operations: 'bg-orange-100 text-orange-700',
  equipment: 'bg-yellow-100 text-yellow-700', taxes: 'bg-red-100 text-red-700',
  travel: 'bg-green-100 text-green-700', legal: 'bg-indigo-100 text-indigo-700',
  misc: 'bg-gray-100 text-gray-700',
};

export default function GoogleSheetsImport({ currency, onExtracted }) {
  const [sheets, setSheets] = useState([]);
  const [loadingSheets, setLoadingSheets] = useState(true);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);

  useEffect(() => {
    loadSheets();
  }, []);

  const loadSheets = async () => {
    setLoadingSheets(true);
    const res = await api.functions.invoke('listGoogleSheets', {});
    setSheets(res.data.sheets || []);
    setLoadingSheets(false);
  };

  const handleSelectSheet = async (sheet) => {
    setSelectedSheet(sheet);
    setExtractedData(null);
    onExtracted(null);
    setFetching(true);
    const res = await api.functions.invoke('fetchGoogleSheetData', { spreadsheetId: sheet.id });
    setFetching(false);
    if (res.data.rawText) {
      await analyzeData(res.data.rawText, res.data.tabs);
    }
  };

  const analyzeData = async (rawText, tabs) => {
    setAnalyzing(true);
    const today = new Date().toISOString().split('T')[0];
    const result = await api.integrations.Core.InvokeLLM({
      prompt: `You are a financial data extraction assistant. Analyze this Google Sheets data (multiple tabs: ${tabs?.join(', ')}) and extract ALL financial transactions.

SHEET DATA:
${rawText}

Extract:
1. EXPENSES: Any costs, payments, purchases, salaries, bills, operational costs, setup costs
2. INVOICES: Any revenue, income, sales, client payments received

For each EXPENSE return:
- title: short description of the item
- amount: numeric value only (convert PKR/local to number as-is)
- category: one of [marketing, salaries, software, operations, equipment, taxes, travel, legal, misc]
- date: YYYY-MM-DD format (derive from sheet context like "JUNE" = ${today.slice(0,4)}-06-01, if unclear use ${today})
- notes: any extra context
- status: "approved"
- recurring: false

For each INVOICE return:
- title: description
- amount: numeric value
- total_amount: same as amount
- tax_amount: 0
- recipient_name: client name or "Unknown"
- recipient_email: ""
- due_date: YYYY-MM-DD (derive from context, else ${today})
- status: "paid" if already received, else "sent"
- invoice_number: if available else "INV-001"
- type: "external"
- notes: any extra info

Today: ${today}

Return ONLY valid JSON:
{
  "summary": "brief summary of what was found across all tabs",
  "expenses": [...],
  "invoices": [...]
}`,
      model: 'claude_sonnet_4_6',
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          expenses: { type: 'array', items: { type: 'object' } },
          invoices: { type: 'array', items: { type: 'object' } },
        },
      },
    });
    setExtractedData(result);
    onExtracted(result);
    setAnalyzing(false);
  };

  if (loadingSheets) return (
    <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading your Google Sheets...
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Sheet list */}
      {!selectedSheet || extractedData ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Select a spreadsheet to import:</p>
            <button onClick={loadSheets} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
          {sheets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No Google Sheets found in your Drive.</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {sheets.map(sheet => (
                <button
                  key={sheet.id}
                  onClick={() => handleSelectSheet(sheet)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center gap-3 ${selectedSheet?.id === sheet.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary hover:bg-primary/5'}`}
                >
                  <Table2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{sheet.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(sheet.modifiedTime).toLocaleDateString()}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Loading state */}
      {(fetching || analyzing) && (
        <div className="flex flex-col items-center justify-center py-6 gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium">{fetching ? 'Fetching sheet data...' : 'AI is analyzing all tabs...'}</p>
          {analyzing && <p className="text-xs text-center text-muted-foreground max-w-xs">Reading all tabs and extracting expenses, invoices, and financial records</p>}
        </div>
      )}

      {/* Results */}
      {extractedData && !analyzing && (
        <div className="space-y-3">
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-foreground">{extractedData.summary}</p>
              <button onClick={() => { setSelectedSheet(null); setExtractedData(null); onExtracted(null); }}
                className="text-xs text-primary hover:underline mt-1">← Choose different sheet</button>
            </div>
          </div>

          <p className="text-xs text-green-600 font-medium text-center">✓ Data extracted — preview shown below</p>
        </div>
      )}
    </div>
  );
}