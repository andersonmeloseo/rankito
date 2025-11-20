import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VideoProgress {
  id: string;
  user_id: string;
  video_id: string;
  last_position_seconds: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useVideoProgress = (videoId?: string) => {
  return useQuery({
    queryKey: ["video-progress", videoId],
    queryFn: async () => {
      if (!videoId) return null;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("user_video_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("video_id", videoId)
        .maybeSingle();
      
      if (error) throw error;
      return data as VideoProgress | null;
    },
    enabled: !!videoId,
  });
};

export const useUpdateVideoProgress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      videoId, 
      lastPosition, 
      completed 
    }: { 
      videoId: string; 
      lastPosition: number; 
      completed: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from("user_video_progress")
        .upsert({
          user_id: user.id,
          video_id: videoId,
          last_position_seconds: Math.floor(lastPosition),
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        }, {
          onConflict: "user_id,video_id"
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["video-progress", variables.videoId] });
      queryClient.invalidateQueries({ queryKey: ["video-progress"] });
    },
  });
};

export const useAllVideoProgress = () => {
  return useQuery({
    queryKey: ["video-progress"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("user_video_progress")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data as VideoProgress[];
    },
  });
};
