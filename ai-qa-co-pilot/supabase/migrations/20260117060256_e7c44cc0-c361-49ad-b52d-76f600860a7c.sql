-- Fix function search path issues
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix test_case_versions INSERT policy to be more restrictive
DROP POLICY IF EXISTS "System can create versions" ON public.test_case_versions;
CREATE POLICY "Users can create versions for their test cases" ON public.test_case_versions 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = changed_by);