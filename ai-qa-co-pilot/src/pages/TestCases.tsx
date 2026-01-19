import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { testCases } from '@/data/mockTestCases';
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
} from 'lucide-react';

const sourceIcons = {
  manual: Edit2,
  figma: Figma,
  crawler: Globe,
  excel: FileSpreadsheet,
};

export default function TestCases() {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Calculate counts for tabs
  const allCount = testCases.length;
  const approvedCount = testCases.filter((t) => t.status === 'approved').length;
  const draftCount = testCases.filter((t) => t.status === 'draft').length;
  const deprecatedCount = testCases.filter((t) => t.status === 'deprecated').length;

  // Filter function for test cases
  const filterTestCases = (statusFilter: string) => {
    return testCases.filter((tc) => {
      const matchesSearch =
        tc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tc.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || tc.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || tc.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  };

  // Render table for test cases
  const renderTestCasesTable = (cases: typeof testCases) => (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {cases.length === 0 ? (
        <div className="text-center py-12">
          <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No test cases found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
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
              const SourceIcon = sourceIcons[tc.source];
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
            <Button variant="outline" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generate with AI
            </Button>
            <Button className="gap-2">
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
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
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
    </AppLayout>
  );
}
