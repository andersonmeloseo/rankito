import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useGBPProfilePosts = (profileId: string) => {
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['gbp-profile-posts', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gbp_posts')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profileId,
  });

  const createPost = useMutation({
    mutationFn: async (postData: any) => {
      const { data: profile } = await supabase
        .from('google_business_profiles')
        .select('site_id')
        .eq('id', profileId)
        .single();

      const { error } = await supabase
        .from('gbp_posts')
        .insert({
          profile_id: profileId,
          site_id: profile?.site_id,
          ...postData,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Post criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['gbp-profile-posts', profileId] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar post: ${error.message}`);
    },
  });

  const updatePost = useMutation({
    mutationFn: async ({ postId, data }: { postId: string; data: any }) => {
      const { error } = await supabase
        .from('gbp_posts')
        .update(data)
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Post atualizado!');
      queryClient.invalidateQueries({ queryKey: ['gbp-profile-posts', profileId] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar post: ${error.message}`);
    },
  });

  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('gbp_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Post deletado!');
      queryClient.invalidateQueries({ queryKey: ['gbp-profile-posts', profileId] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao deletar post: ${error.message}`);
    },
  });

  return {
    posts,
    isLoading,
    createPost: createPost.mutate,
    isCreating: createPost.isPending,
    updatePost: updatePost.mutate,
    isUpdating: updatePost.isPending,
    deletePost: deletePost.mutate,
    isDeleting: deletePost.isPending,
  };
};
