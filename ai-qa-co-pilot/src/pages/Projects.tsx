import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FolderKanban, MoreVertical, FileCheck, Bug, Calendar, FolderOpen, Archive, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

type Project = {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'archived';
  testCasesCount: number;
  bugsCount: number;
  passRate: number;
  modules: string[];
  createdAt: string;
  lastActivity: string;
};

const initialProjects: Project[] = [
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

// Reusable Project Card component
function ProjectCard({ 
  project, 
  isArchived = false,
  onViewDetails 
}: { 
  project: Project; 
  isArchived?: boolean;
  onViewDetails: (project: Project) => void;
}) {
  return (
    <Card
      className={`p-6 card-hover cursor-pointer border-border hover:border-primary/50 transition-all ${isArchived ? 'opacity-75' : ''}`}
      onClick={() => onViewDetails(project)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewDetails(project);
        }
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isArchived ? 'bg-muted' : 'bg-primary/10'}`}>
            <FolderKanban className={`h-6 w-6 ${isArchived ? 'text-muted-foreground' : 'text-primary'}`} />
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
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => onViewDetails(project)}>View Details</DropdownMenuItem>
            {isArchived ? (
              <>
                <DropdownMenuItem>Restore</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem>Edit Project</DropdownMenuItem>
                <DropdownMenuItem>Archive</DropdownMenuItem>
              </>
            )}
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
            <FileCheck className={`h-3.5 w-3.5 ${isArchived ? 'text-muted-foreground' : 'text-primary'}`} />
            {project.testCasesCount}
          </div>
          <p className="text-xs text-muted-foreground">Tests</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-sm font-medium text-foreground">
            <Bug className={`h-3.5 w-3.5 ${isArchived ? 'text-muted-foreground' : 'text-destructive'}`} />
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
        <span>{isArchived ? 'Archived' : 'Active'} {project.lastActivity}</span>
      </div>
    </Card>
  );
}

// Helper to load projects from localStorage
const loadProjectsFromStorage = (): Project[] => {
  try {
    const stored = localStorage.getItem('qa-forge-projects');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load projects from storage:', e);
  }
  return initialProjects;
};

// Helper to save projects to localStorage
const saveProjectsToStorage = (projects: Project[]) => {
  try {
    localStorage.setItem('qa-forge-projects', JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save projects to storage:', e);
  }
};

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>(loadProjectsFromStorage);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectModules, setNewProjectModules] = useState('');
  const { toast } = useToast();

  // Save projects to localStorage whenever they change
  useEffect(() => {
    saveProjectsToStorage(projects);
  }, [projects]);

  // Compute filtered projects
  const activeProjects = projects.filter((p) => p.status === 'active');
  const archivedProjects = projects.filter((p) => p.status === 'archived');

  const handleNewProject = () => {
    setIsNewProjectOpen(true);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProjectName.trim()) {
      toast({
        title: "Error",
        description: "Project name is required.",
        variant: "destructive",
      });
      return;
    }

    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    const newProject: Project = {
      id: String(Date.now()),
      name: newProjectName.trim(),
      description: newProjectDescription.trim() || 'No description provided',
      status: 'active',
      testCasesCount: 0,
      bugsCount: 0,
      passRate: 0,
      modules: newProjectModules.split(',').map(m => m.trim()).filter(m => m.length > 0),
      createdAt: formattedDate,
      lastActivity: 'Just now',
    };

    setProjects(prev => [newProject, ...prev]);
    
    toast({
      title: "Project Created",
      description: `"${newProject.name}" has been created successfully.`,
    });
    
    // Reset form
    setNewProjectName('');
    setNewProjectDescription('');
    setNewProjectModules('');
    setIsNewProjectOpen(false);
  };

  const handleViewDetails = (project: Project) => {
    setSelectedProject(project);
    setIsDetailsOpen(true);
  };

  return (
    <AppLayout title="Projects" subtitle="Manage your QA projects and test suites">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{projects.length} Projects</Badge>
            <Badge variant="success">{activeProjects.length} Active</Badge>
            {archivedProjects.length > 0 && (
              <Badge variant="secondary">{archivedProjects.length} Archived</Badge>
            )}
          </div>
          <Button className="gap-2" onClick={handleNewProject}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Tabs for Filtering - Using defaultValue like Settings page */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              All Projects
              <Badge variant="secondary" className="ml-1 text-xs">
                {projects.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-2">
              <FileCheck className="h-4 w-4" />
              Active
              <Badge variant="success" className="ml-1 text-xs">
                {activeProjects.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="archived" className="gap-2">
              <Archive className="h-4 w-4" />
              Archived
              <Badge variant="secondary" className="ml-1 text-xs">
                {archivedProjects.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  isArchived={project.status === 'archived'} 
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active">
            {activeProjects.length === 0 ? (
              <div className="text-center py-12 rounded-xl border-2 border-dashed border-border">
                <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No active projects</p>
                <p className="text-sm text-muted-foreground mt-1">Create a new project to get started</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeProjects.map((project) => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="archived">
            {archivedProjects.length === 0 ? (
              <div className="text-center py-12 rounded-xl border-2 border-dashed border-border">
                <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No archived projects</p>
                <p className="text-sm text-muted-foreground mt-1">Archived projects will appear here</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {archivedProjects.map((project) => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    isArchived 
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* New Project Dialog */}
      <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new QA project to your workspace. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateProject}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="project-name">Project Name *</Label>
                <Input 
                  id="project-name" 
                  placeholder="e.g., E-Commerce Platform" 
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea 
                  id="project-description" 
                  placeholder="Brief description of the project..." 
                  rows={3}
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project-modules">Modules (comma-separated)</Label>
                <Input 
                  id="project-modules" 
                  placeholder="e.g., Authentication, Cart, Checkout" 
                  value={newProjectModules}
                  onChange={(e) => setNewProjectModules(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setNewProjectName('');
                setNewProjectDescription('');
                setNewProjectModules('');
                setIsNewProjectOpen(false);
              }}>
                Cancel
              </Button>
              <Button type="submit">Create Project</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Project Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FolderKanban className="h-5 w-5 text-primary" />
              </div>
              {selectedProject?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedProject?.description}
            </DialogDescription>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-6 py-4">
              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={selectedProject.status === 'active' ? 'success' : 'secondary'}>
                  {selectedProject.status}
                </Badge>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-foreground">
                    <FileCheck className="h-5 w-5 text-primary" />
                    {selectedProject.testCasesCount}
                  </div>
                  <p className="text-sm text-muted-foreground">Test Cases</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-foreground">
                    <Bug className="h-5 w-5 text-destructive" />
                    {selectedProject.bugsCount}
                  </div>
                  <p className="text-sm text-muted-foreground">Active Bugs</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{selectedProject.passRate}%</div>
                  <p className="text-sm text-muted-foreground">Pass Rate</p>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Test Coverage</span>
                  <span className="text-sm text-muted-foreground">{selectedProject.passRate}%</span>
                </div>
                <Progress value={selectedProject.passRate} className="h-2" />
              </div>

              {/* Modules */}
              <div>
                <span className="text-sm font-medium">Modules</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedProject.modules.map((module) => (
                    <Badge key={module} variant="outline">
                      {module}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Created: {selectedProject.createdAt}
                </div>
                <span>Last activity: {selectedProject.lastActivity}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsDetailsOpen(false);
              if (selectedProject) {
                navigate(`/projects/${selectedProject.id}`);
              }
            }}>
              Open Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
