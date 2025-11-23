import { Eye, Zap, Bot, Package } from "lucide-react";
import { useLandingTranslation } from "@/hooks/useLandingTranslation";
import { Badge } from "@/components/ui/badge";

export const CommunicationPillarsSection = () => {
  const { t } = useLandingTranslation();

  const pillars = [
    {
      icon: Eye,
      gradient: "from-blue-500 to-cyan-500",
      ...t.pillars.items[0],
    },
    {
      icon: Zap,
      gradient: "from-purple-500 to-pink-500",
      ...t.pillars.items[1],
    },
    {
      icon: Bot,
      gradient: "from-green-500 to-emerald-500",
      ...t.pillars.items[2],
    },
    {
      icon: Package,
      gradient: "from-orange-500 to-amber-500",
      ...t.pillars.items[3],
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-16 space-y-4">
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">
            {t.pillars.badge}
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            {t.pillars.title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t.pillars.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <div
                key={index}
                className="bg-card border rounded-xl p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${pillar.gradient} flex items-center justify-center mb-6`}>
                  <Icon className="h-10 w-10 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  {pillar.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};