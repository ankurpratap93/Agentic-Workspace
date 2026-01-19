import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { testCases as mockTestCases } from '@/data/mockTestCases';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  Filter,
  Download,
  Sparkles,
  Figma,
  Globe,
  FileSpreadsheet,
  Edit2,
  FileCheck,
  CheckCircle2,
  FileEdit,
  Archive,
  Upload,
  X,
  Loader2,
  FileUp,
  Link,
  Bot,
  File,
  AlertCircle,
  CheckCircle,
  XCircle,
  HelpCircle,
  Scan,
  Target,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Eye,
  MousePointer,
  FormInput,
  LayoutGrid,
  Navigation,
  RefreshCw,
  Play,
  MoreHorizontal,
  Bug,
  Clock,
  RotateCcw,
  Pencil,
  Trash2,
  Copy,
  PlayCircle,
  PauseCircle,
  SkipForward,
  Calendar,
  Users,
  BarChart3,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TestCase, TestCycle, TestExecution, TestStepExecution, Bug } from '@/types';

const sourceIcons: Record<string, React.ElementType> = {
  manual: Edit2,
  figma: Figma,
  crawler: Globe,
  excel: FileSpreadsheet,
};

// LocalStorage keys
const STORAGE_KEY = 'qa-forge-test-cases';
const CYCLES_STORAGE_KEY = 'qa-forge-test-cycles';
const BUGS_STORAGE_KEY = 'qa-forge-bugs';

// Load test cycles from localStorage
const loadTestCyclesFromStorage = (): TestCycle[] => {
  try {
    const stored = localStorage.getItem(CYCLES_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to load test cycles:', e);
  }
  return [];
};

// Save test cycles to localStorage
const saveTestCyclesToStorage = (cycles: TestCycle[]) => {
  try {
    localStorage.setItem(CYCLES_STORAGE_KEY, JSON.stringify(cycles));
  } catch (e) {
    console.error('Failed to save test cycles:', e);
  }
};

// Load bugs from localStorage
const loadBugsFromStorage = (): Bug[] => {
  try {
    const stored = localStorage.getItem(BUGS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to load bugs:', e);
  }
  return [];
};

// Save bugs to localStorage
const saveBugsToStorage = (bugs: Bug[]) => {
  try {
    localStorage.setItem(BUGS_STORAGE_KEY, JSON.stringify(bugs));
  } catch (e) {
    console.error('Failed to save bugs:', e);
  }
};

// Load test cases from localStorage or use mock data
const loadTestCasesFromStorage = (): TestCase[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load test cases:', e);
  }
  return mockTestCases;
};

// Save test cases to localStorage
const saveTestCasesToStorage = (cases: TestCase[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  } catch (e) {
    console.error('Failed to save test cases:', e);
  }
};

// Coverage Analysis Types
interface DOMElement {
  type: string;
  selector: string;
  text?: string;
  attributes?: Record<string, string>;
}

interface CoverageGap {
  element: DOMElement;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

interface CoveredElement {
  element: DOMElement;
  testCases: string[];
  coverage: 'full' | 'partial';
}

interface SuggestedTestCase {
  title: string;
  description: string;
  steps: string[];
  expectedResult: string;
  priority: 'high' | 'medium' | 'low' | 'critical';
  category: string;
}

interface CoverageAnalysis {
  url: string;
  timestamp: string;
  overallScore: number;
  elementsFound: number;
  elementsCovered: number;
  coverageByCategory: Record<string, { total: number; covered: number; percentage: number }>;
  coveredElements: CoveredElement[];
  gaps: CoverageGap[];
  suggestedTestCases: SuggestedTestCase[];
  pageMetadata: {
    title: string;
    forms: number;
    buttons: number;
    links: number;
    inputs: number;
    modals: number;
  };
}

export default function TestCases() {
  const { toast } = useToast();
  const [testCases, setTestCases] = useState<TestCase[]>(loadTestCasesFromStorage);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  // Dialog states
  const [isNewTestCaseOpen, setIsNewTestCaseOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isAIGenerateOpen, setIsAIGenerateOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [columnMapping, setColumnMapping] = useState({
    title: 'title',
    description: 'description',
    preconditions: 'preconditions',
    steps: 'steps',
    expectedResult: 'expectedResult',
    priority: 'priority',
    testType: 'testType',
  });
  const [selectedProject, setSelectedProject] = useState('1');
  
  // New test case form state
  const [newTestCase, setNewTestCase] = useState({
    title: '',
    description: '',
    preconditions: '',
    steps: '',
    expectedResult: '',
    priority: 'medium' as TestCase['priority'],
    severity: 'major' as TestCase['severity'],
    testType: 'functional' as TestCase['testType'],
    automationFeasibility: 'yes' as TestCase['automationFeasibility'],
  });
  
  // AI Generate form state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiUrl, setAiUrl] = useState('');
  const [aiCount, setAiCount] = useState('5');
  
  // AI Coverage Agent state
  const [isCoverageAgentOpen, setIsCoverageAgentOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [coverageUrl, setCoverageUrl] = useState('');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisPhase, setAnalysisPhase] = useState('');
  const [coverageResults, setCoverageResults] = useState<CoverageAnalysis | null>(null);

  // Edit Test Case state
  const [isEditTestCaseOpen, setIsEditTestCaseOpen] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);

  // Test Execution state
  const [isExecuteTestOpen, setIsExecuteTestOpen] = useState(false);
  const [executingTestCase, setExecutingTestCase] = useState<TestCase | null>(null);
  const [stepExecutions, setStepExecutions] = useState<TestStepExecution[]>([]);
  const [executionNotes, setExecutionNotes] = useState('');
  const [currentCycleId, setCurrentCycleId] = useState<string | null>(null);

  // Test Cycles state
  const [testCycles, setTestCycles] = useState<TestCycle[]>(loadTestCyclesFromStorage);
  const [isTestCyclesOpen, setIsTestCyclesOpen] = useState(false);
  const [isNewCycleOpen, setIsNewCycleOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<TestCycle | null>(null);
  const [newCycleName, setNewCycleName] = useState('');
  const [newCycleType, setNewCycleType] = useState<TestCycle['type']>('regression');
  const [newCycleDescription, setNewCycleDescription] = useState('');
  const [selectedTestCasesForCycle, setSelectedTestCasesForCycle] = useState<string[]>([]);

  // Bug creation state
  const [bugs, setBugs] = useState<Bug[]>(loadBugsFromStorage);
  const [isCreateBugOpen, setIsCreateBugOpen] = useState(false);
  const [bugFromTestCase, setBugFromTestCase] = useState<TestCase | null>(null);
  const [newBugTitle, setNewBugTitle] = useState('');
  const [newBugDescription, setNewBugDescription] = useState('');
  const [newBugPriority, setNewBugPriority] = useState<Bug['priority']>('medium');
  const [newBugSeverity, setNewBugSeverity] = useState<Bug['severity']>('major');

  // Advanced filter state
  const [advancedFilters, setAdvancedFilters] = useState({
    testTypes: [] as string[],
    sources: [] as string[],
    severities: [] as string[],
  });

  // Persist test cases to localStorage
  useEffect(() => {
    saveTestCasesToStorage(testCases);
  }, [testCases]);

  // Persist test cycles to localStorage
  useEffect(() => {
    saveTestCyclesToStorage(testCycles);
  }, [testCycles]);

  // Persist bugs to localStorage
  useEffect(() => {
    saveBugsToStorage(bugs);
  }, [bugs]);

  // Calculate counts for tabs
  const allCount = testCases.length;
  const approvedCount = testCases.filter((t) => t.status === 'approved').length;
  const draftCount = testCases.filter((t) => t.status === 'draft').length;
  const deprecatedCount = testCases.filter((t) => t.status === 'deprecated').length;

  // Filter function for test cases with advanced filters
  const filterTestCases = (statusFilter: string) => {
    return testCases.filter((tc) => {
      const matchesSearch =
        tc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tc.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || tc.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || tc.priority === priorityFilter;
      const matchesTestType = advancedFilters.testTypes.length === 0 || advancedFilters.testTypes.includes(tc.testType);
      const matchesSource = advancedFilters.sources.length === 0 || advancedFilters.sources.includes(tc.source);
      const matchesSeverity = advancedFilters.severities.length === 0 || advancedFilters.severities.includes(tc.severity);
      
      return matchesSearch && matchesStatus && matchesPriority && matchesTestType && matchesSource && matchesSeverity;
    });
  };

  // Generate unique ID
  const generateId = () => {
    const maxNum = testCases.reduce((max, tc) => {
      const num = parseInt(tc.id.replace('TC-', ''), 10);
      return num > max ? num : max;
    }, 0);
    return `TC-${String(maxNum + 1).padStart(3, '0')}`;
  };

  // Handle new test case creation
  const handleCreateTestCase = () => {
    if (!newTestCase.title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Test case title is required',
        variant: 'destructive',
      });
      return;
    }

    const stepsArray = newTestCase.steps.split('\n').filter(s => s.trim());
    
    const testCase: TestCase = {
      id: generateId(),
      projectId: '1',
      title: newTestCase.title,
      description: newTestCase.description,
      preconditions: newTestCase.preconditions,
      steps: stepsArray.length > 0 ? stepsArray : ['Step 1'],
      expectedResult: newTestCase.expectedResult,
      priority: newTestCase.priority,
      severity: newTestCase.severity,
      status: 'draft',
      testType: newTestCase.testType,
      automationFeasibility: newTestCase.automationFeasibility,
      source: 'manual',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'Current User',
    };

    setTestCases(prev => [testCase, ...prev]);
    setIsNewTestCaseOpen(false);
    setNewTestCase({
      title: '',
      description: '',
      preconditions: '',
      steps: '',
      expectedResult: '',
      priority: 'medium',
      severity: 'major',
      testType: 'functional',
      automationFeasibility: 'yes',
    });

    toast({
      title: 'Test Case Created',
      description: `${testCase.id} has been created successfully`,
    });
  };

  // Handle AI generation
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim() && !aiUrl.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a description or URL for AI generation',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2500));

    const count = parseInt(aiCount, 10) || 3;
    const generatedCases: TestCase[] = [];
    
    const templates = [
      { title: 'Verify page loads correctly', desc: 'Check that the page renders without errors' },
      { title: 'Validate form submission', desc: 'Ensure form data is submitted and processed' },
      { title: 'Check error handling', desc: 'Verify appropriate error messages are shown' },
      { title: 'Test navigation flow', desc: 'Validate user can navigate between sections' },
      { title: 'Verify responsive layout', desc: 'Check layout adapts to different screen sizes' },
      { title: 'Test input validation', desc: 'Ensure invalid inputs are rejected with messages' },
      { title: 'Check loading states', desc: 'Verify loading indicators appear during async operations' },
      { title: 'Validate data persistence', desc: 'Ensure data is saved and retrieved correctly' },
    ];

    for (let i = 0; i < Math.min(count, templates.length); i++) {
      const id = generateId();
      generatedCases.push({
        id,
        projectId: '1',
        title: `${templates[i].title}${aiUrl ? ` - ${new URL(aiUrl).hostname}` : ''}`,
        description: `${templates[i].desc}. ${aiPrompt}`,
        preconditions: 'User is on the application',
        steps: [
          'Navigate to the target page',
          'Perform the test action',
          'Observe the result',
        ],
        expectedResult: 'Expected behavior is observed',
        priority: ['medium', 'high', 'critical'][Math.floor(Math.random() * 3)] as TestCase['priority'],
        severity: 'major',
        status: 'draft',
        testType: 'functional',
        automationFeasibility: 'yes',
        source: 'crawler',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'AI Agent',
      });
      
      // Update ID for next iteration
      setTestCases(prev => [...generatedCases, ...prev]);
    }

    setTestCases(prev => [...generatedCases, ...prev]);
    setIsGenerating(false);
    setIsAIGenerateOpen(false);
    setAiPrompt('');
    setAiUrl('');

    toast({
      title: 'Test Cases Generated',
      description: `${generatedCases.length} test cases have been generated by AI`,
    });
  };

  // Parse CSV content
  const parseCSV = (content: string): any[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    
    // Parse data rows
    const data: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length >= headers.length) {
        const row: any = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx]?.trim().replace(/^["']|["']$/g, '') || '';
        });
        data.push(row);
      }
    }
    return data;
  };

  // Parse a single CSV line (handles quoted values with commas)
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['.csv', '.xlsx', '.xls'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(fileExt)) {
      setParseError('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    setUploadedFile(file);
    setParseError(null);
    setParsedData([]);
    setUploadProgress(0);

    // Read and parse file
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = parseCSV(content);
        
        if (data.length === 0) {
          setParseError('No valid data found in file. Please check the format.');
          return;
        }

        // Auto-detect column mapping
        const firstRow = data[0];
        const keys = Object.keys(firstRow);
        const newMapping = { ...columnMapping };
        
        const mappingGuesses: Record<string, string[]> = {
          title: ['title', 'name', 'test case', 'testcase', 'test_case', 'test name'],
          description: ['description', 'desc', 'details', 'summary'],
          preconditions: ['preconditions', 'precondition', 'pre-conditions', 'prerequisites'],
          steps: ['steps', 'test steps', 'procedure', 'actions'],
          expectedResult: ['expected result', 'expected', 'expected_result', 'result', 'expected outcome'],
          priority: ['priority', 'prio', 'importance'],
          testType: ['type', 'test type', 'testtype', 'test_type', 'category'],
        };

        Object.entries(mappingGuesses).forEach(([field, guesses]) => {
          const match = keys.find(k => 
            guesses.some(g => k.toLowerCase().includes(g))
          );
          if (match) {
            newMapping[field as keyof typeof newMapping] = match;
          }
        });

        setColumnMapping(newMapping);
        setParsedData(data);
        setUploadProgress(100);
      } catch (err) {
        setParseError('Failed to parse file. Please ensure it is a valid CSV format.');
      }
    };
    reader.onerror = () => {
      setParseError('Failed to read file. Please try again.');
    };
    reader.readAsText(file);
  };

  // Handle bulk import
  const handleBulkImport = () => {
    if (parsedData.length === 0) {
      toast({
        title: 'No Data',
        description: 'Please upload a file with test case data first',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    // Convert parsed data to test cases
    const importedCases: TestCase[] = [];
    let currentMaxId = testCases.reduce((max, tc) => {
      const num = parseInt(tc.id.replace('TC-', ''), 10);
      return num > max ? num : max;
    }, 0);

    parsedData.forEach((row) => {
      currentMaxId++;
      const stepsValue = row[columnMapping.steps] || '';
      const stepsArray = typeof stepsValue === 'string' 
        ? stepsValue.split(/[;\n]/).filter((s: string) => s.trim())
        : ['Step 1'];

      const priorityValue = (row[columnMapping.priority] || 'medium').toLowerCase();
      const validPriorities = ['low', 'medium', 'high', 'critical'];
      const priority = validPriorities.includes(priorityValue) ? priorityValue : 'medium';

      const testTypeValue = (row[columnMapping.testType] || 'functional').toLowerCase();
      const validTypes = ['functional', 'regression', 'smoke', 'integration', 'e2e'];
      const testType = validTypes.includes(testTypeValue) ? testTypeValue : 'functional';

      importedCases.push({
        id: `TC-${String(currentMaxId).padStart(3, '0')}`,
        projectId: selectedProject,
        title: row[columnMapping.title] || `Test Case ${currentMaxId}`,
        description: row[columnMapping.description] || '',
        preconditions: row[columnMapping.preconditions] || '',
        steps: stepsArray.length > 0 ? stepsArray : ['Step 1'],
        expectedResult: row[columnMapping.expectedResult] || '',
        priority: priority as TestCase['priority'],
        severity: 'major',
        status: 'draft',
        testType: testType as TestCase['testType'],
        automationFeasibility: 'partial',
        source: 'excel',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'Bulk Import',
      });
    });

    // Simulate processing delay
    setTimeout(() => {
      setTestCases(prev => [...importedCases, ...prev]);
      setIsUploading(false);
      setIsBulkUploadOpen(false);
      resetUploadState();

      toast({
        title: 'Bulk Import Complete',
        description: `Successfully imported ${importedCases.length} test cases`,
      });
    }, 1500);
  };

  // Reset upload state
  const resetUploadState = () => {
    setUploadedFile(null);
    setParsedData([]);
    setParseError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle import source selection
  const handleImportSourceSelect = (source: string) => {
    if (source === 'excel' || source === 'csv') {
      setIsImportOpen(false);
      setIsBulkUploadOpen(true);
    } else {
      // Other sources - simulate import
      toast({
        title: 'Import Started',
        description: `Importing test cases from ${source}...`,
      });
      
      setTimeout(() => {
        const importedCases: TestCase[] = [];
        const sourceMap: Record<string, TestCase['source']> = {
          'figma': 'figma',
          'url': 'crawler',
          'json': 'manual',
        };
        
        for (let i = 0; i < 3; i++) {
          importedCases.push({
            id: generateId(),
            projectId: selectedProject,
            title: `Imported Test Case ${i + 1} from ${source}`,
            description: `Test case imported from ${source}`,
            preconditions: 'As specified in source',
            steps: ['Step 1 from import', 'Step 2 from import'],
            expectedResult: 'As specified in source',
            priority: 'medium',
            severity: 'major',
            status: 'draft',
            testType: 'functional',
            automationFeasibility: 'partial',
            source: sourceMap[source] || 'manual',
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'Import Agent',
          });
        }

        setTestCases(prev => [...importedCases, ...prev]);
        setIsImportOpen(false);
        
        toast({
          title: 'Import Complete',
          description: `${importedCases.length} test cases imported from ${source}`,
        });
      }, 1500);
    }
  };

  // Mock projects for selection
  const mockProjects = [
    { id: '1', name: 'E-Commerce Platform' },
    { id: '2', name: 'Banking Application' },
    { id: '3', name: 'Healthcare Portal' },
  ];

  // ========== EDIT TEST CASE ==========
  const handleEditTestCase = (testCase: TestCase) => {
    setEditingTestCase({ ...testCase });
    setIsEditTestCaseOpen(true);
  };

  const handleUpdateTestCase = () => {
    if (!editingTestCase) return;
    
    if (!editingTestCase.title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Test case title is required',
        variant: 'destructive',
      });
      return;
    }

    setTestCases(prev => prev.map(tc => 
      tc.id === editingTestCase.id 
        ? { ...editingTestCase, updatedAt: new Date().toISOString(), version: tc.version + 1 }
        : tc
    ));

    setIsEditTestCaseOpen(false);
    setEditingTestCase(null);

    toast({
      title: 'Test Case Updated',
      description: `${editingTestCase.id} has been updated successfully`,
    });
  };

  const handleDeleteTestCase = (testCase: TestCase) => {
    setTestCases(prev => prev.filter(tc => tc.id !== testCase.id));
    toast({
      title: 'Test Case Deleted',
      description: `${testCase.id} has been removed`,
    });
  };

  const handleDuplicateTestCase = (testCase: TestCase) => {
    const newId = generateId();
    const duplicated: TestCase = {
      ...testCase,
      id: newId,
      title: `${testCase.title} (Copy)`,
      status: 'draft',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTestCases(prev => [duplicated, ...prev]);
    toast({
      title: 'Test Case Duplicated',
      description: `Created ${newId} as a copy`,
    });
  };

  // ========== TEST EXECUTION ==========
  const handleStartExecution = (testCase: TestCase, cycleId?: string) => {
    setExecutingTestCase(testCase);
    setCurrentCycleId(cycleId || null);
    setStepExecutions(
      testCase.steps.map((_, idx) => ({
        stepIndex: idx,
        status: 'pending',
        actualResult: '',
        notes: '',
      }))
    );
    setExecutionNotes('');
    setIsExecuteTestOpen(true);
  };

  const updateStepExecution = (stepIndex: number, status: TestStepExecution['status'], actualResult?: string, notes?: string) => {
    setStepExecutions(prev => prev.map((step, idx) => 
      idx === stepIndex 
        ? { ...step, status, actualResult: actualResult ?? step.actualResult, notes: notes ?? step.notes, executedAt: new Date().toISOString() }
        : step
    ));
  };

  const getOverallExecutionStatus = (): TestExecution['status'] => {
    if (stepExecutions.some(s => s.status === 'failed')) return 'failed';
    if (stepExecutions.every(s => s.status === 'passed')) return 'passed';
    if (stepExecutions.every(s => s.status === 'skipped')) return 'skipped';
    if (stepExecutions.some(s => s.status === 'pending')) return 'not-run';
    return 'blocked';
  };

  const handleCompleteExecution = () => {
    if (!executingTestCase) return;

    const status = getOverallExecutionStatus();
    const execution: TestExecution = {
      id: `EX-${Date.now()}`,
      testCaseId: executingTestCase.id,
      testCycleId: currentCycleId || 'adhoc',
      status,
      stepExecutions,
      executedBy: 'Current User',
      executedAt: new Date().toISOString(),
      notes: executionNotes,
    };

    // Update test cycle if part of one
    if (currentCycleId) {
      setTestCycles(prev => prev.map(cycle => {
        if (cycle.id === currentCycleId) {
          const newExecutions = [...cycle.executions, execution];
          const passedTests = newExecutions.filter(e => e.status === 'passed').length;
          const failedTests = newExecutions.filter(e => e.status === 'failed').length;
          const blockedTests = newExecutions.filter(e => e.status === 'blocked').length;
          const skippedTests = newExecutions.filter(e => e.status === 'skipped').length;
          const totalExecuted = passedTests + failedTests + blockedTests + skippedTests;
          
          return {
            ...cycle,
            executions: newExecutions,
            passedTests,
            failedTests,
            blockedTests,
            skippedTests,
            passRate: totalExecuted > 0 ? Math.round((passedTests / totalExecuted) * 100) : 0,
            status: newExecutions.length >= cycle.testCaseIds.length ? 'completed' : 'in-progress',
          };
        }
        return cycle;
      }));
    }

    setIsExecuteTestOpen(false);

    toast({
      title: 'Execution Complete',
      description: `${executingTestCase.id} marked as ${status}`,
    });

    // If failed, prompt to create bug
    if (status === 'failed') {
      setBugFromTestCase(executingTestCase);
      setNewBugTitle(`Bug: ${executingTestCase.title} - Test Failed`);
      setNewBugDescription(`Test case ${executingTestCase.id} failed during execution.\n\nFailed steps:\n${
        stepExecutions
          .filter(s => s.status === 'failed')
          .map(s => `- Step ${s.stepIndex + 1}: ${executingTestCase.steps[s.stepIndex]}\n  Actual: ${s.actualResult || 'Not as expected'}`)
          .join('\n')
      }`);
      setIsCreateBugOpen(true);
    }

    setExecutingTestCase(null);
    setStepExecutions([]);
  };

  // ========== TEST CYCLES ==========
  const generateCycleId = () => {
    const maxNum = testCycles.reduce((max, c) => {
      const num = parseInt(c.id.replace('CY-', ''), 10);
      return num > max ? num : max;
    }, 0);
    return `CY-${String(maxNum + 1).padStart(3, '0')}`;
  };

  const handleCreateTestCycle = () => {
    if (!newCycleName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Test cycle name is required',
        variant: 'destructive',
      });
      return;
    }

    if (selectedTestCasesForCycle.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one test case',
        variant: 'destructive',
      });
      return;
    }

    const newCycle: TestCycle = {
      id: generateCycleId(),
      name: newCycleName,
      description: newCycleDescription,
      projectId: selectedProject,
      type: newCycleType,
      status: 'planned',
      testCaseIds: selectedTestCasesForCycle,
      executions: [],
      createdAt: new Date().toISOString(),
      createdBy: 'Current User',
      totalTests: selectedTestCasesForCycle.length,
      passedTests: 0,
      failedTests: 0,
      blockedTests: 0,
      skippedTests: 0,
    };

    setTestCycles(prev => [newCycle, ...prev]);
    setIsNewCycleOpen(false);
    setNewCycleName('');
    setNewCycleDescription('');
    setSelectedTestCasesForCycle([]);

    toast({
      title: 'Test Cycle Created',
      description: `${newCycle.id} created with ${newCycle.totalTests} test cases`,
    });
  };

  const handleStartCycle = (cycle: TestCycle) => {
    setTestCycles(prev => prev.map(c => 
      c.id === cycle.id 
        ? { ...c, status: 'in-progress', startDate: new Date().toISOString() }
        : c
    ));
    setSelectedCycle({ ...cycle, status: 'in-progress', startDate: new Date().toISOString() });
    toast({
      title: 'Test Cycle Started',
      description: `${cycle.name} is now in progress`,
    });
  };

  const handleCompleteCycle = (cycle: TestCycle) => {
    setTestCycles(prev => prev.map(c => 
      c.id === cycle.id 
        ? { ...c, status: 'completed', endDate: new Date().toISOString() }
        : c
    ));
    toast({
      title: 'Test Cycle Completed',
      description: `${cycle.name} has been marked as complete`,
    });
  };

  // ========== BUG CREATION ==========
  const generateBugId = () => {
    const maxNum = bugs.reduce((max, b) => {
      const num = parseInt(b.id.replace('BUG-', ''), 10);
      return num > max ? num : max;
    }, 0);
    return `BUG-${String(maxNum + 1).padStart(3, '0')}`;
  };

  const handleCreateBug = () => {
    if (!newBugTitle.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Bug title is required',
        variant: 'destructive',
      });
      return;
    }

    const newBug: Bug = {
      id: generateBugId(),
      projectId: selectedProject,
      title: newBugTitle,
      description: newBugDescription,
      stepsToReproduce: bugFromTestCase?.steps || [],
      priority: newBugPriority,
      severity: newBugSeverity,
      status: 'new',
      linkedTestCases: bugFromTestCase ? [bugFromTestCase.id] : [],
      syncStatus: 'not-linked',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setBugs(prev => [newBug, ...prev]);
    setIsCreateBugOpen(false);
    setBugFromTestCase(null);
    setNewBugTitle('');
    setNewBugDescription('');

    toast({
      title: 'Bug Created',
      description: `${newBug.id} has been logged`,
    });
  };

  const handleCreateBugFromTestCase = (testCase: TestCase) => {
    setBugFromTestCase(testCase);
    setNewBugTitle(`Bug: ${testCase.title}`);
    setNewBugDescription(`Issue found while testing ${testCase.id}.\n\nExpected: ${testCase.expectedResult}\n\nActual: [Describe actual behavior]`);
    setIsCreateBugOpen(true);
  };

  // AI Coverage Agent - Analyze test coverage against website DOM
  const runCoverageAnalysis = async () => {
    if (!coverageUrl.trim()) {
      toast({
        title: 'URL Required',
        description: 'Please enter a website URL to analyze',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setCoverageResults(null);

    // Simulate DOM analysis phases
    const phases = [
      { name: 'Fetching page content...', duration: 800, progress: 15 },
      { name: 'Parsing DOM structure...', duration: 600, progress: 30 },
      { name: 'Identifying interactive elements...', duration: 700, progress: 50 },
      { name: 'Matching with existing test cases...', duration: 900, progress: 70 },
      { name: 'Analyzing coverage gaps...', duration: 800, progress: 85 },
      { name: 'Generating recommendations...', duration: 600, progress: 100 },
    ];

    for (const phase of phases) {
      setAnalysisPhase(phase.name);
      await new Promise(resolve => setTimeout(resolve, phase.duration));
      setAnalysisProgress(phase.progress);
    }

    // Generate mock analysis results based on existing test cases
    const hostname = new URL(coverageUrl).hostname;
    const existingTitles = testCases.map(tc => tc.title.toLowerCase());

    // Simulate detected DOM elements
    const detectedElements: DOMElement[] = [
      { type: 'button', selector: '#login-btn', text: 'Login', attributes: { type: 'submit' } },
      { type: 'button', selector: '#signup-btn', text: 'Sign Up', attributes: { type: 'button' } },
      { type: 'button', selector: '#add-to-cart', text: 'Add to Cart', attributes: { type: 'button' } },
      { type: 'button', selector: '#checkout-btn', text: 'Checkout', attributes: { type: 'submit' } },
      { type: 'button', selector: '#apply-coupon', text: 'Apply', attributes: { type: 'button' } },
      { type: 'input', selector: '#email-input', attributes: { type: 'email', placeholder: 'Email' } },
      { type: 'input', selector: '#password-input', attributes: { type: 'password', placeholder: 'Password' } },
      { type: 'input', selector: '#search-input', attributes: { type: 'search', placeholder: 'Search' } },
      { type: 'input', selector: '#quantity-input', attributes: { type: 'number', min: '1' } },
      { type: 'input', selector: '#coupon-input', attributes: { type: 'text', placeholder: 'Coupon code' } },
      { type: 'form', selector: '#login-form', attributes: { action: '/login' } },
      { type: 'form', selector: '#checkout-form', attributes: { action: '/checkout' } },
      { type: 'form', selector: '#search-form', attributes: { action: '/search' } },
      { type: 'link', selector: 'a.nav-home', text: 'Home', attributes: { href: '/' } },
      { type: 'link', selector: 'a.nav-products', text: 'Products', attributes: { href: '/products' } },
      { type: 'link', selector: 'a.nav-cart', text: 'Cart', attributes: { href: '/cart' } },
      { type: 'link', selector: 'a.forgot-password', text: 'Forgot Password?', attributes: { href: '/reset' } },
      { type: 'modal', selector: '#cart-modal', text: 'Shopping Cart' },
      { type: 'modal', selector: '#confirmation-modal', text: 'Order Confirmation' },
    ];

    // Check which elements are covered by existing test cases
    const coveredElements: CoveredElement[] = [];
    const uncoveredElements: DOMElement[] = [];

    detectedElements.forEach(element => {
      const keywords = [element.text?.toLowerCase(), element.type, element.selector].filter(Boolean);
      const matchingTests = testCases.filter(tc => 
        keywords.some(kw => 
          tc.title.toLowerCase().includes(kw!) || 
          tc.description.toLowerCase().includes(kw!) ||
          tc.steps.some(s => s.toLowerCase().includes(kw!))
        )
      );

      if (matchingTests.length > 0) {
        coveredElements.push({
          element,
          testCases: matchingTests.map(tc => tc.id),
          coverage: matchingTests.length >= 2 ? 'full' : 'partial',
        });
      } else {
        uncoveredElements.push(element);
      }
    });

    // Generate gaps and recommendations
    const gaps: CoverageGap[] = uncoveredElements.map(element => ({
      element,
      recommendation: `Add test case for ${element.type} "${element.text || element.selector}"`,
      priority: element.type === 'form' || element.type === 'button' ? 'high' : 'medium',
      category: element.type === 'form' ? 'Forms' : 
                element.type === 'button' ? 'Buttons' : 
                element.type === 'input' ? 'Inputs' : 
                element.type === 'link' ? 'Navigation' : 'UI Components',
    }));

    // Generate suggested test cases for gaps
    const suggestedTestCases: SuggestedTestCase[] = uncoveredElements.slice(0, 5).map(element => {
      const actionVerb = element.type === 'button' ? 'Click' : 
                         element.type === 'input' ? 'Enter data in' : 
                         element.type === 'form' ? 'Submit' :
                         element.type === 'link' ? 'Navigate to' : 'Interact with';
      
      return {
        title: `${actionVerb} ${element.text || element.type} - ${element.selector}`,
        description: `Test the ${element.type} element ${element.text ? `"${element.text}"` : ''} on ${hostname}`,
        steps: [
          `Navigate to ${coverageUrl}`,
          `Locate the ${element.type} element ${element.text ? `with text "${element.text}"` : `at ${element.selector}`}`,
          `${actionVerb} the element`,
          'Verify the expected behavior',
        ],
        expectedResult: element.type === 'button' ? 'Action is performed successfully' :
                       element.type === 'form' ? 'Form is submitted and validated' :
                       element.type === 'input' ? 'Input accepts and validates data' :
                       element.type === 'link' ? 'Navigation to target page succeeds' :
                       'Element behaves as expected',
        priority: element.type === 'form' ? 'high' : element.type === 'button' ? 'high' : 'medium',
        category: element.type === 'form' ? 'Forms' : 
                  element.type === 'button' ? 'User Actions' : 
                  element.type === 'input' ? 'Data Entry' : 
                  element.type === 'link' ? 'Navigation' : 'UI Components',
      };
    });

    // Calculate coverage by category
    const categories = ['Buttons', 'Forms', 'Inputs', 'Navigation', 'UI Components'];
    const coverageByCategory: Record<string, { total: number; covered: number; percentage: number }> = {};
    
    categories.forEach(cat => {
      const categoryType = cat === 'Buttons' ? 'button' : 
                          cat === 'Forms' ? 'form' : 
                          cat === 'Inputs' ? 'input' : 
                          cat === 'Navigation' ? 'link' : 'modal';
      const total = detectedElements.filter(e => e.type === categoryType).length;
      const covered = coveredElements.filter(e => e.element.type === categoryType).length;
      coverageByCategory[cat] = {
        total,
        covered,
        percentage: total > 0 ? Math.round((covered / total) * 100) : 0,
      };
    });

    const overallScore = Math.round((coveredElements.length / detectedElements.length) * 100);

    const results: CoverageAnalysis = {
      url: coverageUrl,
      timestamp: new Date().toISOString(),
      overallScore,
      elementsFound: detectedElements.length,
      elementsCovered: coveredElements.length,
      coverageByCategory,
      coveredElements,
      gaps,
      suggestedTestCases,
      pageMetadata: {
        title: `${hostname} - Page Analysis`,
        forms: detectedElements.filter(e => e.type === 'form').length,
        buttons: detectedElements.filter(e => e.type === 'button').length,
        links: detectedElements.filter(e => e.type === 'link').length,
        inputs: detectedElements.filter(e => e.type === 'input').length,
        modals: detectedElements.filter(e => e.type === 'modal').length,
      },
    };

    setCoverageResults(results);
    setIsAnalyzing(false);
    setAnalysisPhase('');

    toast({
      title: 'Analysis Complete',
      description: `Found ${detectedElements.length} elements, ${overallScore}% coverage`,
    });
  };

  // Add suggested test case from coverage analysis
  const addSuggestedTestCase = (suggested: SuggestedTestCase) => {
    const newTestCase: TestCase = {
      id: generateId(),
      projectId: selectedProject,
      title: suggested.title,
      description: suggested.description,
      preconditions: 'User is on the target page',
      steps: suggested.steps,
      expectedResult: suggested.expectedResult,
      priority: suggested.priority as TestCase['priority'],
      severity: 'major',
      status: 'draft',
      testType: 'functional',
      automationFeasibility: 'yes',
      source: 'crawler',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'AI Coverage Agent',
    };

    setTestCases(prev => [newTestCase, ...prev]);
    
    toast({
      title: 'Test Case Added',
      description: `${newTestCase.id} has been created from suggestion`,
    });
  };

  // Add all suggested test cases
  const addAllSuggestedTestCases = () => {
    if (!coverageResults) return;

    let currentMaxId = testCases.reduce((max, tc) => {
      const num = parseInt(tc.id.replace('TC-', ''), 10);
      return num > max ? num : max;
    }, 0);

    const newTestCases: TestCase[] = coverageResults.suggestedTestCases.map(suggested => {
      currentMaxId++;
      return {
        id: `TC-${String(currentMaxId).padStart(3, '0')}`,
        projectId: selectedProject,
        title: suggested.title,
        description: suggested.description,
        preconditions: 'User is on the target page',
        steps: suggested.steps,
        expectedResult: suggested.expectedResult,
        priority: suggested.priority as TestCase['priority'],
        severity: 'major',
        status: 'draft',
        testType: 'functional',
        automationFeasibility: 'yes',
        source: 'crawler',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'AI Coverage Agent',
      };
    });

    setTestCases(prev => [...newTestCases, ...prev]);
    
    toast({
      title: 'Test Cases Added',
      description: `${newTestCases.length} test cases created from suggestions`,
    });
  };

  // Handle export
  const handleExport = () => {
    const dataStr = JSON.stringify(testCases, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test-cases-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: `${testCases.length} test cases exported to JSON`,
    });
  };

  // Toggle advanced filter
  const toggleFilter = (category: keyof typeof advancedFilters, value: string) => {
    setAdvancedFilters(prev => {
      const current = prev[category];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setAdvancedFilters({
      testTypes: [],
      sources: [],
      severities: [],
    });
    setPriorityFilter('all');
    setSearchQuery('');
  };

  const hasActiveFilters = advancedFilters.testTypes.length > 0 || 
    advancedFilters.sources.length > 0 || 
    advancedFilters.severities.length > 0 ||
    priorityFilter !== 'all';

  // Render table for test cases
  const renderTestCasesTable = (cases: typeof testCases) => (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {cases.length === 0 ? (
        <div className="text-center py-12">
          <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No test cases found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or create a new test case</p>
          <Button className="mt-4 gap-2" onClick={() => setIsNewTestCaseOpen(true)}>
            <Plus className="h-4 w-4" />
            New Test Case
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-24">ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-20">Priority</TableHead>
              <TableHead className="w-20">Status</TableHead>
              <TableHead className="w-20">Type</TableHead>
              <TableHead className="w-16">Steps</TableHead>
              <TableHead className="w-28">Updated</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map((tc) => {
              const SourceIcon = sourceIcons[tc.source] || Edit2;
              return (
                <TableRow
                  key={tc.id}
                  className="transition-colors hover:bg-muted/50"
                >
                  <TableCell className="font-mono text-sm text-primary">{tc.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{tc.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {tc.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tc.priority} className="text-xs">{tc.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tc.status} className="text-xs">{tc.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground capitalize">{tc.testType}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{tc.steps.length}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {new Date(tc.updatedAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                        onClick={() => handleStartExecution(tc)}
                        title="Execute Test"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleStartExecution(tc)}>
                            <Play className="h-4 w-4 mr-2 text-success" />
                            Execute Test
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditTestCase(tc)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateTestCase(tc)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleCreateBugFromTestCase(tc)}>
                            <Bug className="h-4 w-4 mr-2 text-destructive" />
                            Log Bug
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTestCase(tc)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );

  return (
    <AppLayout title="Test Cases" subtitle="Manage and organize your test repository">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2 border-blue-500/50 text-blue-600 hover:bg-blue-500/10" onClick={() => setIsTestCyclesOpen(true)}>
              <RotateCcw className="h-4 w-4" />
              Test Cycles
              {testCycles.filter(c => c.status === 'in-progress').length > 0 && (
                <Badge variant="secondary" className="ml-1 bg-blue-500/20 text-blue-600">
                  {testCycles.filter(c => c.status === 'in-progress').length}
                </Badge>
              )}
            </Button>
            {bugs.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <Bug className="h-3 w-3" />
                {bugs.filter(b => b.status === 'new' || b.status === 'active').length} Bugs
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setIsImportOpen(true)}>
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" className="gap-2 border-purple-500/50 text-purple-600 hover:bg-purple-500/10" onClick={() => setIsCoverageAgentOpen(true)}>
              <Scan className="h-4 w-4" />
              Coverage Agent
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setIsAIGenerateOpen(true)}>
              <Sparkles className="h-4 w-4" />
              Generate with AI
            </Button>
            <Button className="gap-2" onClick={() => setIsNewTestCaseOpen(true)}>
              <Plus className="h-4 w-4" />
              New Test Case
            </Button>
          </div>
        </div>

        {/* Tabs for filtering by status */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-muted/30 p-1.5 h-auto border-2 border-border rounded-xl">
            <TabsTrigger 
              value="all" 
              className="gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-medium transition-all"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/10">
                <FileCheck className="h-4 w-4" />
              </div>
              <span className="font-semibold">All Test Cases</span>
              <Badge 
                variant="secondary" 
                className="ml-1 text-xs font-bold bg-primary/20 text-primary border border-primary/30 px-2"
              >
                {allCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="approved" 
              className="gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-success data-[state=active]:text-success-foreground data-[state=active]:shadow-md font-medium transition-all"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-success/10">
                <CheckCircle2 className="h-4 w-4 text-success" />
              </div>
              <span className="font-semibold">Approved</span>
              <Badge 
                variant="success" 
                className="ml-1 text-xs font-bold px-2 border border-success/30"
              >
                {approvedCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="draft" 
              className="gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-warning data-[state=active]:text-warning-foreground data-[state=active]:shadow-md font-medium transition-all"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-warning/10">
                <FileEdit className="h-4 w-4 text-warning" />
              </div>
              <span className="font-semibold">Draft</span>
              <Badge 
                variant="secondary" 
                className="ml-1 text-xs font-bold px-2 border border-warning/30 bg-warning/20 text-warning"
              >
                {draftCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="deprecated" 
              className="gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-md font-medium transition-all"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
                <Archive className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="font-semibold">Deprecated</span>
              <Badge 
                variant="secondary" 
                className="ml-1 text-xs font-bold px-2 border border-border"
              >
                {deprecatedCount}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search test cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Advanced Filter Popover */}
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className={hasActiveFilters ? 'border-primary text-primary' : ''}>
                    <Filter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Advanced Filters</h4>
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          Clear all
                        </Button>
                      )}
                    </div>
                    
                    {/* Test Type Filter */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Test Type</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {['functional', 'regression', 'smoke', 'integration', 'e2e'].map((type) => (
                          <div key={type} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`type-${type}`}
                              checked={advancedFilters.testTypes.includes(type)}
                              onCheckedChange={() => toggleFilter('testTypes', type)}
                            />
                            <Label htmlFor={`type-${type}`} className="text-sm capitalize cursor-pointer">
                              {type}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Source Filter */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Source</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {['manual', 'figma', 'crawler', 'excel'].map((source) => (
                          <div key={source} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`source-${source}`}
                              checked={advancedFilters.sources.includes(source)}
                              onCheckedChange={() => toggleFilter('sources', source)}
                            />
                            <Label htmlFor={`source-${source}`} className="text-sm capitalize cursor-pointer">
                              {source}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Severity Filter */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Severity</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {['minor', 'major', 'critical', 'blocker'].map((severity) => (
                          <div key={severity} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`severity-${severity}`}
                              checked={advancedFilters.severities.includes(severity)}
                              onCheckedChange={() => toggleFilter('severities', severity)}
                            />
                            <Label htmlFor={`severity-${severity}`} className="text-sm capitalize cursor-pointer">
                              {severity}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button variant="outline" size="icon" onClick={handleExport} title="Export test cases">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="all">
            {renderTestCasesTable(filterTestCases('all'))}
          </TabsContent>

          <TabsContent value="approved">
            {renderTestCasesTable(filterTestCases('approved'))}
          </TabsContent>

          <TabsContent value="draft">
            {renderTestCasesTable(filterTestCases('draft'))}
          </TabsContent>

          <TabsContent value="deprecated">
            {renderTestCasesTable(filterTestCases('deprecated'))}
          </TabsContent>
        </Tabs>
      </div>

      {/* New Test Case Dialog */}
      <Dialog open={isNewTestCaseOpen} onOpenChange={setIsNewTestCaseOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Create New Test Case
            </DialogTitle>
            <DialogDescription>
              Add a new test case to your repository
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., User login with valid credentials"
                value={newTestCase.title}
                onChange={(e) => setNewTestCase(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this test case validates..."
                value={newTestCase.description}
                onChange={(e) => setNewTestCase(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preconditions">Preconditions</Label>
              <Textarea
                id="preconditions"
                placeholder="What must be true before running this test?"
                value={newTestCase.preconditions}
                onChange={(e) => setNewTestCase(prev => ({ ...prev, preconditions: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="steps">Steps (one per line)</Label>
              <Textarea
                id="steps"
                placeholder="1. Navigate to login page&#10;2. Enter credentials&#10;3. Click Login"
                value={newTestCase.steps}
                onChange={(e) => setNewTestCase(prev => ({ ...prev, steps: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedResult">Expected Result</Label>
              <Textarea
                id="expectedResult"
                placeholder="What should happen when the test passes?"
                value={newTestCase.expectedResult}
                onChange={(e) => setNewTestCase(prev => ({ ...prev, expectedResult: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select 
                  value={newTestCase.priority} 
                  onValueChange={(value: TestCase['priority']) => setNewTestCase(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Severity</Label>
                <Select 
                  value={newTestCase.severity} 
                  onValueChange={(value: TestCase['severity']) => setNewTestCase(prev => ({ ...prev, severity: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="blocker">Blocker</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Test Type</Label>
                <Select 
                  value={newTestCase.testType} 
                  onValueChange={(value: TestCase['testType']) => setNewTestCase(prev => ({ ...prev, testType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="functional">Functional</SelectItem>
                    <SelectItem value="regression">Regression</SelectItem>
                    <SelectItem value="smoke">Smoke</SelectItem>
                    <SelectItem value="integration">Integration</SelectItem>
                    <SelectItem value="e2e">E2E</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Automation Feasibility</Label>
                <Select 
                  value={newTestCase.automationFeasibility} 
                  onValueChange={(value: TestCase['automationFeasibility']) => setNewTestCase(prev => ({ ...prev, automationFeasibility: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewTestCaseOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTestCase}>
              Create Test Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Import Test Cases
            </DialogTitle>
            <DialogDescription>
              Import test cases from various sources
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-4">
            <Button 
              variant="outline" 
              className="justify-start gap-3 h-14"
              onClick={() => handleImportSourceSelect('excel')}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10">
                <FileSpreadsheet className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-left">
                <p className="font-medium">Excel / CSV File</p>
                <p className="text-xs text-muted-foreground">Upload spreadsheet with test cases</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="justify-start gap-3 h-14"
              onClick={() => handleImportSourceSelect('figma')}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/10">
                <Figma className="h-5 w-5 text-purple-500" />
              </div>
              <div className="text-left">
                <p className="font-medium">Figma Designs</p>
                <p className="text-xs text-muted-foreground">Extract test cases from Figma</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="justify-start gap-3 h-14"
              onClick={() => handleImportSourceSelect('url')}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10">
                <Globe className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-left">
                <p className="font-medium">Web Crawler</p>
                <p className="text-xs text-muted-foreground">Crawl website and generate tests</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="justify-start gap-3 h-14"
              onClick={() => handleImportSourceSelect('json')}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-500/10">
                <FileUp className="h-5 w-5 text-orange-500" />
              </div>
              <div className="text-left">
                <p className="font-medium">JSON File</p>
                <p className="text-xs text-muted-foreground">Import from JSON export</p>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={isBulkUploadOpen} onOpenChange={(open) => {
        setIsBulkUploadOpen(open);
        if (!open) resetUploadState();
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-green-500" />
              Bulk Upload Test Cases
            </DialogTitle>
            <DialogDescription>
              Upload an Excel or CSV file containing test cases
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Project Selection */}
            <div className="space-y-2">
              <Label>Target Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {mockProjects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Upload Area */}
            <div className="space-y-2">
              <Label>Upload File</Label>
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer hover:border-primary/50 ${
                  uploadedFile ? 'border-success bg-success/5' : 'border-border'
                } ${parseError ? 'border-destructive bg-destructive/5' : ''}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {!uploadedFile ? (
                  <>
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium text-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      CSV, XLSX, or XLS files supported
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-3">
                      <File className="h-8 w-8 text-success" />
                      <div className="text-left">
                        <p className="font-medium text-foreground">{uploadedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          resetUploadState();
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {uploadProgress < 100 && (
                      <Progress value={uploadProgress} className="mt-3" />
                    )}
                  </>
                )}
              </div>
              
              {parseError && (
                <div className="flex items-center gap-2 text-destructive text-sm mt-2">
                  <AlertCircle className="h-4 w-4" />
                  {parseError}
                </div>
              )}
            </div>

            {/* Parsed Data Preview */}
            {parsedData.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span className="font-medium">
                      {parsedData.length} test cases detected
                    </span>
                  </div>
                </div>

                {/* Column Mapping */}
                <div className="space-y-3 p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm">Column Mapping</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(columnMapping).map(([field, value]) => (
                      <div key={field} className="space-y-1">
                        <Label className="text-xs capitalize text-muted-foreground">
                          {field.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                        <Select 
                          value={value} 
                          onValueChange={(v) => setColumnMapping(prev => ({ ...prev, [field]: v }))}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(parsedData[0] || {}).map(col => (
                              <SelectItem key={col} value={col} className="text-sm">
                                {col}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview Table */}
                <div className="space-y-2">
                  <Label className="text-sm">Preview (first 3 rows)</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedData.slice(0, 3).map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-xs">{idx + 1}</TableCell>
                            <TableCell className="max-w-xs truncate">
                              {row[columnMapping.title] || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {row[columnMapping.priority] || 'medium'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {row[columnMapping.testType] || 'functional'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {parsedData.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      ... and {parsedData.length - 3} more rows
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Template Download */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div>
                <p className="font-medium text-sm">Need a template?</p>
                <p className="text-xs text-muted-foreground">
                  Download our CSV template with the correct format
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const template = 'title,description,preconditions,steps,expectedResult,priority,testType\n"Login Test","Test user login","User exists","Navigate to login;Enter credentials;Click submit","User is logged in","high","functional"\n';
                  const blob = new Blob([template], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'test-cases-template.csv';
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsBulkUploadOpen(false);
                resetUploadState();
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBulkImport}
              disabled={parsedData.length === 0 || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import {parsedData.length} Test Cases
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generate Dialog */}
      <Dialog open={isAIGenerateOpen} onOpenChange={setIsAIGenerateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Generate with AI
            </DialogTitle>
            <DialogDescription>
              Use AI to automatically generate test cases
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ai-url">Website URL (optional)</Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="ai-url"
                  placeholder="https://example.com"
                  value={aiUrl}
                  onChange={(e) => setAiUrl(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                AI will analyze the page and generate relevant test cases
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-prompt">Description / Requirements</Label>
              <Textarea
                id="ai-prompt"
                placeholder="Describe the feature or functionality you want to test...&#10;&#10;Example: Test the shopping cart checkout flow including adding items, applying discounts, and payment processing"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-count">Number of Test Cases</Label>
              <Select value={aiCount} onValueChange={setAiCount}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 test cases</SelectItem>
                  <SelectItem value="5">5 test cases</SelectItem>
                  <SelectItem value="10">10 test cases</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAIGenerateOpen(false)} disabled={isGenerating}>
              Cancel
            </Button>
            <Button onClick={handleAIGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Coverage Agent Dialog */}
      <Dialog open={isCoverageAgentOpen} onOpenChange={(open) => {
        setIsCoverageAgentOpen(open);
        if (!open) {
          setCoverageResults(null);
          setCoverageUrl('');
          setAnalysisProgress(0);
        }
      }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/10">
                <Scan className="h-5 w-5 text-purple-500" />
              </div>
              AI Coverage Agent
            </DialogTitle>
            <DialogDescription>
              Analyze your test cases against a website's DOM to find coverage gaps and get suggestions
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {!coverageResults ? (
              <div className="space-y-6 py-4">
                {/* URL Input */}
                <div className="space-y-2">
                  <Label htmlFor="coverage-url">Website URL to Analyze</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="coverage-url"
                      placeholder="https://example.com/page"
                      value={coverageUrl}
                      onChange={(e) => setCoverageUrl(e.target.value)}
                      className="pl-9"
                      disabled={isAnalyzing}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter the URL of the page you want to analyze for test coverage
                  </p>
                </div>

                {/* Project Selection */}
                <div className="space-y-2">
                  <Label>Project Context</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject} disabled={isAnalyzing}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockProjects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Test cases from this project will be matched against the DOM
                  </p>
                </div>

                {/* Current Test Cases Info */}
                <div className="p-4 bg-muted/30 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Current Test Repository</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div className="p-2 bg-background rounded-lg">
                      <p className="text-2xl font-bold text-primary">{testCases.length}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="p-2 bg-background rounded-lg">
                      <p className="text-2xl font-bold text-success">{testCases.filter(t => t.status === 'approved').length}</p>
                      <p className="text-xs text-muted-foreground">Approved</p>
                    </div>
                    <div className="p-2 bg-background rounded-lg">
                      <p className="text-2xl font-bold text-warning">{testCases.filter(t => t.status === 'draft').length}</p>
                      <p className="text-xs text-muted-foreground">Draft</p>
                    </div>
                    <div className="p-2 bg-background rounded-lg">
                      <p className="text-2xl font-bold text-muted-foreground">{testCases.filter(t => t.status === 'deprecated').length}</p>
                      <p className="text-xs text-muted-foreground">Deprecated</p>
                    </div>
                  </div>
                </div>

                {/* Analysis Progress */}
                {isAnalyzing && (
                  <div className="space-y-3 p-4 border border-purple-500/30 bg-purple-500/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                      <span className="font-medium text-purple-600">{analysisPhase}</span>
                    </div>
                    <Progress value={analysisProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                      {analysisProgress}% complete
                    </p>
                  </div>
                )}

                {/* How it works */}
                <div className="space-y-3">
                  <Label className="text-sm">How it works</Label>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-500 text-xs font-bold">1</div>
                      <div>
                        <p className="font-medium text-sm">DOM Analysis</p>
                        <p className="text-xs text-muted-foreground">Agent scans the page for interactive elements (buttons, forms, inputs, links)</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-500 text-xs font-bold">2</div>
                      <div>
                        <p className="font-medium text-sm">Test Case Matching</p>
                        <p className="text-xs text-muted-foreground">Compares detected elements with your existing test cases</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-500 text-xs font-bold">3</div>
                      <div>
                        <p className="font-medium text-sm">Gap Analysis & Suggestions</p>
                        <p className="text-xs text-muted-foreground">Identifies uncovered elements and generates test case suggestions</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Results View */
              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-6 py-4">
                  {/* Coverage Score */}
                  <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-purple-500/10 to-primary/10 rounded-xl">
                    <div className="relative">
                      <div className={`flex items-center justify-center w-24 h-24 rounded-full border-4 ${
                        coverageResults.overallScore >= 70 ? 'border-success' : 
                        coverageResults.overallScore >= 40 ? 'border-warning' : 'border-destructive'
                      }`}>
                        <span className="text-3xl font-bold">{coverageResults.overallScore}%</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">Overall Test Coverage</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {coverageResults.elementsCovered} of {coverageResults.elementsFound} interactive elements are covered by test cases
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span>{coverageResults.elementsCovered} Covered</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4 text-warning" />
                          <span>{coverageResults.gaps.length} Gaps</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4 text-primary" />
                          <span>{coverageResults.suggestedTestCases.length} Suggestions</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Page Metadata */}
                  <div className="grid grid-cols-5 gap-3">
                    <Card className="p-3 text-center">
                      <MousePointer className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                      <p className="text-xl font-bold">{coverageResults.pageMetadata.buttons}</p>
                      <p className="text-xs text-muted-foreground">Buttons</p>
                    </Card>
                    <Card className="p-3 text-center">
                      <FormInput className="h-5 w-5 mx-auto mb-1 text-green-500" />
                      <p className="text-xl font-bold">{coverageResults.pageMetadata.forms}</p>
                      <p className="text-xs text-muted-foreground">Forms</p>
                    </Card>
                    <Card className="p-3 text-center">
                      <Edit2 className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                      <p className="text-xl font-bold">{coverageResults.pageMetadata.inputs}</p>
                      <p className="text-xs text-muted-foreground">Inputs</p>
                    </Card>
                    <Card className="p-3 text-center">
                      <Navigation className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                      <p className="text-xl font-bold">{coverageResults.pageMetadata.links}</p>
                      <p className="text-xs text-muted-foreground">Links</p>
                    </Card>
                    <Card className="p-3 text-center">
                      <LayoutGrid className="h-5 w-5 mx-auto mb-1 text-pink-500" />
                      <p className="text-xl font-bold">{coverageResults.pageMetadata.modals}</p>
                      <p className="text-xs text-muted-foreground">Modals</p>
                    </Card>
                  </div>

                  {/* Coverage by Category */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Coverage by Category</Label>
                    <div className="space-y-2">
                      {Object.entries(coverageResults.coverageByCategory).map(([category, data]) => (
                        <div key={category} className="flex items-center gap-3">
                          <span className="w-24 text-sm text-muted-foreground">{category}</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${
                                data.percentage >= 70 ? 'bg-success' : 
                                data.percentage >= 40 ? 'bg-warning' : 'bg-destructive'
                              }`}
                              style={{ width: `${data.percentage}%` }}
                            />
                          </div>
                          <span className="w-16 text-sm text-right">
                            {data.covered}/{data.total} ({data.percentage}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Coverage Gaps */}
                  {coverageResults.gaps.length > 0 && (
                    <Accordion type="single" collapsible defaultValue="gaps">
                      <AccordionItem value="gaps" className="border rounded-xl px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-warning" />
                            <span>Coverage Gaps ({coverageResults.gaps.length})</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pt-2">
                            {coverageResults.gaps.map((gap, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Badge variant={gap.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                                    {gap.priority}
                                  </Badge>
                                  <div>
                                    <p className="font-medium text-sm">{gap.element.text || gap.element.selector}</p>
                                    <p className="text-xs text-muted-foreground">{gap.element.type} • {gap.category}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}

                  {/* Suggested Test Cases */}
                  {coverageResults.suggestedTestCases.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-primary" />
                          <Label className="text-sm font-semibold">Suggested Test Cases</Label>
                        </div>
                        <Button size="sm" variant="outline" onClick={addAllSuggestedTestCases}>
                          <Plus className="h-3 w-3 mr-1" />
                          Add All ({coverageResults.suggestedTestCases.length})
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {coverageResults.suggestedTestCases.map((suggested, idx) => (
                          <Card key={idx} className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant={suggested.priority === 'high' ? 'destructive' : suggested.priority === 'critical' ? 'destructive' : 'secondary'}>
                                    {suggested.priority}
                                  </Badge>
                                  <Badge variant="outline">{suggested.category}</Badge>
                                </div>
                                <h4 className="font-medium">{suggested.title}</h4>
                                <p className="text-sm text-muted-foreground">{suggested.description}</p>
                                <div className="text-xs text-muted-foreground">
                                  <span className="font-medium">Steps: </span>
                                  {suggested.steps.length} steps defined
                                </div>
                              </div>
                              <Button size="sm" onClick={() => addSuggestedTestCase(suggested)}>
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Covered Elements */}
                  {coverageResults.coveredElements.length > 0 && (
                    <Accordion type="single" collapsible>
                      <AccordionItem value="covered" className="border rounded-xl px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-success" />
                            <span>Covered Elements ({coverageResults.coveredElements.length})</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pt-2">
                            {coverageResults.coveredElements.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-success/5 rounded-lg border border-success/20">
                                <div className="flex items-center gap-3">
                                  <CheckCircle className="h-4 w-4 text-success" />
                                  <div>
                                    <p className="font-medium text-sm">{item.element.text || item.element.selector}</p>
                                    <p className="text-xs text-muted-foreground">{item.element.type}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={item.coverage === 'full' ? 'success' : 'secondary'} className="text-xs">
                                    {item.coverage}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {item.testCases.join(', ')}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            {!coverageResults ? (
              <>
                <Button variant="outline" onClick={() => setIsCoverageAgentOpen(false)} disabled={isAnalyzing}>
                  Cancel
                </Button>
                <Button onClick={runCoverageAnalysis} disabled={isAnalyzing || !coverageUrl.trim()}>
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Scan className="mr-2 h-4 w-4" />
                      Start Analysis
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => {
                  setCoverageResults(null);
                  setCoverageUrl('');
                }}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  New Analysis
                </Button>
                <Button onClick={() => setIsCoverageAgentOpen(false)}>
                  Done
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Test Case Dialog */}
      <Dialog open={isEditTestCaseOpen} onOpenChange={setIsEditTestCaseOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Edit Test Case
              {editingTestCase && (
                <Badge variant="secondary">{editingTestCase.id}</Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Update test case details and steps
            </DialogDescription>
          </DialogHeader>

          {editingTestCase && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={editingTestCase.title}
                  onChange={(e) => setEditingTestCase(prev => prev ? { ...prev, title: e.target.value } : null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingTestCase.description}
                  onChange={(e) => setEditingTestCase(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-preconditions">Preconditions</Label>
                <Textarea
                  id="edit-preconditions"
                  value={editingTestCase.preconditions}
                  onChange={(e) => setEditingTestCase(prev => prev ? { ...prev, preconditions: e.target.value } : null)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Steps</Label>
                <div className="space-y-2">
                  {editingTestCase.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-6">{idx + 1}.</span>
                      <Input
                        value={step}
                        onChange={(e) => {
                          const newSteps = [...editingTestCase.steps];
                          newSteps[idx] = e.target.value;
                          setEditingTestCase(prev => prev ? { ...prev, steps: newSteps } : null);
                        }}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => {
                          const newSteps = editingTestCase.steps.filter((_, i) => i !== idx);
                          setEditingTestCase(prev => prev ? { ...prev, steps: newSteps } : null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingTestCase(prev => prev ? { ...prev, steps: [...prev.steps, ''] } : null);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Step
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-expected">Expected Result</Label>
                <Textarea
                  id="edit-expected"
                  value={editingTestCase.expectedResult}
                  onChange={(e) => setEditingTestCase(prev => prev ? { ...prev, expectedResult: e.target.value } : null)}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select 
                    value={editingTestCase.priority} 
                    onValueChange={(v: TestCase['priority']) => setEditingTestCase(prev => prev ? { ...prev, priority: v } : null)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={editingTestCase.status} 
                    onValueChange={(v: TestCase['status']) => setEditingTestCase(prev => prev ? { ...prev, status: v } : null)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="deprecated">Deprecated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Test Type</Label>
                  <Select 
                    value={editingTestCase.testType} 
                    onValueChange={(v: TestCase['testType']) => setEditingTestCase(prev => prev ? { ...prev, testType: v } : null)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="functional">Functional</SelectItem>
                      <SelectItem value="regression">Regression</SelectItem>
                      <SelectItem value="smoke">Smoke</SelectItem>
                      <SelectItem value="integration">Integration</SelectItem>
                      <SelectItem value="e2e">E2E</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select 
                    value={editingTestCase.severity} 
                    onValueChange={(v: TestCase['severity']) => setEditingTestCase(prev => prev ? { ...prev, severity: v } : null)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="major">Major</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="blocker">Blocker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditTestCaseOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTestCase}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Execute Test Dialog */}
      <Dialog open={isExecuteTestOpen} onOpenChange={setIsExecuteTestOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-success" />
              Execute Test Case
              {executingTestCase && (
                <Badge variant="secondary">{executingTestCase.id}</Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {executingTestCase?.title}
            </DialogDescription>
          </DialogHeader>

          {executingTestCase && (
            <ScrollArea className="flex-1 max-h-[60vh] pr-4">
              <div className="space-y-6 py-4">
                {/* Preconditions */}
                {executingTestCase.preconditions && (
                  <div className="p-4 bg-muted/30 rounded-xl">
                    <Label className="text-sm font-semibold">Preconditions</Label>
                    <p className="text-sm text-muted-foreground mt-1">{executingTestCase.preconditions}</p>
                  </div>
                )}

                {/* Steps */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Test Steps</Label>
                  {executingTestCase.steps.map((step, idx) => (
                    <div 
                      key={idx} 
                      className={`p-4 border rounded-xl space-y-3 ${
                        stepExecutions[idx]?.status === 'passed' ? 'border-success bg-success/5' :
                        stepExecutions[idx]?.status === 'failed' ? 'border-destructive bg-destructive/5' :
                        stepExecutions[idx]?.status === 'skipped' ? 'border-muted bg-muted/30' :
                        'border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                            {idx + 1}
                          </span>
                          <p className="text-sm font-medium pt-0.5">{step}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant={stepExecutions[idx]?.status === 'passed' ? 'default' : 'outline'}
                            size="sm"
                            className={stepExecutions[idx]?.status === 'passed' ? 'bg-success hover:bg-success/90' : ''}
                            onClick={() => updateStepExecution(idx, 'passed')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Pass
                          </Button>
                          <Button
                            variant={stepExecutions[idx]?.status === 'failed' ? 'default' : 'outline'}
                            size="sm"
                            className={stepExecutions[idx]?.status === 'failed' ? 'bg-destructive hover:bg-destructive/90' : ''}
                            onClick={() => updateStepExecution(idx, 'failed')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Fail
                          </Button>
                          <Button
                            variant={stepExecutions[idx]?.status === 'skipped' ? 'default' : 'outline'}
                            size="sm"
                            className={stepExecutions[idx]?.status === 'skipped' ? 'bg-muted-foreground hover:bg-muted-foreground/90' : ''}
                            onClick={() => updateStepExecution(idx, 'skipped')}
                          >
                            <SkipForward className="h-4 w-4 mr-1" />
                            Skip
                          </Button>
                        </div>
                      </div>
                      
                      {stepExecutions[idx]?.status === 'failed' && (
                        <div className="pl-9">
                          <Label className="text-xs text-muted-foreground">Actual Result</Label>
                          <Textarea
                            placeholder="Describe what actually happened..."
                            value={stepExecutions[idx]?.actualResult || ''}
                            onChange={(e) => updateStepExecution(idx, 'failed', e.target.value)}
                            className="mt-1"
                            rows={2}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Expected Result */}
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <Label className="text-sm font-semibold text-primary">Expected Result</Label>
                  <p className="text-sm mt-1">{executingTestCase.expectedResult}</p>
                </div>

                {/* Execution Notes */}
                <div className="space-y-2">
                  <Label>Execution Notes</Label>
                  <Textarea
                    placeholder="Add any additional notes about this execution..."
                    value={executionNotes}
                    onChange={(e) => setExecutionNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="border-t pt-4">
            <div className="flex items-center gap-2 mr-auto">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant={
                getOverallExecutionStatus() === 'passed' ? 'success' :
                getOverallExecutionStatus() === 'failed' ? 'destructive' :
                'secondary'
              }>
                {getOverallExecutionStatus()}
              </Badge>
            </div>
            <Button variant="outline" onClick={() => setIsExecuteTestOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteExecution}>
              Complete Execution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Cycles Dialog */}
      <Dialog open={isTestCyclesOpen} onOpenChange={setIsTestCyclesOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-blue-500" />
              Test Cycles
            </DialogTitle>
            <DialogDescription>
              Manage regression, smoke, and other test cycles
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{testCycles.length} Cycles</Badge>
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-600">
                {testCycles.filter(c => c.status === 'in-progress').length} Active
              </Badge>
            </div>
            <Button onClick={() => setIsNewCycleOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Cycle
            </Button>
          </div>

          <ScrollArea className="flex-1 max-h-[50vh]">
            <div className="space-y-3 pr-4">
              {testCycles.length === 0 ? (
                <div className="text-center py-12">
                  <RotateCcw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="font-medium">No test cycles yet</p>
                  <p className="text-sm text-muted-foreground">Create a cycle to run tests for regression or other purposes</p>
                </div>
              ) : (
                testCycles.map(cycle => (
                  <Card key={cycle.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{cycle.name}</h4>
                          <Badge variant="secondary" className="text-xs capitalize">{cycle.type}</Badge>
                          <Badge 
                            variant={
                              cycle.status === 'completed' ? 'success' :
                              cycle.status === 'in-progress' ? 'default' :
                              cycle.status === 'aborted' ? 'destructive' :
                              'secondary'
                            }
                            className="text-xs"
                          >
                            {cycle.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{cycle.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span className="flex items-center gap-1">
                            <FileCheck className="h-3 w-3" />
                            {cycle.totalTests} tests
                          </span>
                          <span className="flex items-center gap-1 text-success">
                            <CheckCircle className="h-3 w-3" />
                            {cycle.passedTests} passed
                          </span>
                          <span className="flex items-center gap-1 text-destructive">
                            <XCircle className="h-3 w-3" />
                            {cycle.failedTests} failed
                          </span>
                          {cycle.passRate !== undefined && (
                            <span className="flex items-center gap-1">
                              <BarChart3 className="h-3 w-3" />
                              {cycle.passRate}% pass rate
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {cycle.status === 'planned' && (
                          <Button size="sm" onClick={() => handleStartCycle(cycle)}>
                            <Play className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                        )}
                        {cycle.status === 'in-progress' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedCycle(cycle);
                                setIsTestCyclesOpen(false);
                              }}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Continue
                            </Button>
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleCompleteCycle(cycle)}
                            >
                              Complete
                            </Button>
                          </>
                        )}
                        {cycle.status === 'completed' && (
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View Report
                          </Button>
                        )}
                      </div>
                    </div>
                    {cycle.status === 'in-progress' && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>{cycle.executions.length}/{cycle.totalTests} executed</span>
                        </div>
                        <Progress value={(cycle.executions.length / cycle.totalTests) * 100} className="h-2" />
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsTestCyclesOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Test Cycle Dialog */}
      <Dialog open={isNewCycleOpen} onOpenChange={setIsNewCycleOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Create Test Cycle
            </DialogTitle>
            <DialogDescription>
              Create a new test cycle for regression, smoke, or other testing
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 max-h-[60vh] pr-4">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Cycle Name *</Label>
                <Input
                  placeholder="e.g., Sprint 15 Regression"
                  value={newCycleName}
                  onChange={(e) => setNewCycleName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Cycle Type</Label>
                <Select value={newCycleType} onValueChange={(v: TestCycle['type']) => setNewCycleType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regression">Regression</SelectItem>
                    <SelectItem value="smoke">Smoke</SelectItem>
                    <SelectItem value="functional">Functional</SelectItem>
                    <SelectItem value="integration">Integration</SelectItem>
                    <SelectItem value="release">Release</SelectItem>
                    <SelectItem value="adhoc">Ad-hoc</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the purpose of this test cycle..."
                  value={newCycleDescription}
                  onChange={(e) => setNewCycleDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Select Test Cases *</Label>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedTestCasesForCycle(testCases.filter(tc => tc.status === 'approved').map(tc => tc.id))}
                    >
                      Select All Approved
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedTestCasesForCycle([])}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="border rounded-xl p-3 max-h-60 overflow-y-auto space-y-2">
                  {testCases.filter(tc => tc.status !== 'deprecated').map(tc => (
                    <div 
                      key={tc.id} 
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedTestCasesForCycle.includes(tc.id) ? 'bg-primary/10' : 'hover:bg-muted'
                      }`}
                      onClick={() => {
                        setSelectedTestCasesForCycle(prev => 
                          prev.includes(tc.id) 
                            ? prev.filter(id => id !== tc.id)
                            : [...prev, tc.id]
                        );
                      }}
                    >
                      <Checkbox checked={selectedTestCasesForCycle.includes(tc.id)} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{tc.title}</p>
                        <p className="text-xs text-muted-foreground">{tc.id} • {tc.testType}</p>
                      </div>
                      <Badge variant={tc.priority} className="text-xs">{tc.priority}</Badge>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedTestCasesForCycle.length} test cases selected
                </p>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsNewCycleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTestCycle}>
              Create Cycle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Bug Dialog */}
      <Dialog open={isCreateBugOpen} onOpenChange={setIsCreateBugOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-destructive" />
              Log Bug
            </DialogTitle>
            <DialogDescription>
              {bugFromTestCase 
                ? `Create a bug from failed test case ${bugFromTestCase.id}`
                : 'Create a new bug report'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Bug Title *</Label>
              <Input
                placeholder="Brief description of the issue"
                value={newBugTitle}
                onChange={(e) => setNewBugTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Detailed description of the bug..."
                value={newBugDescription}
                onChange={(e) => setNewBugDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={newBugPriority} onValueChange={(v: Bug['priority']) => setNewBugPriority(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={newBugSeverity} onValueChange={(v: Bug['severity']) => setNewBugSeverity(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="blocker">Blocker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {bugFromTestCase && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <Label className="text-xs text-muted-foreground">Linked Test Case</Label>
                <p className="text-sm font-medium">{bugFromTestCase.id}: {bugFromTestCase.title}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateBugOpen(false);
              setBugFromTestCase(null);
              setNewBugTitle('');
              setNewBugDescription('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateBug} className="bg-destructive hover:bg-destructive/90">
              <Bug className="h-4 w-4 mr-2" />
              Create Bug
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
