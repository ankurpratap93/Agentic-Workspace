import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Plus, FolderKanban, MoreVertical, FileCheck, Bug, Calendar } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const projects = [
  {
    id: '1',
    name: 'E-Commerce Platform',
    description: 'Main shopping application with cart, checkout, and order management',
    status: 'active',
    testCasesCount: 456,
    bugsCount: 23,
    passRate: 87,
    modules: ['Authentication', 'Cart', 'Checkout', 'Orders', 'Products'],
    createdAt: '2024-01-15',
    lastActivity: '2 hours ago',
  },
  {
    id: '2',
    name: 'Mobile Banking App',
    description: 'iOS and Android banking solution with transfers and payments',
    status: 'active',
    testCasesCount: 312,
    bugsCount: 8,
    passRate: 94,
    modules: ['Login', 'Accounts', 'Transfers', 'Payments', 'Settings'],
    createdAt: '2024-01-10',
    lastActivity: '30 min ago',
  },
  {
    id: '3',
    name: 'Admin Dashboard',
    description: 'Internal management portal for system administration',
    status: 'active',
    testCasesCount: 189,
    bugsCount: 15,
    passRate: 79,
    modules: ['Users', 'Reports', 'Settings', 'Analytics'],
    createdAt: '2024-01-05',
    lastActivity: '1 day ago',
  },
  {
    id: '4',
    name: 'Customer Support Portal',
    description: 'Ticketing and knowledge base system',
    status: 'archived',
    testCasesCount: 98,
    bugsCount: 2,
    passRate: 95,
    modules: ['Tickets', 'KB Articles', 'Chat'],
    createdAt: '2023-12-01',
    lastActivity: '2 weeks ago',
  },
];

export default function Projects() {
  return (
    <AppLayout title="Projects" subtitle="Manage your QA projects and test suites">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{projects.length} Projects</Badge>
            <Badge variant="success">
              {projects.filter((p) => p.status === 'active').length} Active
            </Badge>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Projects Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="p-6 card-hover cursor-pointer border-border hover:border-primary/50 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <FolderKanban className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{project.name}</h3>
                    <Badge
                      variant={project.status === 'active' ? 'success' : 'secondary'}
                      className="mt-1"
                    >
                      {project.status}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Edit Project</DropdownMenuItem>
                    <DropdownMenuItem>Archive</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                {project.description}
              </p>

              {/* Modules */}
              <div className="mt-4 flex flex-wrap gap-1">
                {project.modules.slice(0, 3).map((module) => (
                  <Badge key={module} variant="outline" className="text-xs">
                    {module}
                  </Badge>
                ))}
                {project.modules.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{project.modules.length - 3}
                  </Badge>
                )}
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-3 gap-4 border-t border-border pt-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm font-medium text-foreground">
                    <FileCheck className="h-3.5 w-3.5 text-primary" />
                    {project.testCasesCount}
                  </div>
                  <p className="text-xs text-muted-foreground">Tests</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm font-medium text-foreground">
                    <Bug className="h-3.5 w-3.5 text-destructive" />
                    {project.bugsCount}
                  </div>
                  <p className="text-xs text-muted-foreground">Bugs</p>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-foreground">{project.passRate}%</div>
                  <p className="text-xs text-muted-foreground">Pass</p>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-4">
                <Progress value={project.passRate} className="h-1.5" />
              </div>

              {/* Footer */}
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {project.createdAt}
                </div>
                <span>Active {project.lastActivity}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
