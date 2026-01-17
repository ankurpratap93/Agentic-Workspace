import { AppLayout } from '@/components/layout/AppLayout';
import { AgentStatusCard } from '@/components/dashboard/AgentStatusCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { agents } from '@/data/mockAgents';
import { Play, Pause, RefreshCw, Settings, Bot } from 'lucide-react';

export default function Agents() {
  const activeAgents = agents.filter((a) => a.status === 'active' || a.status === 'processing');
  const idleAgents = agents.filter((a) => a.status === 'idle');

  return (
    <AppLayout title="AI Agents" subtitle="Monitor and manage your intelligent QA agents">
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="rounded-xl gradient-primary p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-foreground/20">
                <Bot className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-primary-foreground">
                  Agentic AI System
                </h2>
                <p className="text-primary-foreground/80">
                  {activeAgents.length} agents active • {agents.reduce((acc, a) => acc + a.tasksCompleted, 0).toLocaleString()} tasks completed
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" className="gap-2">
                <Pause className="h-4 w-4" />
                Pause All
              </Button>
              <Button variant="secondary" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Restart All
              </Button>
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-4">
          <Badge variant="success" className="px-3 py-1">
            {activeAgents.length} Active
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            {idleAgents.length} Idle
          </Badge>
          <Badge variant="info" className="px-3 py-1">
            {agents.filter((a) => a.status === 'processing').length} Processing
          </Badge>
        </div>

        {/* Agents Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <div key={agent.id} className="group relative">
              <AgentStatusCard agent={agent} />
              <div className="absolute right-4 top-4 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {agent.status === 'idle' ? (
                    <Play className="h-4 w-4" />
                  ) : (
                    <Pause className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Agent Capabilities */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-4">Agent Capabilities Matrix</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="font-medium text-foreground">Input Processing</h4>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• Figma design parsing</li>
                <li>• Web crawling & scraping</li>
                <li>• Excel file ingestion</li>
                <li>• Manual input handling</li>
              </ul>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="font-medium text-foreground">Intelligence</h4>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• Test case generation</li>
                <li>• Duplicate detection</li>
                <li>• Risk scoring</li>
                <li>• Domain learning</li>
              </ul>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="font-medium text-foreground">Integration</h4>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• Azure Boards sync</li>
                <li>• Version control</li>
                <li>• Change detection</li>
                <li>• Bi-directional updates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
