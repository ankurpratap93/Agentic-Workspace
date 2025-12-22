import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
async function fetchRun(runId: string) {
  const r = await fetch(`/api/test_runs/${runId}`);
  if (!r.ok) throw new Error('Failed to load run');
  return r.json();
}
async function fetchCases(runId: string) {
  const r = await fetch(`/api/test_cases?test_run_id=${encodeURIComponent(runId)}`);
  if (!r.ok) return [];
  return r.json();
}

export default function Compare() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [run1, setRun1] = useState<any>(null);
  const [run2, setRun2] = useState<any>(null);
  const [cases1, setCases1] = useState<any[]>([]);
  const [cases2, setCases2] = useState<any[]>([]);

  useEffect(() => {
    loadComparison();
  }, []);

  const loadComparison = async () => {
    const runId1 = searchParams.get('run1');
    const runId2 = searchParams.get('run2');

    if (!runId1 || !runId2) return;

    const r1 = await fetchRun(runId1);
    const r2 = await fetchRun(runId2);
    const c1 = await fetchCases(runId1);
    const c2 = await fetchCases(runId2);

    setRun1(r1);
    setRun2(r2);
    setCases1(c1 || []);
    setCases2(c2 || []);
  };

  if (!run1 || !run2) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const compareMetric = (val1: number, val2: number) => {
    if (val1 > val2) return { icon: TrendingUp, color: "text-success" };
    if (val1 < val2) return { icon: TrendingDown, color: "text-destructive" };
    return { icon: Minus, color: "text-muted-foreground" };
  };

  const passRate1 = run1.total_tests ? ((run1.passed_tests / run1.total_tests) * 100).toFixed(1) : 0;
  const passRate2 = run2.total_tests ? ((run2.passed_tests / run2.total_tests) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto px-6 py-12">
        <Button variant="ghost" onClick={() => navigate("/history")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to History
        </Button>
        
        <h1 className="text-4xl font-bold mb-8">Compare Test Runs</h1>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 bg-card/50 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-4">Run 1</h2>
            <div className="space-y-2">
              <p><strong>URL:</strong> {run1.url}</p>
              <p><strong>Date:</strong> {new Date(run1.created_at).toLocaleString()}</p>
              <p><strong>Browser:</strong> <Badge variant="outline">{run1.browser}</Badge></p>
              <p><strong>Depth:</strong> <Badge variant="outline">{run1.depth}</Badge></p>
              <p><strong>Status:</strong> <Badge>{run1.status}</Badge></p>
            </div>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-4">Run 2</h2>
            <div className="space-y-2">
              <p><strong>URL:</strong> {run2.url}</p>
              <p><strong>Date:</strong> {new Date(run2.created_at).toLocaleString()}</p>
              <p><strong>Browser:</strong> <Badge variant="outline">{run2.browser}</Badge></p>
              <p><strong>Depth:</strong> <Badge variant="outline">{run2.depth}</Badge></p>
              <p><strong>Status:</strong> <Badge>{run2.status}</Badge></p>
            </div>
          </Card>
        </div>

        <Card className="p-6 bg-card/50 backdrop-blur-sm mb-8">
          <h2 className="text-2xl font-bold mb-6">Metrics Comparison</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { label: 'Total Tests', v1: run1.total_tests, v2: run2.total_tests },
              { label: 'Passed Tests', v1: run1.passed_tests, v2: run2.passed_tests },
              { label: 'Failed Tests', v1: run1.failed_tests, v2: run2.failed_tests },
              { label: 'Pages Found', v1: run1.total_pages, v2: run2.total_pages }
            ].map((metric, idx) => {
              const trend = compareMetric(metric.v1, metric.v2);
              return (
                <div key={idx} className="p-4 bg-background/50 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-2">{metric.label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{metric.v1}</span>
                    <trend.icon className={`w-5 h-5 ${trend.color}`} />
                    <span className="text-2xl font-bold">{metric.v2}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6 bg-card/50 backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-6">Pass Rate Comparison</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-background/50 rounded-lg border border-border">
              <p className="text-lg font-semibold mb-2">Run 1</p>
              <p className="text-4xl font-bold text-primary">{passRate1}%</p>
            </div>
            <div className="p-6 bg-background/50 rounded-lg border border-border">
              <p className="text-lg font-semibold mb-2">Run 2</p>
              <p className="text-4xl font-bold text-primary">{passRate2}%</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
