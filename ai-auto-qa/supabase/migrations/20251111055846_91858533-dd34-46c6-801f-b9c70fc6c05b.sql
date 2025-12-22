-- Enable realtime for test_runs and test_cases tables for live progress updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.test_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.test_cases;