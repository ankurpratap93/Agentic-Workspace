import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FolderKanban, MoreVertical, FileCheck, Bug, Calendar, FolderOpen, Archive } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'archived'>('all');

  const filteredProjects = useMemo(() => {
    if (activeTab === 'all') return projects;
    return projects.filter((p) => p.status === activeTab);
  }, [activeTab]);

  const activeCount = projects.filter((p) => p.status === 'active').length;
  const archivedCount = projects.filter((p) => p.status === 'archived').length;

  return (
    <AppLayout title="Projects" subtitle="Manage your QA projects and test suites">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{projects.length} Projects</Badge>
            <Badge variant="success">{activeCount} Active</Badge>
            {archivedCount > 0 && (
              <Badge variant="secondary">{archivedCount} Archived</Badge>
            )}
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Tabs for Filtering */}
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'all' | 'active' | 'archived')} 
          className="w-full"
        >
          <TabsList className="bg-muted/50 w-full justify-start h-auto p-1 grid grid-cols-3">
            <TabsTrigger 
              value="all" 
              className="gap-2 flex items-center justify-center"
              disabled={false}
            >
              <FolderOpen className="h-4 w-4" />
              <span>All Projects</span>
              <Badge variant="secondary" className="ml-1 text-xs">
                {projects.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="active" 
              className="gap-2 flex items-center justify-center"
              disabled={false}
            >
              <FileCheck className="h-4 w-4" />
              <span>Active</span>
              <Badge variant="success" className="ml-1 text-xs">
                {activeCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="archived" 
              className="gap-2 flex items-center justify-center"
              disabled={false}
            >
              <Archive className="h-4 w-4" />
              <span>Archived</span>
              <Badge variant="secondary" className="ml-1 text-xs">
                {archivedCount}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
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
          </TabsContent>

          <TabsContent value="active" className="mt-6 space-y-0">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12 rounded-xl border-2 border-dashed border-border">
                <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No active projects</p>
                <p className="text-sm text-muted-foreground mt-1">Create a new project to get started</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map((project) => (
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

                  <div className="mt-4">
                    <Progress value={project.passRate} className="h-1.5" />
                  </div>

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
            )}
          </TabsContent>

          <TabsContent value="archived" className="mt-6 space-y-0">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12 rounded-xl border-2 border-dashed border-border">
                <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No archived projects</p>
                <p className="text-sm text-muted-foreground mt-1">Archived projects will appear here</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map((project) => (
                <Card
                  key={project.id}
                  className="p-6 card-hover cursor-pointer border-border hover:border-primary/50 transition-all opacity-75"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                        <FolderKanban className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{project.name}</h3>
                        <Badge variant="secondary" className="mt-1">
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
                        <DropdownMenuItem>Restore</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>

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

                  <div className="mt-4 grid grid-cols-3 gap-4 border-t border-border pt-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm font-medium text-foreground">
                        <FileCheck className="h-3.5 w-3.5 text-muted-foreground" />
                        {project.testCasesCount}
                      </div>
                      <p className="text-xs text-muted-foreground">Tests</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm font-medium text-foreground">
                        <Bug className="h-3.5 w-3.5 text-muted-foreground" />
                        {project.bugsCount}
                      </div>
                      <p className="text-xs text-muted-foreground">Bugs</p>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-foreground">{project.passRate}%</div>
                      <p className="text-xs text-muted-foreground">Pass</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Progress value={project.passRate} className="h-1.5" />
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {project.createdAt}
                    </div>
                    <span>Archived {project.lastActivity}</span>
                  </div>
                </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
