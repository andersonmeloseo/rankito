import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useGBPPhotos = (profileId: string) => {
  const queryClient = useQueryClient();

  const { data: photos, isLoading } = useQuery({
    queryKey: ['gbp-photos', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gbp_photos')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profileId,
  });

  const deletePhoto = useMutation({
    mutationFn: async (photoId: string) => {
      const { error } = await supabase
        .from('gbp_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Foto excluída com sucesso');
      queryClient.invalidateQueries({ queryKey: ['gbp-photos', profileId] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir foto: ${error.message}`);
    },
  });

  return {
    photos,
    isLoading,
    deletePhoto: deletePhoto.mutate,
    isDeleting: deletePhoto.isPending,
  };
};
