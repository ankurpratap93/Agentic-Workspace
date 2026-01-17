import { FileCheck, Bug, Bot, Upload, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'test-case' | 'bug' | 'agent' | 'import' | 'sync';
  title: string;
  description: string;
  timestamp: string;
}

const activities: Activity[] = [
  {
    id: '1',
    type: 'agent',
    title: 'UI Analysis Agent completed',
    description: 'Generated 24 test cases from Figma design',
    timestamp: '2 min ago',
  },
  {
    id: '2',
    type: 'sync',
    title: 'Azure Boards synced',
    description: '5 bugs pushed, 2 bugs updated',
    timestamp: '15 min ago',
  },
  {
    id: '3',
    type: 'test-case',
    title: 'New test case approved',
    description: 'TC-1234: User login validation',
    timestamp: '32 min ago',
  },
  {
    id: '4',
    type: 'import',
    title: 'Excel import completed',
    description: 'Imported 156 test cases to Project Alpha',
    timestamp: '1 hour ago',
  },
  {
    id: '5',
    type: 'bug',
    title: 'Critical bug created',
    description: 'BUG-567: Payment gateway timeout',
    timestamp: '2 hours ago',
  },
];

const iconMap = {
  'test-case': FileCheck,
  bug: Bug,
  agent: Bot,
  import: Upload,
  sync: Link2,
};

const iconStyles = {
  'test-case': 'bg-success/10 text-success',
  bug: 'bg-destructive/10 text-destructive',
  agent: 'bg-accent/10 text-accent',
  import: 'bg-info/10 text-info',
  sync: 'bg-primary/10 text-primary',
};

export function RecentActivity() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <h2 className="font-semibold text-foreground">Recent Activity</h2>
      </div>
      <div className="divide-y divide-border">
        {activities.map((activity, index) => {
          const Icon = iconMap[activity.type];
          return (
            <div
              key={activity.id}
              className={cn(
                'flex items-start gap-4 px-6 py-4 transition-colors hover:bg-muted/50',
                index === 0 && 'animate-fade-in'
              )}
            >
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg',
                  iconStyles[activity.type]
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{activity.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{activity.description}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {activity.timestamp}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
