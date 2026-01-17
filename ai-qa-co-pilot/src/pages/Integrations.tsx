import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Link2,
  Check,
  AlertCircle,
  RefreshCw,
  Settings,
  ExternalLink,
  Figma,
  Globe,
} from 'lucide-react';

export default function Integrations() {
  const [azureConnected, setAzureConnected] = useState(true);
  const [figmaConnected, setFigmaConnected] = useState(false);

  return (
    <AppLayout title="Integrations" subtitle="Connect external services and APIs">
      <div className="space-y-6">
        {/* Azure DevOps */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-info/10">
                <svg
                  viewBox="0 0 24 24"
                  className="h-8 w-8 text-info"
                  fill="currentColor"
                >
                  <path d="M0 8.899l2.247-2.966 8.405-3.416V.045l7.37 5.393L2.966 8.36v8.224L0 15.73V8.899zm5.834 7.727l4.535 3.328 7.664-2.966v3.012l-7.664 4-6.696-4.9v-5.608l2.161 3.134zm11.838-2.057l4.328-3.329V7.123l-5.875 4.3v5.596l1.547-2.45z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Azure DevOps</h3>
                <p className="text-sm text-muted-foreground">
                  Sync bugs and work items with Azure Boards
                </p>
              </div>
            </div>
            <Badge variant={azureConnected ? 'success' : 'secondary'}>
              {azureConnected ? 'Connected' : 'Not Connected'}
            </Badge>
          </div>

          {azureConnected ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg bg-success/5 border border-success/20 p-4">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-success" />
                  <span className="font-medium text-foreground">Connection Active</span>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Organization</p>
                    <p className="font-medium text-foreground">contoso-dev</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Project</p>
                    <p className="font-medium text-foreground">QA-Platform</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Sync</p>
                    <p className="font-medium text-foreground">5 minutes ago</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch id="auto-sync" defaultChecked />
                    <Label htmlFor="auto-sync" className="text-sm">Auto-sync enabled</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="bi-directional" defaultChecked />
                    <Label htmlFor="bi-directional" className="text-sm">Bi-directional sync</Label>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Sync Now
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Configure
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="org">Organization URL</Label>
                  <Input
                    id="org"
                    placeholder="https://dev.azure.com/your-org"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="pat">Personal Access Token</Label>
                  <Input
                    id="pat"
                    type="password"
                    placeholder="Enter your PAT"
                    className="mt-1.5"
                  />
                </div>
              </div>
              <Button className="gap-2">
                <Link2 className="h-4 w-4" />
                Connect Azure DevOps
              </Button>
            </div>
          )}
        </Card>

        {/* Figma */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#F24E1E]/10">
                <Figma className="h-8 w-8 text-[#F24E1E]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Figma</h3>
                <p className="text-sm text-muted-foreground">
                  Parse designs and generate test cases from UI
                </p>
              </div>
            </div>
            <Badge variant={figmaConnected ? 'success' : 'secondary'}>
              {figmaConnected ? 'Connected' : 'Not Connected'}
            </Badge>
          </div>

          <div className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="figma-token">Figma Access Token</Label>
                <Input
                  id="figma-token"
                  type="password"
                  placeholder="Enter your Figma token"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="figma-file">File URL (optional)</Label>
                <Input
                  id="figma-file"
                  placeholder="https://figma.com/file/..."
                  className="mt-1.5"
                />
              </div>
            </div>
            <Button variant="outline" className="gap-2">
              <Figma className="h-4 w-4" />
              Connect Figma
            </Button>
          </div>
        </Card>

        {/* Web Crawler */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10">
                <Globe className="h-8 w-8 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Web Crawler</h3>
                <p className="text-sm text-muted-foreground">
                  Analyze live web applications for test generation
                </p>
              </div>
            </div>
            <Badge variant="success">Ready</Badge>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="crawl-url">Application URL</Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  id="crawl-url"
                  placeholder="https://your-app.com"
                  className="flex-1"
                />
                <Button className="gap-2">
                  <Globe className="h-4 w-4" />
                  Start Crawl
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                The crawler will analyze pages, forms, and interactions to generate test cases
              </p>
            </div>
          </div>
        </Card>

        {/* Sync History */}
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Recent Sync Activity</h3>
          <div className="space-y-3">
            {[
              { action: 'Bugs synced to Azure', count: 5, time: '5 min ago', status: 'success' },
              { action: 'Bugs pulled from Azure', count: 2, time: '15 min ago', status: 'success' },
              { action: 'Test cases exported', count: 24, time: '1 hour ago', status: 'success' },
              { action: 'Sync failed - Auth error', count: 0, time: '2 hours ago', status: 'error' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div className="flex items-center gap-3">
                  {item.status === 'success' ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="text-sm text-foreground">{item.action}</span>
                  {item.count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {item.count} items
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
