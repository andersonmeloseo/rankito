import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, BarChart, ArrowRight } from "lucide-react";

export const GSCShowcase = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 dark:from-blue-950 dark:via-purple-950 dark:to-blue-950">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Copy */}
          <div className="space-y-8">
            <Badge className="bg-yellow-500 text-white hover:bg-yellow-500">
              🚀 Diferencial Exclusivo
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              Pare de Indexar Sites Manualmente.{" "}
              <span className="text-blue-600">Deixe o Rankito Fazer por Você</span>
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              A única plataforma de Rank & Rent com integração completa ao Google Search Console.
              Automatize completamente o processo de indexação e economize horas de trabalho manual.
            </p>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Indexação em Massa</h3>
                  <p className="text-muted-foreground">
                    Adicione centenas de URLs à fila e deixe o sistema processar automaticamente.
                    Suporte a múltiplas contas GSC para quota agregada.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Agendamentos Inteligentes</h3>
                  <p className="text-muted-foreground">
                    Configure envio automático de sitemaps (diário, semanal, mensal). 
                    O sistema trabalha por você 24/7.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <BarChart className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Monitoramento em Tempo Real</h3>
                  <p className="text-muted-foreground">
                    Acompanhe status de indexação, quotas diárias e histórico completo de 
                    todas as submissões. Transparência total.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-600 p-6 rounded-r-lg">
              <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                💡 Economize até <span className="text-2xl">10 horas/semana</span> em trabalho manual de indexação
              </p>
            </div>

            <Button 
              size="lg" 
              className="bg-blue-600 text-white hover:bg-blue-700 shadow-lg text-lg px-8 py-6"
              onClick={() => window.location.href = '/auth'}
            >
              Começar a Indexar Automaticamente
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Right Column - Visual */}
          <div className="relative">
            <div className="bg-white dark:bg-card rounded-2xl shadow-2xl p-6 border">
              <img
                src="/images/screenshots/gsc-monitoring.png"
                alt="Interface de Monitoramento Google Search Console mostrando integrações ativas, quota de URLs disponível, URLs indexadas, taxa de sucesso e gráfico de uso diário"
                className="rounded-lg w-full"
                loading="lazy"
              />
            </div>
            {/* Floating Stats */}
            <div className="absolute -bottom-6 -left-6 bg-white dark:bg-card shadow-xl rounded-lg p-6 border">
              <div className="text-sm text-muted-foreground mb-1">Quota Disponível Hoje</div>
              <div className="text-3xl font-bold text-green-600">845 URLs</div>
              <div className="text-xs text-muted-foreground mt-1">De 1000 URLs totais</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
