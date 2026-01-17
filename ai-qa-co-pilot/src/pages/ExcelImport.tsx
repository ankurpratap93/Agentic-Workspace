import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  FileSpreadsheet,
  Check,
  AlertCircle,
  Download,
  ArrowRight,
  X,
} from 'lucide-react';

export default function ExcelImport() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.csv'))) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setIsProcessing(true);
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsProcessing(false);
      }
    }, 200);
  };

  const clearFile = () => {
    setUploadedFile(null);
    setUploadProgress(0);
    setIsProcessing(false);
  };

  return (
    <AppLayout title="Excel Import" subtitle="Upload and process test case spreadsheets">
      <div className="space-y-6">
        {/* Upload Area */}
        <Card
          className={`relative border-2 border-dashed p-12 transition-all ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/30'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!uploadedFile ? (
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                Drop your Excel file here
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                or click to browse. Supports .xlsx and .csv formats
              </p>
              <Button className="mt-4" variant="outline">
                Browse Files
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                    <FileSpreadsheet className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(uploadedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={clearFile}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Processing...</span>
                    <span className="text-foreground">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
              {!isProcessing && uploadProgress === 100 && (
                <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3">
                  <Check className="h-5 w-5 text-success" />
                  <span className="text-sm font-medium text-success">
                    File processed successfully
                  </span>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Processing Steps */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { step: 1, title: 'Upload', description: 'Drop or select file', status: uploadedFile ? 'complete' : 'current' },
            { step: 2, title: 'Validate', description: 'Check file structure', status: uploadProgress === 100 ? 'complete' : uploadProgress > 0 ? 'current' : 'pending' },
            { step: 3, title: 'Map Columns', description: 'Match to schema', status: 'pending' },
            { step: 4, title: 'Import', description: 'Create test cases', status: 'pending' },
          ].map((item, idx) => (
            <div key={item.step} className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  item.status === 'complete'
                    ? 'border-success bg-success text-success-foreground'
                    : item.status === 'current'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-muted text-muted-foreground'
                }`}
              >
                {item.status === 'complete' ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-semibold">{item.step}</span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              {idx < 3 && <ArrowRight className="h-4 w-4 text-muted-foreground hidden md:block" />}
            </div>
          ))}
        </div>

        {/* Template Download */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Need a template?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Download our standard test case Excel template with all required columns
              </p>
            </div>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>
        </Card>

        {/* Column Mapping Preview */}
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Expected Column Mapping</h3>
          <div className="grid gap-3 md:grid-cols-4">
            {[
              { field: 'Test Case ID', required: true },
              { field: 'Title', required: true },
              { field: 'Preconditions', required: false },
              { field: 'Steps', required: true },
              { field: 'Expected Result', required: true },
              { field: 'Priority', required: true },
              { field: 'Severity', required: false },
              { field: 'Test Type', required: false },
            ].map((col) => (
              <div
                key={col.field}
                className="flex items-center gap-2 rounded-lg border border-border p-3"
              >
                <span className="text-sm text-foreground">{col.field}</span>
                {col.required && (
                  <Badge variant="destructive" className="text-xs ml-auto">
                    Required
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
