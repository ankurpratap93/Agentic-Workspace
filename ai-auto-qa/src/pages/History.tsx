import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, CheckCircle, XCircle, ArrowLeft, FileText, GitCompare } from "lucide-react";
async function fetchRuns() {
  const r = await fetch('/api/test_runs');
  if (!r.ok) throw new Error('Failed to load runs');
  return r.json();
}
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";

export default function History() {
  const [testRuns, setTestRuns] = useState<any[]>([]);
  const [filteredRuns, setFilteredRuns] = useState<any[]>([]);
  const [urlFilter, setUrlFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedRuns, setSelectedRuns] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadTestRuns();
  }, []);

  useEffect(() => {
    filterRuns();
  }, [testRuns, urlFilter, statusFilter, dateFilter]);

  const loadTestRuns = async () => {
    try {
      const data = await fetchRuns();
      setTestRuns((data || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to load test history",
        variant: "destructive"
      });
    }
  };

  const filterRuns = () => {
    let filtered = [...testRuns];

    if (urlFilter) {
      filtered = filtered.filter(run => 
        run.url.toLowerCase().includes(urlFilter.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(run => {
        if (statusFilter === 'running') {
          return run.status === 'executing_tests' || run.status === 'generating_tests';
        }
        return run.status === statusFilter;
      });
    }

    if (dateFilter) {
      filtered = filtered.filter(run => 
        run.created_at.startsWith(dateFilter)
      );
    }

    setFilteredRuns(filtered);
  };

  const toggleRunSelection = (runId: string) => {
    setSelectedRuns(prev => 
      prev.includes(runId)
        ? prev.filter(id => id !== runId)
        : prev.length < 2
          ? [...prev, runId]
          : [prev[1], runId]
    );
  };

  const compareRuns = () => {
    if (selectedRuns.length === 2) {
      navigate(`/compare?run1=${selectedRuns[0]}&run2=${selectedRuns[1]}`);
    }
  };

  const viewDetails = (runId: string) => {
    navigate(`/details/${runId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      <Header />
      <div className="container mx-auto px-6 py-12 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <h1 className="text-4xl font-bold">Test History</h1>
            <p className="text-muted-foreground mt-2">View and compare past test runs</p>
          </div>
          {selectedRuns.length === 2 && (
            <Button onClick={compareRuns} variant="hero">
              <GitCompare className="w-4 h-4 mr-2" />
              Compare Selected Runs
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6 bg-card/50 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-4">Filters</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">URL</label>
              <Input
                placeholder="Filter by URL..."
                value={urlFilter}
                onChange={(e) => setUrlFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Date</label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Test Runs Table */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Select</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tests</TableHead>
                  <TableHead>Browser</TableHead>
                  <TableHead>Depth</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRuns.map((run) => (
                  <TableRow 
                    key={run.id}
                    className={selectedRuns.includes(run.id) ? "bg-primary/10" : ""}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedRuns.includes(run.id)}
                        onChange={() => toggleRunSelection(run.id)}
                        className="w-4 h-4"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{run.url}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          run.status === 'completed' ? 'default' :
                          run.status === 'failed' ? 'destructive' :
                          'secondary'
                        }
                      >
                        {run.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {run.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                        {run.status === 'running' && <Clock className="w-3 h-3 mr-1 animate-spin" />}
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-success">{run.passed_tests || 0}</span>
                      {" / "}
                      <span className="text-destructive">{run.failed_tests || 0}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{run.browser || 'chromium'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{run.depth || 'standard'}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(run.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => viewDetails(run.id)}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
