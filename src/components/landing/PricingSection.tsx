import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Infinity, ExternalLink, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLandingTranslation } from "@/hooks/useLandingTranslation";

export const PricingSection = () => {
  const { plans, isLoading } = useSubscriptionPlans();
  const { t, formatCurrency } = useLandingTranslation();

  const activePlans = plans?.filter(p => p.is_active) || [];
  const sortedPlans = [...activePlans].sort((a, b) => a.price - b.price);

  const formatLimit = (value: number | null) => {
    if (value === null) return <Infinity className="h-5 w-5 text-blue-600" />;
    return value;
  };

  if (isLoading) {
    return (
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <Skeleton className="h-12 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-[600px] mx-auto" />
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-[600px] rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-16 space-y-4">
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            {t.pricing.badge}
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            {t.pricing.title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t.pricing.description}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {sortedPlans.map((plan, index) => {
            const isPopular = index === 1; // Middle plan is popular
            
            return (
              <Card
                key={plan.id}
                className={`flex flex-col h-full transition-all duration-300 hover:shadow-xl ${
                  isPopular ? "border-2 border-blue-500 shadow-lg" : "hover:scale-[1.02]"
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    {isPopular && (
                      <Badge className="bg-yellow-500 text-white hover:bg-yellow-500">
                        {t.pricing.popular}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-foreground">
                        {formatCurrency(plan.price)}
                      </span>
                      <span className="text-muted-foreground">{t.pricing.perMonth}</span>
                    </div>
                    {plan.trial_days > 0 && (
                      <Badge variant="outline" className="mt-2 border-green-600 text-green-600">
                        {plan.trial_days} {t.pricing.freeDays}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-grow">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">
                        {t.pricing.upTo} {formatLimit(plan.max_sites)} {t.pricing.sites}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">
                        {t.pricing.upTo} {formatLimit(plan.max_pages_per_site)} {t.pricing.pages}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">
                        {formatLimit(plan.max_gsc_integrations)} {t.pricing.integrations}
                      </span>
                    </li>
                    
                    {/* Tracking Avançado */}
                    <li className="flex items-start gap-2">
                      {plan.has_advanced_tracking ? (
                        <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <span className={`text-sm ${plan.has_advanced_tracking ? 'text-foreground' : 'text-muted-foreground'}`}>
                        Tracking Avançado (Google Ads + Meta)
                      </span>
                    </li>
                    
                    <li className="pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase border-t mt-4">
                      {t.pricing.footer}
                    </li>
                    
                    {t.pricing.commonFeatures.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-6">
                  <Button
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                    size="lg"
                    onClick={() => {
                      // Redirecionar para página de registro com plano pré-selecionado
                      window.location.href = `/auth?plan=${plan.slug}`;
                    }}
                  >
                    {t.pricing.subscribe}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
