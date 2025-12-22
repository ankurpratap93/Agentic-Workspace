import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// Local agentic backend: call /api when available (proxied to localhost:3001)
async function startLocalTest(payload: any) {
  const res = await fetch("/api/start-test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Start test failed (${res.status})`);
  }
  return res.json();
}
import { useNavigate } from "react-router-dom";

interface TestingPortalProps {
  onTestStarted?: (testRunId: string) => void;
}

export const TestingPortal = ({ onTestStarted }: TestingPortalProps) => {
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [framework, setFramework] = useState("playwright");
  const [browser, setBrowser] = useState("chromium");
  const [depth, setDepth] = useState("standard");
  const [testType, setTestType] = useState("functional");
  const [headless, setHeadless] = useState(true);
  const [aiModel, setAiModel] = useState("google/gemini-2.5-flash");
  const [isRunning, setIsRunning] = useState(false);
  const [expectedRecordCount, setExpectedRecordCount] = useState("");
  const [dataValidationRules, setDataValidationRules] = useState("");
  const { toast } = useToast();

  const handleStartTest = async () => {
    if (!url) {
      toast({
        title: "URL Required",
        description: "Please enter a website URL to test",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    
    try {
      const data = await startLocalTest({
        url, username, password, otp: otp || null, framework, browser, depth, testType, headless, aiModel,
        expectedRecordCount: expectedRecordCount ? parseInt(expectedRecordCount) : null,
        dataValidationRules: dataValidationRules || null
      });

      toast({
        title: "Tests Started",
        description: "AI agent is analyzing and testing your website",
      });

      // Notify parent component
      if (onTestStarted) onTestStarted(data.testRunId);
    } catch (error: any) {
      console.error('Test execution error:', error);
      toast({
        title: "Test Failed",
        description: error.message || "Failed to start tests. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <section id="testing-portal" className="py-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Start Testing</h2>
          <p className="text-xl text-muted-foreground">
            Enter your website details and let AI handle the rest
          </p>
        </div>

        <Card className="p-8 bg-card/80 backdrop-blur-sm border-border shadow-glow">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="url" className="text-base">Website URL *</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-12 text-lg"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username (Optional)</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter login username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password (Optional)</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter login password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">OTP / 2FA Code (Optional)</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter OTP or leave blank"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground">
                  For apps with multi-factor authentication
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="framework">Testing Framework</Label>
                <Select value={framework} onValueChange={setFramework}>
                  <SelectTrigger id="framework" className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="playwright">Playwright</SelectItem>
                    <SelectItem value="selenium">Selenium</SelectItem>
                    <SelectItem value="cypress">Cypress</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="browser">Browser</Label>
                <Select value={browser} onValueChange={setBrowser}>
                  <SelectTrigger id="browser" className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chromium">Chromium</SelectItem>
                    <SelectItem value="firefox">Firefox</SelectItem>
                    <SelectItem value="webkit">WebKit (Safari)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="depth">Test Coverage Depth</Label>
                <Select value={depth} onValueChange={setDepth}>
                  <SelectTrigger id="depth" className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quick">Quick (30-50 test cases)</SelectItem>
                    <SelectItem value="standard">Standard (80-120 test cases)</SelectItem>
                    <SelectItem value="exhaustive">Exhaustive (150-250+ test cases)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="testType">Test Type</Label>
                <Select value={testType} onValueChange={setTestType}>
                  <SelectTrigger id="testType" className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="functional">Functional Testing</SelectItem>
                    <SelectItem value="load">Load Testing</SelectItem>
                    <SelectItem value="api">API Testing</SelectItem>
                    <SelectItem value="data-integrity">Data Integrity Testing 📊</SelectItem>
                    <SelectItem value="data-sync">Data Sync & Consistency 🔄</SelectItem>
                    <SelectItem value="bulk-validation">Bulk Data Validation 📦</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {testType === 'data-integrity' && 'Detect missing chunks, orphaned records, data corruption'}
                  {testType === 'data-sync' && 'Validate data consistency across views, reports, dashboards'}
                  {testType === 'bulk-validation' && 'Test large datasets, pagination, export/import flows'}
                </p>
              </div>
            </div>

            {/* Data-Intensive Testing Options */}
            {['data-integrity', 'data-sync', 'bulk-validation'].includes(testType) && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Data-Intensive Testing Configuration
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expectedRecordCount">Expected Record Count (Optional)</Label>
                    <Input
                      id="expectedRecordCount"
                      type="number"
                      placeholder="e.g., 21000 dealers"
                      value={expectedRecordCount}
                      onChange={(e) => setExpectedRecordCount(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Total records expected in the system for validation
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataValidationRules">Validation Rules (Optional)</Label>
                    <Input
                      id="dataValidationRules"
                      type="text"
                      placeholder="e.g., dealership_id unique, status required"
                      value={dataValidationRules}
                      onChange={(e) => setDataValidationRules(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated validation rules
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="headless">Browser Mode</Label>
                <Select value={headless ? "headless" : "headed"} onValueChange={(v) => setHeadless(v === "headless")}>
                  <SelectTrigger id="headless" className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="headless">Headless (Background)</SelectItem>
                    <SelectItem value="headed">Headed (Visible Browser) 🔍</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {headless ? 'Tests run in background' : 'Browser window visible during testing'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aiModel">AI Model</Label>
                <Select value={aiModel} onValueChange={setAiModel}>
                  <SelectTrigger id="aiModel" className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google/gemini-2.5-pro">Gemini Pro (Best Quality) ⭐</SelectItem>
                    <SelectItem value="google/gemini-2.5-flash">Gemini Flash (Balanced) ⚡</SelectItem>
                    <SelectItem value="google/gemini-2.5-flash-lite">Gemini Lite (Fast) 🚀</SelectItem>
                    <SelectItem value="openai/gpt-5">GPT-5 (Premium) 💎</SelectItem>
                    <SelectItem value="openai/gpt-5-mini">GPT-5 Mini (Efficient) 💡</SelectItem>
                    <SelectItem value="openai/gpt-5-nano">GPT-5 Nano (Quick) ⚙️</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose AI model for test case generation
                </p>
              </div>
            </div>

            <Button 
              variant="hero" 
              size="lg" 
              className="w-full h-14 text-lg"
              onClick={handleStartTest}
              disabled={isRunning}
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 animate-spin" />
                  Initializing AI Agent...
                </>
              ) : (
                <>
                  <Play className="mr-2" />
                  Start Automated Testing
                </>
              )}
            </Button>

            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t border-border">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span>AI agent will crawl all pages and generate test cases automatically</span>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};
