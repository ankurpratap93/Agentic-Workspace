-- Create storage bucket for test screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'test-screenshots',
  'test-screenshots',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
);

-- Create test_recordings table
CREATE TABLE IF NOT EXISTS public.test_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_run_id UUID NOT NULL REFERENCES public.test_runs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  total_steps INTEGER DEFAULT 0,
  duration INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'recording',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create test_recording_steps table
CREATE TABLE IF NOT EXISTS public.test_recording_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recording_id UUID NOT NULL REFERENCES public.test_recordings(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  test_case_id UUID REFERENCES public.test_cases(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  screenshot_url TEXT,
  element_selector TEXT,
  input_data JSONB,
  expected_result TEXT,
  actual_result TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  execution_time INTEGER
);

-- Enable RLS
ALTER TABLE public.test_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_recording_steps ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for test_recordings
CREATE POLICY "Allow public read access to test_recordings"
  ON public.test_recordings FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to test_recordings"
  ON public.test_recordings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to test_recordings"
  ON public.test_recordings FOR UPDATE
  USING (true);

-- Create RLS policies for test_recording_steps
CREATE POLICY "Allow public read access to test_recording_steps"
  ON public.test_recording_steps FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to test_recording_steps"
  ON public.test_recording_steps FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to test_recording_steps"
  ON public.test_recording_steps FOR UPDATE
  USING (true);

-- Create storage policies for test-screenshots bucket
CREATE POLICY "Public read access to test screenshots"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'test-screenshots');

CREATE POLICY "Public insert access to test screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'test-screenshots');

CREATE POLICY "Public update access to test screenshots"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'test-screenshots');

-- Create indexes for performance
CREATE INDEX idx_test_recordings_test_run_id ON public.test_recordings(test_run_id);
CREATE INDEX idx_test_recording_steps_recording_id ON public.test_recording_steps(recording_id);
CREATE INDEX idx_test_recording_steps_step_number ON public.test_recording_steps(recording_id, step_number);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.test_recordings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.test_recording_steps;