import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Sparkles, X, MousePointer, ArrowRight } from 'lucide-react';
import { useDetectedCTAs } from '@/hooks/useDetectedCTAs';
import { Skeleton } from '@/components/ui/skeleton';

interface ConversionGoalsOnboardingProps {
  siteId: string;
  onCreateGoal: () => void;
  onDismiss: () => void;
}

const STORAGE_KEY_PREFIX = 'conversion-goals-onboarding-dismissed-';

export const getOnboardingDismissed = (siteId: string): boolean => {
  return localStorage.getItem(`${STORAGE_KEY_PREFIX}${siteId}`) === 'true';
};

export const setOnboardingDismissed = (siteId: string): void => {
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${siteId}`, 'true');
};

export const ConversionGoalsOnboarding = ({ 
  siteId, 
  onCreateGoal, 
  onDismiss 
}: ConversionGoalsOnboardingProps) => {
  const { data: detectedCTAs, isLoading } = useDetectedCTAs(siteId);
  
  // Get top 3 most clicked CTAs
  const topCTAs = detectedCTAs?.slice(0, 3) || [];

  const handleDismiss = () => {
    setOnboardingDismissed(siteId);
    onDismiss();
  };

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <CardContent className="p-6 relative">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex-shrink-0">
            <Lightbulb className="h-6 w-6 text-primary" />
          </div>

          <div className="flex-1 space-y-4">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">Configure suas Metas de Conversão</h3>
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Defina quais ações realmente importam para seu negócio e acompanhe conversões com precisão.
              </p>
            </div>

            {/* Detected CTAs */}
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-8 w-28" />
                </div>
              </div>
            ) : topCTAs.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <MousePointer className="h-4 w-4 text-muted-foreground" />
                  CTAs mais clicados detectados:
                </p>
                <div className="flex flex-wrap gap-2">
                  {topCTAs.map((cta, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="py-1.5 px-3 text-xs font-medium bg-background border shadow-sm"
                    >
                      <span className="truncate max-w-[200px]">{cta.cta_text}</span>
                      <span className="ml-2 text-muted-foreground">
                        ({cta.click_count} {cta.click_count === 1 ? 'clique' : 'cliques'})
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Aguardando dados de cliques para sugestões automáticas...
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={onCreateGoal} className="gap-2">
                Criar Meta Agora
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" onClick={handleDismiss} className="text-muted-foreground">
                Talvez depois
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
