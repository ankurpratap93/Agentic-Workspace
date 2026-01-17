import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { z } from 'zod';

// Validation schema for bug sync to Azure
const bugSyncSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(5000, 'Description too long').nullable(),
  steps_to_reproduce: z.string().max(5000, 'Steps too long').nullable(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
});

export interface Bug {
  id: string;
  project_id: string;
  bug_id: string;
  title: string;
  description: string | null;
  steps_to_reproduce: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'active' | 'resolved' | 'closed';
  assigned_to: string | null;
  azure_work_item_id: number | null;
  sync_status: 'synced' | 'pending' | 'failed' | 'not_synced';
  last_synced_at: string | null;
  linked_test_case_ids: string[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

type BugRow = Omit<Bug, 'priority' | 'severity' | 'status' | 'sync_status'> & {
  priority: string | null;
  severity: string | null;
  status: string | null;
  sync_status: string | null;
};

function mapRowToBug(row: BugRow): Bug {
  return {
    ...row,
    priority: (row.priority as Bug['priority']) || 'medium',
    severity: (row.severity as Bug['severity']) || 'medium',
    status: (row.status as Bug['status']) || 'new',
    sync_status: (row.sync_status as Bug['sync_status']) || 'not_synced',
  };
}

export function useBugs(projectId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bugs', projectId],
    queryFn: async () => {
      let query = supabase
        .from('bugs')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as BugRow[]).map(mapRowToBug);
    },
    enabled: !!user,
  });
}

export function useCreateBug() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (bug: Omit<Bug, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'azure_work_item_id' | 'sync_status' | 'last_synced_at'>) => {
      const { data, error } = await supabase
        .from('bugs')
        .insert({
          ...bug,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return mapRowToBug(data as BugRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugs'] });
      toast.success('Bug created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create bug: ${error.message}`);
    },
  });
}

export function useUpdateBug() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Bug> & { id: string }) => {
      const { data, error } = await supabase
        .from('bugs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapRowToBug(data as BugRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugs'] });
      toast.success('Bug updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update bug: ${error.message}`);
    },
  });
}

export function useSyncBugToAzure() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (bug: Bug) => {
      // Validate bug data before sending to edge function
      const validationResult = bugSyncSchema.safeParse({
        title: bug.title,
        description: bug.description,
        steps_to_reproduce: bug.steps_to_reproduce,
        priority: bug.priority,
        severity: bug.severity,
      });
      
      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0]?.message || 'Invalid bug data';
        throw new Error(errorMessage);
      }

      const validated = validationResult.data;

      // Create in Azure with validated data
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/azure-devops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'create-bug',
          title: validated.title,
          description: validated.description,
          stepsToReproduce: validated.steps_to_reproduce,
          priority: validated.priority === 'critical' ? 1 : validated.priority === 'high' ? 2 : validated.priority === 'medium' ? 3 : 4,
          severity: `${validated.severity === 'critical' ? 1 : validated.severity === 'high' ? 2 : validated.severity === 'medium' ? 3 : 4} - ${validated.severity.charAt(0).toUpperCase() + validated.severity.slice(1)}`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to sync bug to Azure DevOps');
      }

      const result = await response.json();

      // Update local bug with Azure work item ID
      const { error } = await supabase
        .from('bugs')
        .update({
          azure_work_item_id: result.azureWorkItemId,
          sync_status: 'synced',
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', bug.id);

      if (error) throw error;

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugs'] });
      toast.success('Bug synced to Azure DevOps');
    },
    onError: (error: Error) => {
      toast.error(`Failed to sync bug: ${error.message}`);
    },
  });
}

export function usePullBugsFromAzure() {
  const queryClient = useQueryClient();
  const { session, user } = useAuth();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/azure-devops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ action: 'get-bugs' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch bugs from Azure DevOps');
      }

      const { bugs } = await response.json();

      // Insert or update bugs in database
      for (const azureBug of bugs) {
        const bugId = `BUG-${azureBug.azureId}`;
        
        await supabase
          .from('bugs')
          .upsert({
            project_id: projectId,
            bug_id: bugId,
            title: azureBug.title,
            description: azureBug.description,
            steps_to_reproduce: azureBug.stepsToReproduce,
            priority: azureBug.priority <= 1 ? 'critical' : azureBug.priority <= 2 ? 'high' : azureBug.priority <= 3 ? 'medium' : 'low',
            status: azureBug.state.toLowerCase().includes('closed') ? 'closed' : azureBug.state.toLowerCase().includes('resolved') ? 'resolved' : 'active',
            assigned_to: azureBug.assignedTo,
            azure_work_item_id: azureBug.azureId,
            sync_status: 'synced',
            last_synced_at: new Date().toISOString(),
            created_by: user?.id,
          }, { onConflict: 'bug_id,project_id' });
      }

      return bugs.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['bugs'] });
      toast.success(`Pulled ${count} bugs from Azure DevOps`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to pull bugs: ${error.message}`);
    },
  });
}