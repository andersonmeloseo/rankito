import { useEffect, useState } from "react";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, ExternalLink, Infinity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SubscriptionTabProps {
  profile: any;
}

export const SubscriptionTab = ({ profile }: SubscriptionTabProps) => {
  const { plans, isLoading: isLoadingPlans } = useSubscriptionPlans();
  const { data: trialStatus, isLoading: isLoadingTrial } = useTrialStatus();
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [isLoadingSub, setIsLoadingSub] = useState(true);

  useEffect(() => {
    const fetchCurrentSubscription = async () => {
      if (!profile?.id) return;
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (*)
        `)
        .eq('user_id', profile.id)
        .in('status', ['active', 'trial'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setCurrentSubscription(data);
      }
      setIsLoadingSub(false);
    };

    fetchCurrentSubscription();
  }, [profile?.id]);

  if (isLoadingPlans || isLoadingTrial || isLoadingSub) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const currentPlan = currentSubscription?.subscription_plans;
  const activePlans = plans?.filter(p => p.is_active) || [];

  const formatLimit = (value: number | null) => {
    if (value === null) return <Infinity className="h-4 w-4 inline" />;
    return value;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <div className="space-y-8">
      {/* Current Plan Card */}
      {currentPlan && (
        <Card className="border-2 border-blue-600 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-blue-600" />
                <div>
                  <CardTitle>Seu Plano Atual: {currentPlan.name}</CardTitle>
                  <CardDescription>
                    {currentSubscription.status === 'trial' && trialStatus?.daysRemaining
                      ? `Trial - ${trialStatus.daysRemaining} dias restantes`
                      : 'Assinatura Ativa'}
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-blue-600 text-white">
                {currentPlan.name}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{formatPrice(currentPlan.price)}</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
            
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Sites: </span>
                <span className="font-semibold">{formatLimit(currentPlan.max_sites)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Páginas/Site: </span>
                <span className="font-semibold">{formatLimit(currentPlan.max_pages_per_site)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">GSC: </span>
                <span className="font-semibold">{formatLimit(currentPlan.max_gsc_integrations)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans Grid */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Planos Disponíveis</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activePlans.map((plan) => {
            const isCurrentPlan = currentPlan?.id === plan.id;
            const hasStripeUrl = !!plan.stripe_checkout_url;

            return (
              <Card 
                key={plan.id} 
                className={`shadow-card hover:shadow-lg transition-all ${
                  isCurrentPlan ? 'border-2 border-blue-600' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    {isCurrentPlan && (
                      <Badge className="bg-blue-600 text-white">Atual</Badge>
                    )}
                  </div>
                  {plan.description && (
                    <CardDescription className="text-base leading-relaxed mt-2">
                      {plan.description}
                    </CardDescription>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Price */}
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{formatPrice(plan.price)}</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    {plan.trial_days > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {plan.trial_days} dias de trial grátis
                      </p>
                    )}
                  </div>

                  {/* Limits */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>{formatLimit(plan.max_sites)} sites</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>{formatLimit(plan.max_pages_per_site)} páginas por site</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>{formatLimit(plan.max_gsc_integrations)} integrações GSC</span>
                    </div>
                  </div>

                  {/* Features */}
                  {plan.features && plan.features.length > 0 && (
                    <div className="space-y-2 text-sm pt-4 border-t">
                      {plan.features.map((feature: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Subscribe Button */}
                  <Button
                    className="w-full transition-all active:scale-[0.98]"
                    disabled={isCurrentPlan || !hasStripeUrl}
                    onClick={() => {
                      if (plan.stripe_checkout_url) {
                        window.open(plan.stripe_checkout_url, '_blank');
                      }
                    }}
                  >
                    {isCurrentPlan ? (
                      'Plano Atual'
                    ) : !hasStripeUrl ? (
                      'Em breve'
                    ) : (
                      <>
                        Assinar
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
