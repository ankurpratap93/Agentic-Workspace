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
import { TestCase } from '@/types';
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
} from 'lucide-react';

const sourceIcons: Record<string, React.ElementType> = {
  manual: Edit2,
  figma: Figma,
  crawler: Globe,
  excel: FileSpreadsheet,
};

// LocalStorage key
const STORAGE_KEY = 'qa-forge-test-cases';

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
              <TableHead className="w-28">ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-24">Priority</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-28">Type</TableHead>
              <TableHead className="w-24">Source</TableHead>
              <TableHead className="w-20">Version</TableHead>
              <TableHead className="w-32">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map((tc) => {
              const SourceIcon = sourceIcons[tc.source] || Edit2;
              return (
                <TableRow
                  key={tc.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
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
                    <Badge variant={tc.priority}>{tc.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tc.status}>{tc.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground capitalize">{tc.testType}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <SourceIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground capitalize">{tc.source}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">v{tc.version}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(tc.updatedAt).toLocaleDateString()}
                    </span>
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
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setIsImportOpen(true)}>
              <Upload className="h-4 w-4" />
              Import
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
    </AppLayout>
  );
}
