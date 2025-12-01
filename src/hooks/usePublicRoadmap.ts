import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublicRoadmapItem {
  id: string;
  title: string;
  description: string | null;
  category: 'new_feature' | 'improvement' | 'bugfix' | 'security';
  status: 'planned' | 'in_progress' | 'testing' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimated_end_date: string | null;
  progress_percentage: number;
  release_version: string | null;
}

export const usePublicRoadmap = () => {
  const { data: items, isLoading } = useQuery({
    queryKey: ['public-roadmap'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_backlog')
        .select('id, title, description, category, status, priority, estimated_end_date, progress_percentage, release_version')
        .eq('is_public', true)
        .order('priority', { ascending: false })
        .order('estimated_end_date', { ascending: true });

      if (error) throw error;
      return data as PublicRoadmapItem[];
    },
  });

  return {
    items: items || [],
    isLoading,
  };
};
