import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, AlertTriangle, Activity } from "lucide-react";

interface TestCoverageReportProps {
  testCases: any[];
}

export const TestCoverageReport = ({ testCases }: TestCoverageReportProps) => {
  if (!testCases || testCases.length === 0) return null;

  // Coverage by type
  const coverageByType: Record<string, { total: number; passed: number; failed: number }> = {};
  testCases.forEach(tc => {
    if (!coverageByType[tc.test_type]) {
      coverageByType[tc.test_type] = { total: 0, passed: 0, failed: 0 };
    }
    coverageByType[tc.test_type].total++;
    if (tc.status === 'passed') coverageByType[tc.test_type].passed++;
    else coverageByType[tc.test_type].failed++;
  });

  // Coverage by severity
  const coverageBySeverity: Record<string, { total: number; passed: number; failed: number }> = {};
  testCases.forEach(tc => {
    const severity = tc.severity || 'medium';
    if (!coverageBySeverity[severity]) {
      coverageBySeverity[severity] = { total: 0, passed: 0, failed: 0 };
    }
    coverageBySeverity[severity].total++;
    if (tc.status === 'passed') coverageBySeverity[severity].passed++;
    else coverageBySeverity[severity].failed++;
  });

  const overallPassRate = testCases.length > 0 
    ? Math.round((testCases.filter(tc => tc.status === 'passed').length / testCases.length) * 100)
    : 0;

  const criticalPassRate = coverageBySeverity['critical']
    ? Math.round((coverageBySeverity['critical'].passed / coverageBySeverity['critical'].total) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Overall Coverage Summary */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-6 h-6 text-primary" />
          <h3 className="text-2xl font-bold">Test Coverage Report</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Pass Rate</span>
              <span className="text-2xl font-bold text-primary">{overallPassRate}%</span>
            </div>
            <Progress value={overallPassRate} className="h-3" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{testCases.filter(tc => tc.status === 'passed').length} passed</span>
              <span>{testCases.filter(tc => tc.status === 'failed').length} failed</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Critical Tests Pass Rate</span>
              <span className={`text-2xl font-bold ${criticalPassRate === 100 ? 'text-success' : 'text-destructive'}`}>
                {criticalPassRate}%
              </span>
            </div>
            <Progress value={criticalPassRate} className="h-3" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{coverageBySeverity['critical']?.passed || 0} passed</span>
              <span>{coverageBySeverity['critical']?.failed || 0} failed</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Coverage by Test Type */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-4">Coverage by Test Type</h3>
        <div className="space-y-4">
          {Object.entries(coverageByType)
            .sort((a, b) => b[1].total - a[1].total)
            .map(([type, stats]) => {
              const passRate = Math.round((stats.passed / stats.total) * 100);
              return (
                <div key={type} className="p-4 bg-background/50 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{type}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {stats.total} tests
                      </span>
                    </div>
                    <span className={`font-semibold ${passRate >= 80 ? 'text-success' : passRate >= 60 ? 'text-warning' : 'text-destructive'}`}>
                      {passRate}%
                    </span>
                  </div>
                  <Progress value={passRate} className="h-2 mb-2" />
                  <div className="flex gap-4 text-xs">
                    <span className="flex items-center gap-1 text-success">
                      <CheckCircle className="w-3 h-3" />
                      {stats.passed} passed
                    </span>
                    <span className="flex items-center gap-1 text-destructive">
                      <XCircle className="w-3 h-3" />
                      {stats.failed} failed
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </Card>

      {/* Coverage by Severity */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-4">Coverage by Severity</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {['critical', 'high', 'medium', 'low'].map(severity => {
            const stats = coverageBySeverity[severity];
            if (!stats) return null;
            
            const passRate = Math.round((stats.passed / stats.total) * 100);
            const Icon = severity === 'critical' ? AlertTriangle : 
                        severity === 'high' ? XCircle :
                        severity === 'medium' ? Activity : CheckCircle;
            
            return (
              <div key={severity} className="p-4 bg-background/50 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-5 h-5 ${
                    severity === 'critical' ? 'text-destructive' :
                    severity === 'high' ? 'text-warning' :
                    severity === 'medium' ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <Badge 
                    variant={severity === 'critical' || severity === 'high' ? 'destructive' : 'outline'}
                    className="capitalize"
                  >
                    {severity}
                  </Badge>
                </div>
                <div className="text-3xl font-bold mb-1">{stats.total}</div>
                <div className="text-sm text-muted-foreground mb-2">Total Tests</div>
                <Progress value={passRate} className="h-2 mb-2" />
                <div className="flex justify-between text-xs">
                  <span className="text-success">{stats.passed} ✓</span>
                  <span className="text-destructive">{stats.failed} ✗</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Failed Tests Breakdown */}
      {testCases.filter(tc => tc.status === 'failed').length > 0 && (
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-destructive/30">
          <h3 className="text-xl font-bold mb-4 text-destructive">Failed Tests Requiring Attention</h3>
          <div className="space-y-3">
            {testCases
              .filter(tc => tc.status === 'failed')
              .sort((a, b) => {
                const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                return severityOrder[a.severity as keyof typeof severityOrder] - 
                       severityOrder[b.severity as keyof typeof severityOrder];
              })
              .slice(0, 10)
              .map((tc, idx) => (
                <div key={idx} className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{tc.test_name}</span>
                        <Badge variant="destructive" className="capitalize">
                          {tc.severity || 'medium'}
                        </Badge>
                        <Badge variant="outline">{tc.test_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{tc.description}</p>
                      {tc.error_message && (
                        <p className="text-xs text-destructive mt-2 font-mono bg-destructive/5 p-2 rounded">
                          {tc.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
};
