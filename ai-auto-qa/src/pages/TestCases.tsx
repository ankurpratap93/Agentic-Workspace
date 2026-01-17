import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
} from 'lucide-react';

const sourceIcons = {
  manual: Edit2,
  figma: Figma,
  crawler: Globe,
  excel: FileSpreadsheet,
};

export default function TestCases() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const filteredTestCases = testCases.filter((tc) => {
    const matchesSearch =
      tc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tc.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || tc.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <AppLayout title="Test Cases" subtitle="Manage and organize your test repository">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{testCases.length} Test Cases</Badge>
            <Badge variant="approved">
              {testCases.filter((t) => t.status === 'approved').length} Approved
            </Badge>
          </div>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="deprecated">Deprecated</SelectItem>
              </SelectContent>
            </Select>
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

        {/* Test Cases Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
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
              {filteredTestCases.map((tc) => {
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
        </div>
      </div>
    </AppLayout>
  );
}
