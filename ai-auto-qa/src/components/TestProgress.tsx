import { useEffect, useState } from "react";
async function fetchProgressLocal(testRunId: string) {
  const res = await fetch(`/api/progress/${testRunId}`);
  if (!res.ok) throw new Error(`Progress fetch failed (${res.status})`);
  return res.json();
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

interface TestProgressProps {
  testRunId: string;
}

interface TestRun {
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  status: string;
  browser?: string;
  framework?: string;
  headless?: boolean;
}

export const TestProgress = ({ testRunId }: TestProgressProps) => {
  const [progress, setProgress] = useState({
    total: 0,
    passed: 0,
    failed: 0,
    pending: 0,
    status: 'pending' as string,
    currentTest: '',
    browser: '',
    framework: '',
    headless: true,
  });

  useEffect(() => {
    // Poll local backend every 2s
    fetchProgress();
    const id = setInterval(fetchProgress, 2000);
    return () => clearInterval(id);
  }, [testRunId]);

  const fetchProgress = async () => {
    try {
      const p = await fetchProgressLocal(testRunId);
      const pending = (p.total ?? 0) - (p.passed ?? 0) - (p.failed ?? 0);
      setProgress({
        total: p.total ?? 0,
        passed: p.passed ?? 0,
        failed: p.failed ?? 0,
        pending: pending > 0 ? pending : 0,
        status: p.status ?? 'pending',
        currentTest: p.currentTest ?? '',
        browser: p.browser ?? '',
        framework: p.framework ?? '',
        headless: p.headless !== false,
      });
    } catch {
      // Ignore transient errors while polling
    }
  };

  const progressPercentage = progress.total > 0 
    ? ((progress.passed + progress.failed) / progress.total) * 100 
    : 0;

  const getStatusBadge = () => {
    switch (progress.status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'generating_tests':
        return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Generating Tests</Badge>;
      case 'executing_tests':
        return <Badge variant="default"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Executing Tests</Badge>;
      case 'completed':
        return <Badge variant="default"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">{progress.status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Test Execution Progress</CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
          </div>
        </div>
        {progress.browser && (
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground flex-wrap">
            <Badge variant="outline" className="capitalize">
              {progress.browser}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {progress.framework}
            </Badge>
            {!progress.headless && (
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                🔍 Headed Mode - Browser UI Visible
              </Badge>
            )}
            {progress.headless && (
              <Badge variant="outline">
                Headless Mode
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!progress.headless && (
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="text-blue-600 text-xl mt-0.5">🖥️</div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-blue-600 mb-1">Headed Mode Active</div>
                <div className="text-xs text-muted-foreground">
                  Tests are configured to run in <strong>visible browser mode</strong>. This means browser automation would display the UI during execution, 
                  allowing you to observe test interactions in real-time. Currently showing AI-generated test analysis and simulation.
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="text-amber-600 mt-0.5">ℹ️</div>
            <div className="text-xs text-muted-foreground">
              <strong>Note:</strong> This system uses AI to generate comprehensive test cases based on your website. 
              Tests are simulated for demonstration. For actual browser automation with live execution, 
              integrate with Playwright/Selenium frameworks directly.
            </div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Progress: {progress.passed + progress.failed} / {progress.total}</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="text-2xl font-bold text-green-600">{progress.passed}</div>
            <div className="text-xs text-muted-foreground">Passed</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="text-2xl font-bold text-red-600">{progress.failed}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="text-2xl font-bold text-yellow-600">{progress.pending}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
        </div>

        {progress.currentTest && progress.status === 'executing_tests' && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Currently Testing:</div>
            <div className="text-sm font-medium flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {progress.currentTest}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
