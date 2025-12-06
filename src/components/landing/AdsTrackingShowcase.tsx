import { Target, FileSpreadsheet, Zap, TrendingUp, ArrowRight, CheckCircle2 } from "lucide-react";
import { useLandingTranslation } from "@/hooks/useLandingTranslation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const AdsTrackingShowcase = () => {
  const { t } = useLandingTranslation();
  const navigate = useNavigate();

  const features = [
    {
      icon: Target,
      gradient: "from-purple-500 to-pink-500",
      title: t.adsTracking?.features?.[0]?.title || "Metas de Conversão Personalizadas",
      description: t.adsTracking?.features?.[0]?.description || "Defina o que REALMENTE é conversão: cliques em 'WhatsApp Advocacia', 'Solicitar Orçamento', visitas em /obrigado. Não mais clique genérico = conversão.",
    },
    {
      icon: FileSpreadsheet,
      gradient: "from-blue-500 to-cyan-500",
      title: t.adsTracking?.features?.[1]?.title || "Export Google Ads Offline",
      description: t.adsTracking?.features?.[1]?.description || "CSV pronto para upload no Google Ads com GCLID, timezone, email hash SHA256. Compatível com Enhanced Conversions for Leads.",
    },
    {
      icon: Zap,
      gradient: "from-indigo-500 to-blue-500",
      title: t.adsTracking?.features?.[2]?.title || "Meta Conversions API Direto",
      description: t.adsTracking?.features?.[2]?.description || "Envie conversões diretamente para Meta CAPI. Suporte a fbp, fbc, fbclid. Modo de teste integrado para validação antes de produção.",
    },
    {
      icon: TrendingUp,
      gradient: "from-green-500 to-emerald-500",
      title: t.adsTracking?.features?.[3]?.title || "Dashboard de Campanhas",
      description: t.adsTracking?.features?.[3]?.description || "Veja UTM Source, Campaign, Medium, gclid, fbclid de cada conversão. Saiba exatamente qual campanha está performando.",
    },
  ];

  const benefits = [
    t.adsTracking?.benefits?.[0] || "CPL mais baixo com conversões reais",
    t.adsTracking?.benefits?.[1] || "ROAS mais preciso nas plataformas",
    t.adsTracking?.benefits?.[2] || "Otimização automática melhorada",
    t.adsTracking?.benefits?.[3] || "Relatórios que impressionam clientes",
  ];

  return (
    <section id="ads-tracking" className="py-24 bg-gradient-to-br from-purple-950/20 via-background to-indigo-950/20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 space-y-6">
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-sm px-4 py-1">
            {t.adsTracking?.badge || "🎯 Tracking Avançado para Ads"}
          </Badge>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            {t.adsTracking?.title || "Pare de Perder Dinheiro com Conversões Invisíveis"}
          </h2>
          
          <div className="max-w-3xl mx-auto space-y-4">
            <p className="text-xl text-red-500/90 font-medium">
              {t.adsTracking?.painPoint || "Google Ads e Meta Ads só veem o clique. Eles não sabem quem virou lead, ligou pro WhatsApp ou fechou negócio. Seu CPL está inflado porque as plataformas não conseguem otimizar."}
            </p>
            
            <p className="text-lg text-muted-foreground">
              {t.adsTracking?.description || "Com Rankito, você envia conversões REAIS de volta para Google e Meta. Resultado: CPL mais baixo, ROAS mais alto, clientes impressionados."}
            </p>
          </div>
        </div>

        {/* Benefits pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2"
            >
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-700">{benefit}</span>
            </div>
          ))}
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-card border rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col group"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                
                <h3 className="text-lg font-bold text-foreground mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Highlight box */}
        <div className="bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-blue-600/10 border border-purple-500/20 rounded-2xl p-8 mb-12">
          <div className="text-center space-y-4">
            <p className="text-xl font-bold text-purple-300">
              {t.adsTracking?.highlight || "🏆 CONVERSÕES OFFLINE → GOOGLE ADS + META CAPI → OTIMIZAÇÃO AUTOMÁTICA INTELIGENTE"}
            </p>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t.adsTracking?.highlightDescription || "Gestores de tráfego que usam Rankito reportam redução média de 25-40% no CPL após 30 dias de envio de conversões offline."}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            size="lg"
            className="bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-600/20 gap-2 text-lg px-8"
            onClick={() => navigate('/auth')}
          >
            {t.adsTracking?.ctaButton || "Começar a Enviar Conversões Offline"}
            <ArrowRight className="h-5 w-5" />
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            {t.adsTracking?.ctaSubtext || "Compatível com Google Ads e Meta Ads • Nenhuma configuração técnica complexa"}
          </p>
        </div>
      </div>
    </section>
  );
};
