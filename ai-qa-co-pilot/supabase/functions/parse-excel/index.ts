import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple CSV parser
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }
  
  return rows;
}

// Map column names to standard fields
function mapColumns(rows: Record<string, string>[]): { mappings: Record<string, string>; testCases: any[] } {
  if (rows.length === 0) return { mappings: {}, testCases: [] };
  
  const headers = Object.keys(rows[0]);
  const mappings: Record<string, string> = {};
  
  // Standard field patterns
  const fieldPatterns: Record<string, RegExp[]> = {
    test_case_id: [/^(test\s*)?id$/i, /^test\s*case\s*id$/i, /^tc\s*id$/i, /^#$/i],
    title: [/^title$/i, /^name$/i, /^test\s*name$/i, /^test\s*case\s*name$/i, /^summary$/i],
    description: [/^desc(ription)?$/i, /^details$/i],
    preconditions: [/^precond(ition)?s?$/i, /^pre[\s-]?req(uisite)?s?$/i, /^setup$/i],
    steps: [/^steps?$/i, /^test\s*steps?$/i, /^procedure$/i, /^actions?$/i],
    expected_result: [/^expected(\s*result)?$/i, /^expected\s*outcome$/i, /^result$/i],
    priority: [/^priority$/i, /^prio$/i, /^importance$/i],
    test_type: [/^type$/i, /^test\s*type$/i, /^category$/i],
    tags: [/^tags?$/i, /^labels?$/i, /^keywords?$/i],
  };
  
  // Match headers to fields
  for (const header of headers) {
    for (const [field, patterns] of Object.entries(fieldPatterns)) {
      if (patterns.some(p => p.test(header))) {
        mappings[header] = field;
        break;
      }
    }
  }
  
  // Convert rows to test cases
  const testCases = rows.map((row, idx) => {
    const tc: any = {
      test_case_id: `TC-${String(idx + 1).padStart(3, '0')}`,
      title: '',
      description: '',
      preconditions: '',
      steps: [],
      expected_result: '',
      priority: 'medium',
      test_type: 'functional',
      tags: [],
    };
    
    for (const [header, value] of Object.entries(row)) {
      const field = mappings[header];
      if (field) {
        if (field === 'steps') {
          // Parse steps as numbered list
          const stepLines = value.split(/\d+\.\s*/).filter(s => s.trim());
          tc.steps = stepLines.map((s, i) => ({
            step: i + 1,
            action: s.trim(),
            expected: ''
          }));
        } else if (field === 'tags') {
          tc.tags = value.split(/[,;]/).map(t => t.trim()).filter(Boolean);
        } else if (field === 'priority') {
          const normalized = value.toLowerCase();
          tc.priority = ['low', 'medium', 'high', 'critical'].includes(normalized) ? normalized : 'medium';
        } else if (field === 'test_type') {
          const normalized = value.toLowerCase();
          tc.test_type = ['functional', 'regression', 'integration', 'performance', 'security', 'usability'].includes(normalized) ? normalized : 'functional';
        } else {
          tc[field] = value;
        }
      }
    }
    
    return tc;
  });
  
  return { mappings, testCases };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error("No file uploaded");
    }
    
    const fileName = file.name.toLowerCase();
    let rows: Record<string, string>[] = [];
    
    if (fileName.endsWith('.csv')) {
      const content = await file.text();
      rows = parseCSV(content);
    } else if (fileName.endsWith('.xlsx')) {
      // For XLSX, we need to use a library or ask client to convert
      // For now, return an error suggesting CSV
      return new Response(JSON.stringify({ 
        error: "XLSX parsing requires additional processing. Please convert to CSV or use the column mapping preview.",
        suggestion: "convert_to_csv"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      throw new Error("Unsupported file format. Please upload .csv or .xlsx files.");
    }
    
    const { mappings, testCases } = mapColumns(rows);
    
    return new Response(JSON.stringify({
      success: true,
      rowCount: rows.length,
      headers: Object.keys(rows[0] || {}),
      mappings,
      testCases,
      preview: testCases.slice(0, 5)
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});