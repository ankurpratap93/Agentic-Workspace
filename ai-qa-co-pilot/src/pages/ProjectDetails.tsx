import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  FolderKanban, 
  FileCheck, 
  Bug, 
  Calendar,
  Settings,
  Plus,
  Play,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

// Mock project data - in a real app, this would come from an API or context
const projectsData: Record<string, {
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
}> = {
  '1': {
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
  '2': {
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
  '3': {
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
  '4': {
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
};

// Mock test cases for the project
const mockTestCases = [
  { id: 'TC-001', name: 'User Login with valid credentials', status: 'passed', module: 'Authentication', priority: 'High' },
  { id: 'TC-002', name: 'User Login with invalid password', status: 'passed', module: 'Authentication', priority: 'High' },
  { id: 'TC-003', name: 'Add item to cart', status: 'passed', module: 'Cart', priority: 'Critical' },
  { id: 'TC-004', name: 'Remove item from cart', status: 'failed', module: 'Cart', priority: 'High' },
  { id: 'TC-005', name: 'Checkout with credit card', status: 'passed', module: 'Checkout', priority: 'Critical' },
  { id: 'TC-006', name: 'Apply discount code', status: 'pending', module: 'Checkout', priority: 'Medium' },
];

// Mock bugs for the project
const mockBugs = [
  { id: 'BUG-001', title: 'Cart total not updating correctly', severity: 'High', status: 'Open', module: 'Cart' },
  { id: 'BUG-002', title: 'Payment fails on Safari browser', severity: 'Critical', status: 'In Progress', module: 'Checkout' },
  { id: 'BUG-003', title: 'Order confirmation email delayed', severity: 'Medium', status: 'Open', module: 'Orders' },
];

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Get project from mock data or handle dynamic projects
  const project = id ? projectsData[id] : null;

  // If project not found in mock data, show a generic view for dynamically created projects
  if (!project && id) {
    return (
      <AppLayout title="Project Details" subtitle="View and manage your project">
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => navigate('/projects')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Button>
          
          <Card className="p-8 text-center">
            <FolderKanban className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Project #{id}</h2>
            <p className="text-muted-foreground mb-6">
              This is a newly created project. Start by adding test cases and configuring your modules.
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => navigate('/test-cases')} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Test Cases
              </Button>
              <Button variant="outline" onClick={() => navigate('/projects')}>
                Back to Projects
              </Button>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout title="Project Not Found" subtitle="">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Project not found</h2>
          <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={project.name} subtitle={project.description}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/projects')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant={project.status === 'active' ? 'success' : 'secondary'}>
              {project.status}
            </Badge>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button size="sm" className="gap-2">
              <Play className="h-4 w-4" />
              Run Tests
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{project.testCasesCount}</p>
                <p className="text-sm text-muted-foreground">Test Cases</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <Bug className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{project.bugsCount}</p>
                <p className="text-sm text-muted-foreground">Active Bugs</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <BarChart3 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{project.passRate}%</p>
                <p className="text-sm text-muted-foreground">Pass Rate</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{project.lastActivity}</p>
                <p className="text-sm text-muted-foreground">Last Activity</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Progress */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Test Coverage</h3>
            <span className="text-sm text-muted-foreground">{project.passRate}% Complete</span>
          </div>
          <Progress value={project.passRate} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </Card>

        {/* Modules */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Modules</h3>
          <div className="flex flex-wrap gap-2">
            {project.modules.map((module) => (
              <Badge key={module} variant="outline" className="px-3 py-1">
                {module}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Tabs for Test Cases and Bugs */}
        <Tabs defaultValue="test-cases" className="space-y-4">
          <TabsList>
            <TabsTrigger value="test-cases" className="gap-2">
              <FileCheck className="h-4 w-4" />
              Test Cases
            </TabsTrigger>
            <TabsTrigger value="bugs" className="gap-2">
              <Bug className="h-4 w-4" />
              Bugs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="test-cases">
            <Card>
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">Recent Test Cases</h3>
                <Button size="sm" variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Test Case
                </Button>
              </div>
              <div className="divide-y">
                {mockTestCases.map((tc) => (
                  <div key={tc.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      {tc.status === 'passed' && <CheckCircle2 className="h-5 w-5 text-success" />}
                      {tc.status === 'failed' && <XCircle className="h-5 w-5 text-destructive" />}
                      {tc.status === 'pending' && <AlertCircle className="h-5 w-5 text-warning" />}
                      <div>
                        <p className="font-medium">{tc.name}</p>
                        <p className="text-sm text-muted-foreground">{tc.id} • {tc.module}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={tc.priority === 'Critical' ? 'destructive' : tc.priority === 'High' ? 'default' : 'secondary'}>
                        {tc.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t">
                <Button variant="link" className="w-full" onClick={() => navigate('/test-cases')}>
                  View All Test Cases →
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="bugs">
            <Card>
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">Active Bugs</h3>
                <Button size="sm" variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Report Bug
                </Button>
              </div>
              <div className="divide-y">
                {mockBugs.map((bug) => (
                  <div key={bug.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Bug className={`h-5 w-5 ${bug.severity === 'Critical' ? 'text-destructive' : bug.severity === 'High' ? 'text-warning' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="font-medium">{bug.title}</p>
                        <p className="text-sm text-muted-foreground">{bug.id} • {bug.module}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={bug.status === 'Open' ? 'destructive' : 'secondary'}>
                        {bug.status}
                      </Badge>
                      <Badge variant="outline">{bug.severity}</Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t">
                <Button variant="link" className="w-full" onClick={() => navigate('/bugs')}>
                  View All Bugs →
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Project Info */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Project Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Created:</span>
              <span>{project.createdAt}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Last Activity:</span>
              <span>{project.lastActivity}</span>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
