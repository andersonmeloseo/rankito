import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreatePostInput {
  profileId: string;
  postType: string;
  title?: string;
  content: string;
  ctaType?: string;
  ctaUrl?: string;
  mediaUrls?: string[];
  scheduledFor?: string;
}

export const useGBPPosts = (siteId: string, statusFilter?: string) => {
  const queryClient = useQueryClient();

  // Fetch posts
  const { data: posts, isLoading } = useQuery({
    queryKey: ['gbp-posts', siteId, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('gbp_posts')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!siteId,
  });

  // Create post
  const createPost = useMutation({
    mutationFn: async (input: CreatePostInput) => {
      const { error } = await supabase
        .from('gbp_posts')
        .insert({
          profile_id: input.profileId,
          site_id: siteId,
          post_type: input.postType,
          title: input.title,
          content: input.content,
          cta_type: input.ctaType,
          cta_url: input.ctaUrl,
          media_urls: input.mediaUrls,
          scheduled_for: input.scheduledFor,
          status: input.scheduledFor ? 'scheduled' : 'draft',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Post criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['gbp-posts'] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar post: ${error.message}`);
    },
  });

  // Delete post
  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('gbp_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Post excluído com sucesso');
      queryClient.invalidateQueries({ queryKey: ['gbp-posts'] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir post: ${error.message}`);
    },
  });

  return {
    posts,
    isLoading,
    isCreating: createPost.isPending,
    isDeleting: deletePost.isPending,
    createPost: createPost.mutate,
    deletePost: deletePost.mutate,
  };
};
