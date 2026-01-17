export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'archived';
  testCasesCount: number;
  bugsCount: number;
  passRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface TestCase {
  id: string;
  projectId: string;
  title: string;
  description: string;
  preconditions: string;
  steps: string[];
  expectedResult: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  severity: 'minor' | 'major' | 'critical' | 'blocker';
  status: 'draft' | 'approved' | 'deprecated';
  testType: 'functional' | 'regression' | 'smoke' | 'integration' | 'e2e';
  automationFeasibility: 'yes' | 'no' | 'partial';
  source: 'manual' | 'figma' | 'crawler' | 'excel';
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Bug {
  id: string;
  projectId: string;
  azureBugId?: string;
  title: string;
  description: string;
  stepsToReproduce: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  severity: 'minor' | 'major' | 'critical' | 'blocker';
  status: 'new' | 'active' | 'resolved' | 'closed';
  assignedTo?: string;
  linkedTestCases: string[];
  syncStatus: 'synced' | 'pending' | 'error' | 'not-linked';
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'idle' | 'processing' | 'error';
  lastRun?: string;
  tasksCompleted: number;
  icon: string;
}

export interface AzureConnection {
  organization: string;
  project: string;
  isConnected: boolean;
  lastSync?: string;
}
