import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Globe, FileText, Link as LinkIcon } from "lucide-react";

interface PageAnalysisProps {
  pages: any[];
}

export const PageAnalysis = ({ pages }: PageAnalysisProps) => {
  if (!pages || pages.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 mt-8 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-6">
        <Globe className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Page Analysis</h2>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>URL</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-center">Forms</TableHead>
              <TableHead className="text-center">Links</TableHead>
              <TableHead>Discovered</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((page) => (
              <TableRow key={page.id}>
                <TableCell className="font-medium max-w-xs truncate">
                  <a 
                    href={page.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <LinkIcon className="w-3 h-3" />
                    {page.url}
                  </a>
                </TableCell>
                <TableCell>{page.title || 'Untitled'}</TableCell>
                <TableCell>
                  <Badge variant="outline">{page.page_type || 'general'}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">{page.forms_count || 0}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">{page.links_count || 0}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(page.discovered_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 grid md:grid-cols-3 gap-4">
        <div className="p-4 bg-background/50 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">Total Pages</p>
          <p className="text-2xl font-bold">{pages.length}</p>
        </div>
        <div className="p-4 bg-background/50 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">Total Forms</p>
          <p className="text-2xl font-bold">
            {pages.reduce((sum, p) => sum + (p.forms_count || 0), 0)}
          </p>
        </div>
        <div className="p-4 bg-background/50 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">Total Links</p>
          <p className="text-2xl font-bold">
            {pages.reduce((sum, p) => sum + (p.links_count || 0), 0)}
          </p>
        </div>
      </div>
    </Card>
  );
}
