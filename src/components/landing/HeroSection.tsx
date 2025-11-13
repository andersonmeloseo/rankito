import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, TrendingUp, Shield } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-muted/20 to-background py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Copy */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-100">
                Sistema Completo de Gestão
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-foreground">
                Gerencie Seu Império de{" "}
                <span className="text-blue-600">Rank & Rent</span> com Inteligência
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                A única plataforma completa para profissionais de SEO que gerenciam
                portfólios de sites de lead generation. Centralize gestão, financeiro,
                CRM e indexação automática em um só lugar.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-blue-600 text-white hover:bg-blue-700 shadow-lg text-lg px-8 py-6"
                onClick={() => window.location.href = '/auth'}
              >
                Comece Grátis Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 text-lg px-8 py-6"
              >
                Ver Demonstração
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-muted-foreground">200+ sites gerenciados</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-sm text-muted-foreground">R$ 1M+ rastreado</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="text-sm text-muted-foreground">100% Seguro</span>
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
