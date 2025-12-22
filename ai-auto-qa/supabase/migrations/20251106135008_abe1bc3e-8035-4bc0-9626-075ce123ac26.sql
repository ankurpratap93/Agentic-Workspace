-- Create test_runs table
CREATE TABLE public.test_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  username TEXT,
  framework TEXT NOT NULL DEFAULT 'playwright',
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_pages INTEGER DEFAULT 0,
  total_tests INTEGER DEFAULT 0,
  passed_tests INTEGER DEFAULT 0,
  failed_tests INTEGER DEFAULT 0,
  execution_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create discovered_pages table
CREATE TABLE public.discovered_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_run_id UUID NOT NULL REFERENCES public.test_runs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  page_type TEXT,
  forms_count INTEGER DEFAULT 0,
  links_count INTEGER DEFAULT 0,
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create test_cases table
CREATE TABLE public.test_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_run_id UUID NOT NULL REFERENCES public.test_runs(id) ON DELETE CASCADE,
  page_id UUID REFERENCES public.discovered_pages(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL,
  test_name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  execution_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create test_insights table for AI-generated recommendations
CREATE TABLE public.test_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_run_id UUID NOT NULL REFERENCES public.test_runs(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  affected_pages TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovered_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_insights ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for MVP)
CREATE POLICY "Allow public read access to test_runs" 
ON public.test_runs FOR SELECT USING (true);

CREATE POLICY "Allow public insert to test_runs" 
ON public.test_runs FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to test_runs" 
ON public.test_runs FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to discovered_pages" 
ON public.discovered_pages FOR SELECT USING (true);

CREATE POLICY "Allow public insert to discovered_pages" 
ON public.discovered_pages FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to test_cases" 
ON public.test_cases FOR SELECT USING (true);

CREATE POLICY "Allow public insert to test_cases" 
ON public.test_cases FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to test_cases" 
ON public.test_cases FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to test_insights" 
ON public.test_insights FOR SELECT USING (true);

CREATE POLICY "Allow public insert to test_insights" 
ON public.test_insights FOR INSERT WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX idx_test_runs_status ON public.test_runs(status);
CREATE INDEX idx_test_runs_created_at ON public.test_runs(created_at DESC);
CREATE INDEX idx_discovered_pages_test_run ON public.discovered_pages(test_run_id);
CREATE INDEX idx_test_cases_test_run ON public.test_cases(test_run_id);
CREATE INDEX idx_test_cases_status ON public.test_cases(status);
CREATE INDEX idx_test_insights_test_run ON public.test_insights(test_run_id);