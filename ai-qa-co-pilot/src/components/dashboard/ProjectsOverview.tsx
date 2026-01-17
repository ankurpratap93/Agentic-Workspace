import { Project } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FolderKanban, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const projects: Project[] = [
  {
    id: '1',
    name: 'E-Commerce Platform',
    description: 'Main shopping application',
    status: 'active',
    testCasesCount: 456,
    bugsCount: 23,
    passRate: 87,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
  },
  {
    id: '2',
    name: 'Mobile Banking App',
    description: 'iOS and Android banking solution',
    status: 'active',
    testCasesCount: 312,
    bugsCount: 8,
    passRate: 94,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-19',
  },
  {
    id: '3',
    name: 'Admin Dashboard',
    description: 'Internal management portal',
    status: 'active',
    testCasesCount: 189,
    bugsCount: 15,
    passRate: 79,
    createdAt: '2024-01-05',
    updatedAt: '2024-01-18',
  },
];

export function ProjectsOverview() {
  return (
    <div className="rounded-xl border-2 border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold text-foreground">Active Projects</h2>
        <Link
          to="/projects"
          className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-2 py-1"
          aria-label="View all projects"
        >
          View all
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="divide-y divide-border" role="list">
        {projects.map((project) => (
          <div
            key={project.id}
            className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50 focus-within:bg-muted/50 cursor-pointer"
            onClick={() => window.location.href = '/projects'}
            role="listitem"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.location.href = '/projects';
              }
            }}
            aria-label={`View project ${project.name} with ${project.testCasesCount} test cases and ${project.bugsCount} bugs`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20" aria-hidden="true">
              <FolderKanban className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground">{project.name}</h3>
                <Badge variant="secondary" className="text-xs">
                  {project.testCasesCount} tests
                </Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{project.description}</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{project.passRate}%</p>
                <p className="text-xs text-muted-foreground">Pass rate</p>
              </div>
              <div className="w-24" aria-label={`Pass rate: ${project.passRate}%`}>
                <Progress
                  value={project.passRate}
                  className="h-2"
                  aria-hidden="true"
                />
              </div>
              <Badge
                variant={project.bugsCount > 10 ? 'destructive' : 'outline'}
                className="min-w-[60px] justify-center"
                aria-label={`${project.bugsCount} bugs`}
              >
                {project.bugsCount} bugs
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
