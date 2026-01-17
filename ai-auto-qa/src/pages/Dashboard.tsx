import { AppLayout } from '@/components/layout/AppLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { AgentStatusCard } from '@/components/dashboard/AgentStatusCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { ProjectsOverview } from '@/components/dashboard/ProjectsOverview';
import { agents } from '@/data/mockAgents';
import { FileCheck, Bug, Bot, TrendingUp, Link2, FolderKanban } from 'lucide-react';

export default function Dashboard() {
  const activeAgents = agents.filter((a) => a.status === 'active' || a.status === 'processing').length;

  return (
    <AppLayout title="Dashboard" subtitle="QA Intelligence Platform Overview">
      <div className="space-y-6">
        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Test Cases"
            value="1,247"
            change={12}
            changeLabel="vs last month"
            icon={<FileCheck className="h-5 w-5" />}
            variant="default"
          />
          <MetricCard
            title="Active Bugs"
            value="46"
            change={-8}
            changeLabel="vs last week"
            icon={<Bug className="h-5 w-5" />}
            variant="destructive"
          />
          <MetricCard
            title="Pass Rate"
            value="87.3%"
            change={3.2}
            changeLabel="improvement"
            icon={<TrendingUp className="h-5 w-5" />}
            variant="success"
          />
          <MetricCard
            title="Azure Synced"
            value="234"
            icon={<Link2 className="h-5 w-5" />}
            variant="info"
          />
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
