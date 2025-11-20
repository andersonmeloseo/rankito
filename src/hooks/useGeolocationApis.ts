import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GeolocationApi {
  id: string;
  provider_name: 'ipgeolocation' | 'ipapi' | 'ipstack' | 'ipinfo';
  api_key: string;
  display_name: string;
  is_active: boolean;
  priority: number;
  monthly_limit: number | null;
  usage_count: number;
  last_used_at: string | null;
  last_rotation_at: string | null;
  error_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export const useGeolocationApis = () => {
  const queryClient = useQueryClient();
  
  const { data: apis, isLoading } = useQuery({
    queryKey: ['geolocation-apis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('geolocation_api_configs')
        .select('*')
        .order('priority', { ascending: true });
      
      if (error) throw error;
      return data as GeolocationApi[];
    }
  });
  
  const createApi = useMutation({
    mutationFn: async (input: Omit<GeolocationApi, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'usage_count' | 'last_used_at' | 'last_rotation_at' | 'error_count' | 'last_error'>) => {
      const { data, error } = await supabase
        .from('geolocation_api_configs')
        .insert([input])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geolocation-apis'] });
      toast.success('API adicionada com sucesso');
    },
    onError: (error: any) => {
      toast.error(`Erro ao adicionar API: ${error.message}`);
    }
  });
  
  const updateApi = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<GeolocationApi> }) => {
      const { error } = await supabase
        .from('geolocation_api_configs')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geolocation-apis'] });
      toast.success('API atualizada com sucesso');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar API: ${error.message}`);
    }
  });
  
  const deleteApi = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('geolocation_api_configs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geolocation-apis'] });
      toast.success('API deletada com sucesso');
    },
    onError: (error: any) => {
      toast.error(`Erro ao deletar API: ${error.message}`);
    }
  });
  
  const testApi = useMutation({
    mutationFn: async ({ provider, apiKey }: { provider: string; apiKey: string }) => {
      const { data, error } = await supabase.functions.invoke('geolocation-test-api', {
        body: { provider, apiKey }
      });
      
      if (error) throw error;
      return data;
    }
  });
  
  const bulkUpdate = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Partial<GeolocationApi> }) => {
      const promises = ids.map(id =>
        supabase
          .from('geolocation_api_configs')
          .update(updates)
          .eq('id', id)
      );
      
      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geolocation-apis'] });
      toast.success('APIs atualizadas com sucesso');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar APIs: ${error.message}`);
    }
  });
  
  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('geolocation_api_configs')
        .delete()
        .in('id', ids);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geolocation-apis'] });
      toast.success('APIs deletadas com sucesso');
    },
    onError: (error: any) => {
      toast.error(`Erro ao deletar APIs: ${error.message}`);
    }
  });
  
  return {
    apis: apis || [],
    isLoading,
    createApi: createApi.mutate,
    updateApi: updateApi.mutate,
    deleteApi: deleteApi.mutate,
    testApi: testApi,
    bulkUpdate: bulkUpdate.mutate,
    bulkDelete: bulkDelete.mutate,
  };
};
