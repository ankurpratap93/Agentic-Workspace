-- Create storage bucket for test videos and audio
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('test-videos', 'test-videos', true, 524288000, ARRAY['video/mp4', 'video/webm']),
  ('test-audio', 'test-audio', true, 52428800, ARRAY['audio/mpeg', 'audio/wav', 'audio/webm']);

-- Storage policies for test videos
CREATE POLICY "Public Access to test videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'test-videos');

CREATE POLICY "Public Insert to test videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'test-videos');

-- Storage policies for test audio
CREATE POLICY "Public Access to test audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'test-audio');

CREATE POLICY "Public Insert to test audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'test-audio');

-- Add video_url and narration_url columns to test_recordings
ALTER TABLE public.test_recordings
ADD COLUMN IF NOT EXISTS video_url text,
ADD COLUMN IF NOT EXISTS narration_enabled boolean DEFAULT true;

-- Add narration_url to test_recording_steps
ALTER TABLE public.test_recording_steps
ADD COLUMN IF NOT EXISTS narration_url text;