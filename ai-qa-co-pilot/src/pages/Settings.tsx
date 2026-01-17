import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User, Bell, Shield, Database, Save } from 'lucide-react';

export default function Settings() {
  return (
    <AppLayout title="Settings" subtitle="Configure your QA platform preferences">
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="general" className="gap-2">
            <User className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <Database className="h-4 w-4" />
            Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-6">General Settings</h3>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input id="org-name" defaultValue="Acme Corp" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input id="timezone" defaultValue="UTC-8 (Pacific)" className="mt-1.5" />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Test Case Defaults</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="default-priority">Default Priority</Label>
                    <Input id="default-priority" defaultValue="Medium" className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="default-type">Default Test Type</Label>
                    <Input id="default-type" defaultValue="Functional" className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="id-prefix">Test Case ID Prefix</Label>
                    <Input id="id-prefix" defaultValue="TC-" className="mt-1.5" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-6">
                <div className="flex items-center gap-3">
                  <Switch id="auto-version" defaultChecked />
                  <Label htmlFor="auto-version">Auto-increment version on edit</Label>
                </div>
              </div>

              <Button className="gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-6">Notification Preferences</h3>
            <div className="space-y-4">
              {[
                { id: 'sync-complete', label: 'Azure sync completed', enabled: true },
                { id: 'new-bugs', label: 'New bugs detected', enabled: true },
                { id: 'test-fail', label: 'Test case status changes', enabled: true },
                { id: 'agent-error', label: 'Agent errors', enabled: true },
                { id: 'weekly-report', label: 'Weekly summary report', enabled: false },
              ].map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <Label htmlFor={item.id}>{item.label}</Label>
                  <Switch id={item.id} defaultChecked={item.enabled} />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-6">Security & Access</h3>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-foreground mb-4">Team Members</h4>
                <div className="space-y-2">
                  {[
                    { name: 'John Doe', email: 'john@acme.com', role: 'Admin' },
                    { name: 'Jane Smith', email: 'jane@acme.com', role: 'QA Engineer' },
                    { name: 'Bob Wilson', email: 'bob@acme.com', role: 'Viewer' },
                  ].map((member) => (
                    <div
                      key={member.email}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div>
                        <p className="font-medium text-foreground">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                      <Badge
                        variant={member.role === 'Admin' ? 'default' : 'secondary'}
                      >
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="mt-4">
                  Invite Team Member
                </Button>
              </div>

              <div className="border-t border-border pt-6">
                <h4 className="font-medium text-foreground mb-4">API Keys</h4>
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Production API Key</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        qa_prod_•••••••••••••••••
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Regenerate
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-6">Data Management</h3>
            <div className="space-y-6">
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Export All Data</p>
                    <p className="text-sm text-muted-foreground">
                      Download all test cases, bugs, and project data
                    </p>
                  </div>
                  <Button variant="outline">Export</Button>
                </div>
              </div>

              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Database Size</p>
                    <p className="text-sm text-muted-foreground">
                      1,247 test cases • 46 bugs • 4 projects
                    </p>
                  </div>
                  <Badge variant="secondary">2.4 MB</Badge>
                </div>
              </div>

              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-destructive">Delete All Data</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently remove all data from this workspace
                    </p>
                  </div>
                  <Button variant="destructive">Delete</Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
