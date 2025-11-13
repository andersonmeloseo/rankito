import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, TrendingUp, Shield } from "lucide-react";
import { useLandingTranslation } from "@/hooks/useLandingTranslation";

export const HeroSection = () => {
  const { t } = useLandingTranslation();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-muted/20 to-background py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Copy */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-100">
                {t.hero.badge}
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-foreground">
                {t.hero.title}
              </h1>
              
              {/* Sub-headline batendo na dor */}
              <p className="text-2xl font-semibold text-red-600 dark:text-red-400 leading-tight">
                {t.hero.painPoint}
              </p>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                {t.hero.description}
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-blue-600 text-white hover:bg-blue-700 shadow-lg text-lg px-8 py-6"
                onClick={() => window.location.href = '/auth'}
              >
                {t.hero.ctaPrimary}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 text-lg px-8 py-6"
              >
                {t.hero.ctaSecondary}
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-muted-foreground">{t.hero.socialProof.sites}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-sm text-muted-foreground">{t.hero.socialProof.revenue}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="text-sm text-muted-foreground">{t.hero.socialProof.secure}</span>
              </div>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative">
            <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-2xl shadow-2xl p-8">
              <img
                src="/images/screenshots/dashboard-overview.png"
                alt="Dashboard Rankito CRM mostrando visão geral com métricas de sites ativos, receita mensal, conversões, gráficos de performance e pipeline CRM"
                className="rounded-lg shadow-xl w-full"
                loading="lazy"
              />
            </div>
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-white dark:bg-card shadow-lg rounded-lg p-4 animate-float">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-semibold">+15 conversões hoje</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
