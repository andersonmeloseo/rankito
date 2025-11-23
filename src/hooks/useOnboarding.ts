import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action?: string;
  actionLabel?: string;
  completed: boolean;
}

export const useOnboarding = () => {
  const { user } = useRole();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch onboarding status
  const { data: profile, isLoading } = useQuery({
    queryKey: ["onboarding-status", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Check if user has sites
  const { data: sitesCount } = useQuery({
    queryKey: ["sites-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { count, error } = await supabase
        .from("rank_rent_sites")
        .select("*", { count: "exact", head: true })
        .or(`owner_user_id.eq.${user.id},created_by_user_id.eq.${user.id}`);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });

  // Check if user has GSC integrations
  const { data: gscCount } = useQuery({
    queryKey: ["gsc-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { count, error } = await supabase
        .from("google_search_console_integrations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });

  // Define onboarding steps
  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Bem-vindo ao Rankito CRM! 🎉",
      description: "Vamos configurar seu sistema em 6 passos rápidos para você começar a gerenciar seus projetos Rank & Rent com máxima eficiência.",
      completed: true,
    },
    {
      id: "create-project",
      title: "Crie seu primeiro projeto",
      description: "Adicione seu primeiro site de Rank & Rent. Você poderá rastrear conversões, indexar páginas no Google e muito mais.",
      action: "add-site",
      actionLabel: "Adicionar Projeto",
      completed: (sitesCount || 0) > 0,
    },
    {
      id: "setup-gsc",
      title: "Configure o Google Search Console",
      description: "Conecte suas contas GSC para automatizar a indexação de páginas no Google. Envie até 200 URLs por dia por integração.",
      action: "setup-gsc",
      actionLabel: "Configurar GSC",
      completed: (gscCount || 0) > 0,
    },
    {
      id: "download-plugin",
      title: "Baixe o Plugin WordPress",
      description: "Se seu site usa WordPress, baixe e instale o plugin Rank & Rent Tracker para rastreamento automático de conversões, cliques e jornada do usuário. Caso não use WordPress, pule este passo.",
      action: "download-plugin",
      actionLabel: "Baixar Plugin",
      completed: false,
    },
    {
      id: "install-tracking",
      title: "Instale o Pixel de Tracking",
      description: "Adicione o pixel JavaScript ao seu site ou use o plugin WordPress Rank & Rent Tracker para rastrear conversões, cliques em WhatsApp, telefone e formulários. Veja a jornada completa dos visitantes.",
      action: "view-tracking",
      actionLabel: "Ver Instruções",
      completed: false, // Sempre false pois não podemos verificar isso
    },
    {
      id: "add-clients",
      title: "Cadastre seus Clientes",
      description: "Adicione clientes finais para alugar seus projetos. Gere links de portal personalizados com analytics exclusivos para cada cliente.",
      action: "add-client",
      actionLabel: "Cadastrar Cliente",
      completed: false,
    },
  ];

  // Mark onboarding as completed
  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-status", user?.id] });
      setIsOpen(false);
    },
  });

  // Auto-open onboarding for new users
  useEffect(() => {
    if (!isLoading && profile && !profile.onboarding_completed) {
      // Delay para dar tempo do dashboard carregar
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [profile, isLoading]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipOnboarding = () => {
    completeOnboardingMutation.mutate();
  };

  const restartOnboarding = () => {
    setCurrentStep(0);
    setIsOpen(true);
  };

  const completeOnboarding = () => {
    completeOnboardingMutation.mutate();
  };

  return {
    steps,
    currentStep,
    isOpen,
    isLoading,
    isCompleted: profile?.onboarding_completed || false,
    setIsOpen,
    setCurrentStep,
    nextStep,
    prevStep,
    skipOnboarding,
    restartOnboarding,
    completeOnboarding,
  };
};
