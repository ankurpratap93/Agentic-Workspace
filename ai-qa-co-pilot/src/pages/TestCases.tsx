import { useState, useEffect } from 'react';
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
  const [isAIGenerateOpen, setIsAIGenerateOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
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

  // Handle import
  const handleImport = (source: string) => {
    toast({
      title: 'Import Started',
      description: `Importing test cases from ${source}...`,
    });
    
    // Simulate import delay
    setTimeout(() => {
      const importedCases: TestCase[] = [];
      const sourceMap: Record<string, TestCase['source']> = {
        'excel': 'excel',
        'figma': 'figma',
        'csv': 'excel',
      };
      
      for (let i = 0; i < 3; i++) {
        importedCases.push({
          id: generateId(),
          projectId: '1',
          title: `Imported Test Case ${i + 1} from ${source}`,
          description: `Test case imported from ${source} file`,
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
              onClick={() => handleImport('excel')}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10">
                <FileSpreadsheet className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-left">
                <p className="font-medium">Excel / CSV</p>
                <p className="text-xs text-muted-foreground">Import from spreadsheet files</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="justify-start gap-3 h-14"
              onClick={() => handleImport('figma')}
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
              onClick={() => handleImport('url')}
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
              onClick={() => handleImport('json')}
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
