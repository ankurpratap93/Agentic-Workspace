-- Add severity column to test_cases table for better categorization
ALTER TABLE public.test_cases 
ADD COLUMN IF NOT EXISTS severity text DEFAULT 'medium';

-- Add comment to describe the column
COMMENT ON COLUMN public.test_cases.severity IS 'Test case severity level: critical, high, medium, low';

-- Create index for faster filtering by severity
CREATE INDEX IF NOT EXISTS idx_test_cases_severity ON public.test_cases(severity);

-- Add test_data and expected_result columns for more detailed test information
ALTER TABLE public.test_cases 
ADD COLUMN IF NOT EXISTS test_data text,
ADD COLUMN IF NOT EXISTS expected_result text;

COMMENT ON COLUMN public.test_cases.test_data IS 'Sample data or test conditions used';
COMMENT ON COLUMN public.test_cases.expected_result IS 'Expected outcome of the test';

-- Update existing records to have default severity
UPDATE public.test_cases 
SET severity = 'medium' 
WHERE severity IS NULL;