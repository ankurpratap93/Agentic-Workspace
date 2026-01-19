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

// Test Execution Types
export interface TestStepExecution {
  stepIndex: number;
  status: 'passed' | 'failed' | 'skipped' | 'pending';
  actualResult?: string;
  notes?: string;
  executedAt?: string;
}

export interface TestExecution {
  id: string;
  testCaseId: string;
  testCycleId: string;
  status: 'passed' | 'failed' | 'blocked' | 'skipped' | 'not-run';
  stepExecutions: TestStepExecution[];
  executedBy: string;
  executedAt: string;
  duration?: number; // in seconds
  notes?: string;
  attachments?: string[];
  bugId?: string; // linked bug if failed
}

export interface TestCycle {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  type: 'regression' | 'smoke' | 'functional' | 'integration' | 'release' | 'adhoc';
  status: 'planned' | 'in-progress' | 'completed' | 'aborted';
  testCaseIds: string[];
  executions: TestExecution[];
  startDate?: string;
  endDate?: string;
  createdAt: string;
  createdBy: string;
  passRate?: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  blockedTests: number;
  skippedTests: number;
}
