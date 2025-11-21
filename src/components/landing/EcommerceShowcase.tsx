import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, TrendingUp, Search, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLandingTranslation } from "@/hooks/useLandingTranslation";

const featureIcons = [Globe, ShoppingCart, TrendingUp, Search, Package];

const featureColors = {
  0: 'from-orange-500 to-yellow-500',
  1: 'from-yellow-500 to-orange-500',
  2: 'from-orange-600 to-red-500',
  3: 'from-amber-500 to-orange-600',
  4: 'from-orange-500 to-yellow-600',
};

export const EcommerceShowcase = () => {
  const navigate = useNavigate();
  const { t } = useLandingTranslation();

  return (
    <section id="ecommerce" className="py-24 bg-gradient-to-b from-background via-orange-50/10 to-background">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <Badge className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white border-0 text-sm px-4 py-1.5">
              {t.ecommerce.badge}
            </Badge>

            <h2 className="text-5xl lg:text-6xl font-bold leading-tight">
              {t.ecommerce.title}
            </h2>

            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <p className="text-red-900 font-semibold">
                ⚠️ {t.ecommerce.painPoint}
              </p>
            </div>

            <p className="text-lg text-muted-foreground leading-relaxed">
              {t.ecommerce.description}
            </p>

            <div className="space-y-4">
              {t.ecommerce.features.map((feature, index) => {
                const Icon = featureIcons[index];
                const gradientClass = featureColors[index as keyof typeof featureColors];

                return (
                  <div key={index} className="flex gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 p-6 rounded-xl">
              <p className="text-orange-900 font-bold text-lg leading-relaxed">
                {t.ecommerce.highlight}
              </p>
            </div>

            <Button
              size="lg"
              className="bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-white shadow-xl hover:shadow-2xl transition-all text-lg px-8 py-6"
              onClick={() => navigate('/auth')}
            >
              {t.ecommerce.ctaButton}
            </Button>
          </div>

          {/* Right Column - Visual */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-orange-100">
              <img
                src="/images/screenshots/ecommerce-dashboard-full.png"
                alt="Dashboard de Monitoramento E-commerce"
                className="w-full h-auto"
                onError={(e) => {
                  console.error('Erro ao carregar imagem do dashboard e-commerce');
                  e.currentTarget.src = '/images/screenshots/dashboard-overview.png';
                }}
              />
            </div>

            {/* Floating Stats Card */}
            <div className="absolute -bottom-8 -left-8 bg-white rounded-xl shadow-2xl p-6 border border-orange-100 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <ShoppingCart className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vendas Hoje</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    +R$ 45.2K
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
