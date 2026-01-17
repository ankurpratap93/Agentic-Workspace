import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { z } from 'zod';
import type { Json } from '@/integrations/supabase/types';

// Validation schema for generate test cases
const generateTestCasesSchema = z.object({
  sourceType: z.enum(['url', 'figma', 'description']),
  sourceUrl: z.string().url('Invalid URL format').max(2000, 'URL too long').optional(),
  projectName: z.string().min(1, 'Project name is required').max(200, 'Project name too long').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description too long').optional(),
}).refine(
  (data) => {
    if (data.sourceType === 'url' || data.sourceType === 'figma') {
      return !!data.sourceUrl;
    }
    return !!data.description;
  },
  { message: 'Source URL or description is required based on source type' }
);

export interface TestCaseStep {
  step: number;
  action: string;
  expected: string;
}

export interface TestCase {
  id: string;
  project_id: string;
  test_case_id: string;
  title: string;
  description: string | null;
  preconditions: string | null;
  steps: TestCaseStep[];
  expected_result: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'approved' | 'deprecated' | 'in_review';
  test_type: 'functional' | 'regression' | 'integration' | 'performance' | 'security' | 'usability';
  source: 'manual' | 'figma' | 'web_crawler' | 'excel' | 'ai_generated';
  automation_feasibility: boolean;
  tags: string[] | null;
  version: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

type TestCaseRow = Omit<TestCase, 'steps' | 'priority' | 'status' | 'test_type' | 'source'> & {
  steps: Json;
  priority: string | null;
  status: string | null;
  test_type: string | null;
  source: string | null;
};

function mapRowToTestCase(row: TestCaseRow): TestCase {
  return {
    ...row,
    steps: Array.isArray(row.steps) ? (row.steps as unknown as TestCaseStep[]) : [],
    priority: (row.priority as TestCase['priority']) || 'medium',
    status: (row.status as TestCase['status']) || 'draft',
    test_type: (row.test_type as TestCase['test_type']) || 'functional',
    source: (row.source as TestCase['source']) || 'manual',
  };
}

export function useTestCases(projectId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['test-cases', projectId],
    queryFn: async () => {
      let query = supabase
        .from('test_cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as TestCaseRow[]).map(mapRowToTestCase);
    },
    enabled: !!user,
  });
}

export function useCreateTestCase() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (testCase: Omit<TestCase, 'id' | 'created_at' | 'updated_at' | 'version' | 'created_by' | 'updated_by'>) => {
      const { data, error } = await supabase
        .from('test_cases')
        .insert({
          ...testCase,
          steps: testCase.steps as unknown as Json,
          created_by: user?.id,
          updated_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return mapRowToTestCase(data as TestCaseRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-cases'] });
      toast.success('Test case created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create test case: ${error.message}`);
    },
  });
}

export function useCreateTestCasesBatch() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (testCases: Omit<TestCase, 'id' | 'created_at' | 'updated_at' | 'version' | 'created_by' | 'updated_by'>[]) => {
      const { data, error } = await supabase
        .from('test_cases')
        .insert(
          testCases.map(tc => ({
            ...tc,
            steps: tc.steps as unknown as Json,
            created_by: user?.id,
            updated_by: user?.id,
          }))
        )
        .select();

      if (error) throw error;
      return (data as TestCaseRow[]).map(mapRowToTestCase);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['test-cases'] });
      toast.success(`${data.length} test cases created successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create test cases: ${error.message}`);
    },
  });
}

export function useUpdateTestCase() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TestCase> & { id: string }) => {
      // Save version history first
      const { data: current } = await supabase
        .from('test_cases')
        .select('*')
        .eq('id', id)
        .single();

      if (current) {
        await supabase
          .from('test_case_versions')
          .insert({
            test_case_id: id,
            version: current.version,
            data: current as unknown as Json,
            changed_by: user?.id,
          });
      }

      const { data, error } = await supabase
        .from('test_cases')
        .update({
          ...updates,
          steps: updates.steps as unknown as Json,
          updated_by: user?.id,
          version: (current?.version || 0) + 1,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapRowToTestCase(data as TestCaseRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-cases'] });
      toast.success('Test case updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update test case: ${error.message}`);
    },
  });
}

export function useGenerateTestCases() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { sourceType: 'url' | 'figma' | 'description'; sourceUrl?: string; projectName?: string; description?: string }) => {
      // Validate input before sending to edge function
      const validationResult = generateTestCasesSchema.safeParse(params);
      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0]?.message || 'Invalid input';
        throw new Error(errorMessage);
      }
      
      const validated = validationResult.data;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-test-cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(validated),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate test cases');
      }

      return response.json();
    },
    onError: (error: Error) => {
      if (error.message.includes('Rate limit')) {
        toast.error('Rate limit exceeded. Please try again in a moment.');
      } else if (error.message.includes('usage limit')) {
        toast.error('AI usage limit reached. Please add credits to continue.');
      } else {
        toast.error(`Failed to generate test cases: ${error.message}`);
      }
    },
  });
}