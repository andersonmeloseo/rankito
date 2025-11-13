import { 
  LayoutDashboard, 
  Briefcase, 
  Send, 
  DollarSign, 
  Users, 
  BarChart3 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: LayoutDashboard,
    title: "Dashboard Inteligente",
    description: "Acompanhe performance, receita, custos e ROI de todos os seus sites em tempo real. Métricas que importam, sem ruído.",
    highlight: false,
  },
  {
    icon: Briefcase,
    title: "CRM Completo",
    description: "Capture leads, gerencie deals, automatize follow-ups e nunca mais perca uma oportunidade de negócio.",
    highlight: false,
  },
  {
    icon: Send,
    title: "Indexação Automática GSC",
    description: "Conecte sua conta Google Search Console e indexe centenas de páginas automaticamente. Envie sitemaps, agende indexações e monitore status em tempo real.",
    highlight: true,
    badge: "EXCLUSIVO",
    benefits: [
      "Batch indexing (200 URLs/dia por integração)",
      "Agendamento automático de sitemaps",
      "Monitoramento de quota agregada",
      "Múltiplas contas GSC por site"
    ]
  },
  {
    icon: DollarSign,
    title: "Financeiro Completo",
    description: "Registre receitas, custos, pagamentos e calcule ROI automaticamente. Saiba exatamente quanto cada site está gerando.",
    highlight: false,
  },
  {
    icon: Users,
    title: "Portal Whitelabel",
    description: "Gere portais personalizados com sua logo e cores. Seus clientes acompanham performance sem acessar seu dashboard.",
    highlight: false,
  },
  {
    icon: BarChart3,
    title: "Analytics Avançado",
    description: "Saiba quantos leads cada página gera, de onde vêm, quando acontecem. Tracking pixel + integração WordPress.",
    highlight: false,
  },
];

export const FeaturesSection = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-16 space-y-4">
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Funcionalidades
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            Tudo que Você Precisa em Uma Plataforma
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Pare de usar 5 ferramentas diferentes. Gerencie todo seu negócio de Rank & Rent
            com uma única solução profissional.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className={`transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
                feature.highlight ? "border-2 border-blue-500 shadow-lg" : ""
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${
                    feature.highlight 
                      ? "bg-blue-100 dark:bg-blue-900" 
                      : "bg-muted"
                  }`}>
                    <feature.icon className={`h-8 w-8 ${
                      feature.highlight ? "text-blue-600" : "text-foreground"
                    }`} />
                  </div>
                  {feature.badge && (
                    <Badge className="bg-yellow-500 text-white hover:bg-yellow-500">
                      {feature.badge}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              {feature.benefits && (
                <CardContent>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-green-600 mt-0.5">✓</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
