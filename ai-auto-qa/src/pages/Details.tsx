import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Results } from "@/components/Results";
import { PageAnalysis } from "@/components/PageAnalysis";
import { TestCoverageReport } from "@/components/TestCoverageReport";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Details() {
  const { runId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [testRun, setTestRun] = useState<any>(null);
  const [testCases, setTestCases] = useState<any[]>([]);
  const [discoveredPages, setDiscoveredPages] = useState<any[]>([]);

  useEffect(() => {
    loadDetails();
  }, [runId]);

  const loadDetails = async () => {
    if (!runId) return;

    const { data: runData } = await supabase
      .from('test_runs')
      .select('*')
      .eq('id', runId)
      .single();

    const { data: casesData } = await supabase
      .from('test_cases')
      .select('*')
      .eq('test_run_id', runId);

    const { data: pagesData } = await supabase
      .from('discovered_pages')
      .select('*')
      .eq('test_run_id', runId);

    setTestRun(runData);
    setTestCases(casesData || []);
    setDiscoveredPages(pagesData || []);
  };

  const exportPDF = () => {
    if (!testRun) return;

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Test Report', 14, 20);
    
    // Test Run Info
    doc.setFontSize(12);
    doc.text(`URL: ${testRun.url}`, 14, 35);
    doc.text(`Status: ${testRun.status}`, 14, 42);
    doc.text(`Date: ${new Date(testRun.created_at).toLocaleString()}`, 14, 49);
    doc.text(`Browser: ${testRun.browser || 'chromium'}`, 14, 56);
    doc.text(`Depth: ${testRun.depth || 'standard'}`, 14, 63);
    
    // Summary
    doc.text('Summary:', 14, 75);
    doc.text(`Total Tests: ${testRun.total_tests || 0}`, 20, 82);
    doc.text(`Passed: ${testRun.passed_tests || 0}`, 20, 89);
    doc.text(`Failed: ${testRun.failed_tests || 0}`, 20, 96);
    doc.text(`Pages Found: ${testRun.total_pages || 0}`, 20, 103);
    
    // Test Cases Table
    const tableData = testCases.map(tc => [
      tc.test_name,
      tc.test_type,
      tc.status,
      `${tc.execution_time || 0}ms`
    ]);
    
    autoTable(doc, {
      startY: 115,
      head: [['Test Name', 'Type', 'Status', 'Time']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`test-report-${testRun.id}.pdf`);
    
    toast({
      title: "PDF Exported",
      description: "Test report downloaded successfully"
    });
  };

  if (!testRun) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="ghost" onClick={() => navigate("/history")} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to History
            </Button>
            <h1 className="text-4xl font-bold">Test Details</h1>
            <p className="text-muted-foreground mt-2">{testRun.url}</p>
          </div>
          <Button onClick={exportPDF} variant="hero">
            <Download className="w-4 h-4 mr-2" />
            Export PDF Report
          </Button>
        </div>

        <TestCoverageReport testCases={testCases} />
        <Results testRunId={runId || null} />
        <PageAnalysis pages={discoveredPages} />
      </div>
    </div>
  );
}
