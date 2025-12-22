import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Clock, FileText, Sparkles, Loader2, Download, Image, Eye, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
async function fetchRun(runId: string) {
  const r = await fetch(`/api/test_runs/${runId}`);
  if (!r.ok) throw new Error("Run not found");
  return r.json();
}
async function fetchCases(runId: string) {
  const r = await fetch(`/api/test_cases?test_run_id=${encodeURIComponent(runId)}`);
  if (!r.ok) return [];
  return r.json();
}
async function fetchInsights(runId: string) {
  const r = await fetch(`/api/test_insights?test_run_id=${encodeURIComponent(runId)}`);
  if (!r.ok) return [];
  return r.json();
}
async function fetchRecordingSteps(runId: string) {
  // Get first recording, then steps
  const recRes = await fetch(`/api/test_recordings?test_run_id=${encodeURIComponent(runId)}`);
  const recs = recRes.ok ? await recRes.json() : [];
  if (!recs?.length) return [];
  const stepsRes = await fetch(`/api/test_recording_steps?recording_id=${encodeURIComponent(recs[0].id)}`);
  return stepsRes.ok ? await stepsRes.json() : [];
}
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
interface ResultsProps {
  testRunId: string | null;
}

export const Results = ({ testRunId }: ResultsProps) => {
  const [testRun, setTestRun] = useState<any>(null);
  const [testCases, setTestCases] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [recordingSteps, setRecordingSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadResults = async () => {
      if (!testRunId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);

      try {
        const runData = await fetchRun(testRunId);
        setTestRun(runData);

        const [casesData, insightsData, steps] = await Promise.all([
          fetchCases(testRunId),
          fetchInsights(testRunId),
          fetchRecordingSteps(testRunId)
        ]);
        setTestCases(casesData || []);
        setInsights(insightsData || []);
        setRecordingSteps(steps || []);

        if (runData?.status === 'running' || runData?.status === 'executing_tests' || runData?.status === 'generating_tests') {
          const interval = setInterval(async () => {
            const updated = await fetchRun(testRunId).catch(() => null);
            if (updated && updated.status === 'completed') {
              setTestRun(updated);
              const [newCases, newInsights, newSteps] = await Promise.all([
                fetchCases(testRunId),
                fetchInsights(testRunId),
                fetchRecordingSteps(testRunId)
              ]);
              setTestCases(newCases || []);
              setInsights(newInsights || []);
              setRecordingSteps(newSteps || []);
              clearInterval(interval);
              toast({
                title: "Tests Completed",
                description: `${updated.total_tests} tests executed in ${(updated.execution_time / 1000).toFixed(1)}s`,
              });
            }
          }, 3000);
          return () => clearInterval(interval);
        }
      } catch (error: any) {
        console.error('Error loading results:', error);
        toast({
          title: "Error",
          description: "Failed to load test results",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [testRunId, toast]);

  if (loading) {
    return (
      <section id="results" className="py-20 px-6">
        <div className="container mx-auto text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </section>
    );
  }

  if (!testRun) {
    return null;
  }

  const stats = [
    { label: "Total Tests", value: testRun.total_tests?.toString() || "0", icon: FileText, color: "text-primary" },
    { label: "Passed", value: testRun.passed_tests?.toString() || "0", icon: CheckCircle, color: "text-success" },
    { label: "Failed", value: testRun.failed_tests?.toString() || "0", icon: XCircle, color: "text-destructive" },
    { label: "Pages Found", value: testRun.total_pages?.toString() || "0", icon: AlertTriangle, color: "text-warning" },
  ];

  // Group test cases by type
  const testCasesByType: Record<string, { passed: number; failed: number; total: number }> = {};
  testCases.forEach(tc => {
    if (!testCasesByType[tc.test_type]) {
      testCasesByType[tc.test_type] = { passed: 0, failed: 0, total: 0 };
    }
    testCasesByType[tc.test_type].total++;
    if (tc.status === 'passed') {
      testCasesByType[tc.test_type].passed++;
    } else if (tc.status === 'failed') {
      testCasesByType[tc.test_type].failed++;
    }
  });

  const categories = Object.entries(testCasesByType).map(([name, data]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    ...data
  }));

  return (
    <section id="results" className="py-20 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Test Results</h2>
          <p className="text-xl text-muted-foreground">
            {testRun.status === 'running' ? 'Running...' : `Completed in ${(testRun.execution_time / 1000).toFixed(1)}s`} • Website: {testRun.url}
          </p>
          {testRun.status === 'running' && (
            <div className="mt-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-sm font-medium">AI agent is analyzing your website...</span>
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card 
              key={index}
              className="p-6 bg-card/50 backdrop-blur-sm border-border/50"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            </Card>
          ))}
        </div>

        {/* Test Categories */}
        {categories.length > 0 && (
          <Card className="p-6 mb-8 bg-card/50 backdrop-blur-sm">
            <h3 className="text-2xl font-bold mb-6">Test Categories</h3>
            <div className="space-y-4">
              {categories.map((category, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-lg border border-border bg-background/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{category.name}</h4>
                    <Badge variant="outline">
                      {Math.round((category.passed / category.total) * 100)}% Pass Rate
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-success" />
                      {category.passed} passed
                    </span>
                    <span className="flex items-center gap-1">
                      <XCircle className="w-4 h-4 text-destructive" />
                      {category.failed} failed
                    </span>
                    <span className="text-muted-foreground">
                      Total: {category.total}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Detailed Test Cases with Tabs */}
        {testCases.length > 0 && (
          <Card className="p-6 mb-8 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Test Case Details</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const csv = generateCSV();
                  downloadCSV(csv, `test-results-${testRun.id}.csv`);
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
            
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Tests ({testCases.length})</TabsTrigger>
                <TabsTrigger value="failed" className="text-destructive">
                  Failed ({testCases.filter(t => t.status === 'failed').length})
                </TabsTrigger>
                <TabsTrigger value="passed" className="text-success">
                  Passed ({testCases.filter(t => t.status === 'passed').length})
                </TabsTrigger>
              </TabsList>

              {['all', 'failed', 'passed'].map((tabValue) => (
                <TabsContent key={tabValue} value={tabValue}>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">Status</TableHead>
                          <TableHead>Test Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Details</TableHead>
                          <TableHead className="w-[100px]">Screenshot</TableHead>
                          <TableHead className="text-right w-[80px]">Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {testCases
                          .filter(tc => tabValue === 'all' || tc.status === tabValue)
                          .map((testCase) => {
                            const step = recordingSteps.find(s => s.test_case_id === testCase.id);
                            return (
                              <TableRow key={testCase.id} className={testCase.status === 'failed' ? 'bg-destructive/5' : ''}>
                                <TableCell>
                                  {testCase.status === 'passed' ? (
                                    <CheckCircle className="w-5 h-5 text-success" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-destructive" />
                                  )}
                                </TableCell>
                                <TableCell className="font-medium max-w-[200px]">
                                  <div className="truncate" title={testCase.test_name}>
                                    {testCase.test_name}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{testCase.test_type}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={
                                      testCase.severity === 'critical' || testCase.severity === 'high' 
                                        ? 'destructive' 
                                        : testCase.severity === 'medium'
                                        ? 'default'
                                        : 'secondary'
                                    }
                                  >
                                    {testCase.severity || 'medium'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-[300px]">
                                  <div className="text-sm text-muted-foreground truncate" title={testCase.description}>
                                    {testCase.description}
                                  </div>
                                  {testCase.error_message && (
                                    <div className="mt-2 p-2 bg-destructive/10 border border-destructive/30 rounded text-destructive text-xs">
                                      <strong>Error:</strong> {testCase.error_message}
                                    </div>
                                  )}
                                  {testCase.expected_result && (
                                    <div className="mt-1 text-xs">
                                      <span className="text-muted-foreground">Expected: </span>
                                      <span>{testCase.expected_result}</span>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {step?.screenshot_url ? (
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="p-1" onClick={() => setSelectedTest(testCase)}>
                                          <Camera className={`w-4 h-4 ${testCase.status === 'failed' ? 'text-destructive' : 'text-muted-foreground'}`} />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-4xl">
                                        <DialogHeader>
                                          <DialogTitle className="flex items-center gap-2">
                                            {testCase.status === 'passed' ? (
                                              <CheckCircle className="w-5 h-5 text-success" />
                                            ) : (
                                              <XCircle className="w-5 h-5 text-destructive" />
                                            )}
                                            {testCase.test_name}
                                          </DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <div className="rounded-lg overflow-hidden border">
                                            <img 
                                              src={step.screenshot_url} 
                                              alt={`Screenshot for ${testCase.test_name}`}
                                              className="w-full h-auto"
                                            />
                                          </div>
                                          <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                              <strong>Type:</strong> {testCase.test_type}
                                            </div>
                                            <div>
                                              <strong>Severity:</strong> {testCase.severity}
                                            </div>
                                            <div className="col-span-2">
                                              <strong>Description:</strong> {testCase.description}
                                            </div>
                                            {testCase.expected_result && (
                                              <div className="col-span-2">
                                                <strong>Expected Result:</strong> {testCase.expected_result}
                                              </div>
                                            )}
                                            {step.actual_result && (
                                              <div className="col-span-2">
                                                <strong>Actual Result:</strong> {step.actual_result}
                                              </div>
                                            )}
                                            {testCase.error_message && (
                                              <div className="col-span-2 p-3 bg-destructive/10 border border-destructive/30 rounded">
                                                <strong className="text-destructive">Error:</strong> {testCase.error_message}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right text-sm">{testCase.execution_time}ms</TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </Card>
        )}

        {/* Failed Tests Summary with Screenshots */}
        {testCases.filter(t => t.status === 'failed').length > 0 && (
          <Card className="p-6 mb-8 bg-destructive/5 border-destructive/30">
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="w-6 h-6 text-destructive" />
              <h3 className="text-2xl font-bold text-destructive">Failed Test Summary</h3>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {testCases
                .filter(t => t.status === 'failed')
                .slice(0, 6)
                .map((testCase) => {
                  const step = recordingSteps.find(s => s.test_case_id === testCase.id);
                  return (
                    <Card key={testCase.id} className="p-4 bg-card border-destructive/20">
                      <div className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate text-sm" title={testCase.test_name}>
                            {testCase.test_name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {testCase.error_message || testCase.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">{testCase.test_type}</Badge>
                            <Badge variant="destructive" className="text-xs">{testCase.severity}</Badge>
                          </div>
                          {step?.screenshot_url && (
                            <div className="mt-3 rounded overflow-hidden border border-destructive/20">
                              <img 
                                src={step.screenshot_url} 
                                alt="Failure screenshot"
                                className="w-full h-24 object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
            </div>
            
            {testCases.filter(t => t.status === 'failed').length > 6 && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                And {testCases.filter(t => t.status === 'failed').length - 6} more failed tests...
              </p>
            )}
          </Card>
        )}

        {/* AI Insights */}
        {insights.length > 0 && (
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/30">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
              <h3 className="text-2xl font-bold">AI-Generated Insights</h3>
            </div>
            
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-lg border border-border bg-background/50"
                >
                  <div className="flex items-start gap-3">
                    <Badge 
                      variant={
                        insight.severity === 'high' ? 'destructive' : 
                        insight.severity === 'medium' ? 'default' : 
                        'secondary'
                      }
                    >
                      {insight.severity}
                    </Badge>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </section>
  );

  function generateCSV() {
    const headers = ['Status', 'Test Name', 'Type', 'Severity', 'Description', 'Execution Time (ms)', 'Error Message'];
    const rows = testCases.map(tc => [
      tc.status,
      tc.test_name,
      tc.test_type,
      tc.severity || 'medium',
      tc.description || '',
      tc.execution_time || '',
      tc.error_message || ''
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  }

  function downloadCSV(csv: string, filename: string) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
};