import { cn } from '@/lib/utils';
import { Agent } from '@/types';
import {
  Figma,
  Globe,
  FileText,
  FileSpreadsheet,
  Edit3,
  Link2,
  Sparkles,
  RefreshCw,
  Brain,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  figma: Figma,
  globe: Globe,
  'file-text': FileText,
  'file-spreadsheet': FileSpreadsheet,
  edit: Edit3,
  link: Link2,
  sparkles: Sparkles,
  refresh: RefreshCw,
  brain: Brain,
};

const statusStyles = {
  active: 'bg-success/20 border-success/50 text-success',
  idle: 'bg-muted border-muted-foreground/20 text-muted-foreground',
  processing: 'bg-primary/20 border-primary/50 text-primary animate-pulse',
  error: 'bg-destructive/20 border-destructive/50 text-destructive',
};

const statusDotStyles = {
  active: 'bg-success agent-pulse',
  idle: 'bg-muted-foreground',
  processing: 'bg-primary animate-pulse',
  error: 'bg-destructive',
};

interface AgentStatusCardProps {
  agent: Agent;
  compact?: boolean;
}

export function AgentStatusCard({ agent, compact = false }: AgentStatusCardProps) {
  const Icon = iconMap[agent.icon] || Brain;

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border-2 px-3 py-2 transition-all hover:shadow-sm',
          statusStyles[agent.status]
        )}
        role="status"
        aria-label={`${agent.name} agent is ${agent.status}`}
        title={`${agent.name} - ${agent.status}`}
      >
        <div className={cn('h-2 w-2 rounded-full', statusDotStyles[agent.status])} aria-hidden="true" />
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span className="text-xs font-medium truncate">{agent.name}</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 card-hover">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg border',
            statusStyles[agent.status]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground truncate">{agent.name}</h3>
            <div className={cn('h-2 w-2 rounded-full', statusDotStyles[agent.status])} />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{agent.description}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span>{agent.tasksCompleted} tasks</span>
            {agent.lastRun && (
              <span>Last: {new Date(agent.lastRun).toLocaleTimeString()}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
