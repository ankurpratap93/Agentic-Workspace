-- Add optional browser and depth columns to test_runs for better reporting
ALTER TABLE public.test_runs
  ADD COLUMN IF NOT EXISTS browser text,
  ADD COLUMN IF NOT EXISTS depth text;

-- Optional index to filter recent runs by browser/depth
CREATE INDEX IF NOT EXISTS idx_test_runs_browser ON public.test_runs (browser);
CREATE INDEX IF NOT EXISTS idx_test_runs_depth ON public.test_runs (depth);
