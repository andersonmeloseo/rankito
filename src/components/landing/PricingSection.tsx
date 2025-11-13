import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Infinity, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const PricingSection = () => {
  const { plans, isLoading } = useSubscriptionPlans();

  const activePlans = plans?.filter(p => p.is_active) || [];
  const sortedPlans = [...activePlans].sort((a, b) => a.price - b.price);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

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
            Planos e Preços
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            Escolha o Plano Ideal para Seu Portfólio
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comece com trial gratuito. Sem cartão de crédito. Cancele quando quiser.
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
                        Mais Popular
                      </Badge>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-foreground">
                        {formatPrice(plan.price)}
                      </span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    {plan.trial_days > 0 && (
                      <Badge variant="outline" className="mt-2 border-green-600 text-green-600">
                        {plan.trial_days} dias grátis
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-grow">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">
                        {plan.max_sites === null ? "Sites ilimitados" : `${plan.max_sites} sites`}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">
                        {plan.max_pages_per_site === null 
                          ? "Páginas ilimitadas por site" 
                          : `${plan.max_pages_per_site} páginas por site`}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">
                        {plan.max_gsc_integrations === null 
                          ? "Integrações GSC ilimitadas" 
                          : `${plan.max_gsc_integrations} integração${plan.max_gsc_integrations > 1 ? 'ões' : ''} GSC`}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">Dashboard inteligente</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">CRM completo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">Portal whitelabel</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">Indexação automática GSC</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">Tracking de conversões</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">Relatórios automáticos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">Suporte por email</span>
                    </li>
                  </ul>
                </CardContent>

                <CardFooter className="mt-auto pt-0">
                  <Button
                    className={`w-full text-lg py-6 ${
                      isPopular 
                        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg" 
                        : "border-2"
                    }`}
                    variant={isPopular ? "default" : "outline"}
                    onClick={() => {
                      if (plan.stripe_checkout_url) {
                        window.open(plan.stripe_checkout_url, '_blank');
                      } else {
                        window.location.href = '/auth';
                      }
                    }}
                  >
                    {plan.stripe_checkout_url ? (
                      <>
                        Começar Agora
                        <ExternalLink className="ml-2 h-5 w-5" />
                      </>
                    ) : (
                      "Começar Trial Gratuito"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Todos os planos incluem: Suporte por email • Atualizações gratuitas • Cancelamento a qualquer momento
          </p>
        </div>
      </div>
    </section>
  );
};
