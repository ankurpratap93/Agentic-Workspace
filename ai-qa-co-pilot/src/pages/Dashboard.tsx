import { AppLayout } from '@/components/layout/AppLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { AgentStatusCard } from '@/components/dashboard/AgentStatusCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { ProjectsOverview } from '@/components/dashboard/ProjectsOverview';
import { agents } from '@/data/mockAgents';
import { FileCheck, Bug, Bot, TrendingUp, Link2, Loader2 } from 'lucide-react';
import { useTestCases } from '@/hooks/useTestCases';
import { useBugs } from '@/hooks/useBugs';
import { useMemo } from 'react';

export default function Dashboard() {
  const activeAgents = agents.filter((a) => a.status === 'active' || a.status === 'processing').length;
  
  // Fetch real data
  const { data: testCases = [], isLoading: testCasesLoading } = useTestCases();
  const { data: bugs = [], isLoading: bugsLoading } = useBugs();

  // Calculate metrics from real data
  const metrics = useMemo(() => {
    const totalTestCases = testCases.length;
    const activeBugs = bugs.filter(b => b.status === 'active' || b.status === 'new').length;
    const syncedBugs = bugs.filter(b => b.sync_status === 'synced').length;
    
    // Calculate pass rate (mock calculation - would need test execution data)
    // For now, using a placeholder calculation
    const approvedTestCases = testCases.filter(tc => tc.status === 'approved').length;
    const passRate = totalTestCases > 0 
      ? ((approvedTestCases / totalTestCases) * 100).toFixed(1)
      : '0.0';

    return {
      totalTestCases,
      activeBugs,
      passRate,
      syncedBugs,
    };
  }, [testCases, bugs]);

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <AppLayout title="Dashboard" subtitle="QA Intelligence Platform Overview">
      <div className="space-y-6">
        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {testCasesLoading || bugsLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-6 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ))}
            </>
          ) : (
            <>
              <MetricCard
                title="Total Test Cases"
                value={formatNumber(metrics.totalTestCases)}
                change={metrics.totalTestCases > 0 ? 12 : undefined}
                changeLabel={metrics.totalTestCases > 0 ? "vs last month" : undefined}
                icon={<FileCheck className="h-5 w-5" />}
                variant="default"
              />
              <MetricCard
                title="Active Bugs"
                value={formatNumber(metrics.activeBugs)}
                change={metrics.activeBugs > 0 ? -8 : undefined}
                changeLabel={metrics.activeBugs > 0 ? "vs last week" : undefined}
                icon={<Bug className="h-5 w-5" />}
                variant="destructive"
              />
              <MetricCard
                title="Pass Rate"
                value={`${metrics.passRate}%`}
                change={parseFloat(metrics.passRate) > 0 ? 3.2 : undefined}
                changeLabel={parseFloat(metrics.passRate) > 0 ? "improvement" : undefined}
                icon={<TrendingUp className="h-5 w-5" />}
                variant="success"
              />
              <MetricCard
                title="Azure Synced"
                value={formatNumber(metrics.syncedBugs)}
                icon={<Link2 className="h-5 w-5" />}
                variant="info"
              />
            </>
          )}
        </div>

        {/* AI Agents Status */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">AI Agents</h2>
                <p className="text-sm text-muted-foreground">
                  {activeAgents} of {agents.length} agents active
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
            {agents.map((agent) => (
              <AgentStatusCard key={agent.id} agent={agent} compact />
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ProjectsOverview />
          <RecentActivity />
        </div>
      </div>
    </AppLayout>
  );
}
