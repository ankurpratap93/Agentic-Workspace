-- Add headless column to test_runs table
ALTER TABLE public.test_runs ADD COLUMN IF NOT EXISTS headless boolean DEFAULT true;