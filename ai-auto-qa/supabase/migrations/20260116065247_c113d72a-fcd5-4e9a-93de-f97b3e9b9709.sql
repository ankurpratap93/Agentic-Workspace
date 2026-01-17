-- Create enum types
CREATE TYPE public.test_case_status AS ENUM ('draft', 'approved', 'deprecated', 'in_review');
CREATE TYPE public.test_case_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.test_case_type AS ENUM ('functional', 'regression', 'integration', 'performance', 'security', 'usability');
CREATE TYPE public.test_case_source AS ENUM ('manual', 'figma', 'web_crawler', 'excel', 'ai_generated');
CREATE TYPE public.bug_status AS ENUM ('new', 'active', 'resolved', 'closed');
CREATE TYPE public.bug_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.sync_status AS ENUM ('synced', 'pending', 'failed', 'not_synced');
CREATE TYPE public.app_role AS ENUM ('admin', 'qa_engineer', 'viewer');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    organization TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'qa_engineer',
    UNIQUE (user_id, role)
);

-- Create projects table
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    modules_count INTEGER DEFAULT 0,
    test_cases_count INTEGER DEFAULT 0,
    bugs_count INTEGER DEFAULT 0,
    figma_url TEXT,
    web_url TEXT,
    azure_project_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create test_cases table
CREATE TABLE public.test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    test_case_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    preconditions TEXT,
    steps JSONB DEFAULT '[]'::jsonb,
    expected_result TEXT,
    priority test_case_priority DEFAULT 'medium',
    status test_case_status DEFAULT 'draft',
    test_type test_case_type DEFAULT 'functional',
    source test_case_source DEFAULT 'manual',
    automation_feasibility BOOLEAN DEFAULT false,
    tags TEXT[],
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create test_case_versions table for version history
CREATE TABLE public.test_case_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_case_id UUID REFERENCES public.test_cases(id) ON DELETE CASCADE NOT NULL,
    version INTEGER NOT NULL,
    data JSONB NOT NULL,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bugs table
CREATE TABLE public.bugs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    bug_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    steps_to_reproduce TEXT,
    priority test_case_priority DEFAULT 'medium',
    severity bug_severity DEFAULT 'medium',
    status bug_status DEFAULT 'new',
    assigned_to TEXT,
    azure_work_item_id INTEGER,
    sync_status sync_status DEFAULT 'not_synced',
    last_synced_at TIMESTAMP WITH TIME ZONE,
    linked_test_case_ids UUID[],
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create azure_connections table
CREATE TABLE public.azure_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    organization_url TEXT NOT NULL,
    project_name TEXT NOT NULL,
    pat_token_encrypted TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_generation_jobs table
CREATE TABLE public.ai_generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    job_type TEXT NOT NULL,
    source_url TEXT,
    status TEXT DEFAULT 'pending',
    result JSONB,
    error_message TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_case_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.azure_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for projects (authenticated users can access)
CREATE POLICY "Authenticated users can view projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Project creators and admins can update" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Project creators and admins can delete" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for test_cases
CREATE POLICY "Authenticated users can view test cases" ON public.test_cases FOR SELECT TO authenticated USING (true);
CREATE POLICY "QA engineers can create test cases" ON public.test_cases FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "QA engineers can update test cases" ON public.test_cases FOR UPDATE TO authenticated USING (auth.uid() = created_by OR auth.uid() = updated_by OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete test cases" ON public.test_cases FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = created_by);

-- RLS Policies for test_case_versions
CREATE POLICY "Authenticated users can view versions" ON public.test_case_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can create versions" ON public.test_case_versions FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies for bugs
CREATE POLICY "Authenticated users can view bugs" ON public.bugs FOR SELECT TO authenticated USING (true);
CREATE POLICY "QA engineers can create bugs" ON public.bugs FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "QA engineers can update bugs" ON public.bugs FOR UPDATE TO authenticated USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete bugs" ON public.bugs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = created_by);

-- RLS Policies for azure_connections
CREATE POLICY "Users can view own connections" ON public.azure_connections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own connections" ON public.azure_connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own connections" ON public.azure_connections FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own connections" ON public.azure_connections FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for ai_generation_jobs
CREATE POLICY "Users can view own jobs" ON public.ai_generation_jobs FOR SELECT TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Users can create jobs" ON public.ai_generation_jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_test_cases_updated_at BEFORE UPDATE ON public.test_cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bugs_updated_at BEFORE UPDATE ON public.bugs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_azure_connections_updated_at BEFORE UPDATE ON public.azure_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'qa_engineer');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update project counts
CREATE OR REPLACE FUNCTION public.update_project_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'test_cases' THEN
        UPDATE public.projects SET test_cases_count = (
            SELECT COUNT(*) FROM public.test_cases WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
        ) WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    ELSIF TG_TABLE_NAME = 'bugs' THEN
        UPDATE public.projects SET bugs_count = (
            SELECT COUNT(*) FROM public.bugs WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
        ) WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers for count updates
CREATE TRIGGER update_test_cases_count AFTER INSERT OR DELETE ON public.test_cases FOR EACH ROW EXECUTE FUNCTION public.update_project_counts();
CREATE TRIGGER update_bugs_count AFTER INSERT OR DELETE ON public.bugs FOR EACH ROW EXECUTE FUNCTION public.update_project_counts();