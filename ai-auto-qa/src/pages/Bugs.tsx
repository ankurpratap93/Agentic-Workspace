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
import { bugs } from '@/data/mockBugs';
import { Plus, Search, RefreshCw, Link2, ExternalLink, AlertCircle } from 'lucide-react';

const statusColors = {
  new: 'bg-info/10 text-info border-info/30',
  active: 'bg-warning/10 text-warning border-warning/30',
  resolved: 'bg-success/10 text-success border-success/30',
  closed: 'bg-muted text-muted-foreground border-muted-foreground/30',
};

const syncStatusIcons = {
  synced: { icon: Link2, className: 'text-success' },
  pending: { icon: RefreshCw, className: 'text-warning animate-spin' },
  error: { icon: AlertCircle, className: 'text-destructive' },
  'not-linked': { icon: Link2, className: 'text-muted-foreground' },
};

export default function Bugs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredBugs = bugs.filter((bug) => {
    const matchesSearch =
      bug.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bug.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bug.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeBugs = bugs.filter((b) => b.status === 'active' || b.status === 'new').length;
  const syncedBugs = bugs.filter((b) => b.syncStatus === 'synced').length;

  return (
    <AppLayout title="Bug Management" subtitle="Track and sync bugs with Azure DevOps">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Bugs</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{bugs.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="mt-1 text-2xl font-bold text-warning">{activeBugs}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Synced to Azure</p>
            <p className="mt-1 text-2xl font-bold text-success">{syncedBugs}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Pending Sync</p>
            <p className="mt-1 text-2xl font-bold text-info">
              {bugs.filter((b) => b.syncStatus === 'pending').length}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Sync with Azure
            </Button>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Bug
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search bugs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bugs Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-28">ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-24">Priority</TableHead>
                <TableHead className="w-24">Severity</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-28">Azure ID</TableHead>
                <TableHead className="w-24">Sync</TableHead>
                <TableHead className="w-32">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBugs.map((bug) => {
                const SyncIcon = syncStatusIcons[bug.syncStatus].icon;
                return (
                  <TableRow
                    key={bug.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="font-mono text-sm text-destructive">{bug.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{bug.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {bug.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={bug.priority}>{bug.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={bug.severity === 'blocker' ? 'critical' : bug.severity}>
                        {bug.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColors[bug.status]}`}
                      >
                        {bug.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {bug.azureBugId ? (
                        <a
                          href="#"
                          className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          {bug.azureBugId}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <SyncIcon
                          className={`h-4 w-4 ${syncStatusIcons[bug.syncStatus].className}`}
                        />
                        <span className="text-xs text-muted-foreground capitalize">
                          {bug.syncStatus.replace('-', ' ')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(bug.updatedAt).toLocaleDateString()}
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
