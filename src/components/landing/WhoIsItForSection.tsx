import { Building2, Users, Target, ShoppingCart, Briefcase } from "lucide-react";
import { useLandingTranslation } from "@/hooks/useLandingTranslation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export const WhoIsItForSection = () => {
  const { t } = useLandingTranslation();
  const navigate = useNavigate();

  const profiles = [
    {
      icon: Building2,
      gradient: "from-blue-500 to-cyan-500",
      ...t.whoIsItFor.profiles[0],
    },
    {
      icon: Users,
      gradient: "from-purple-500 to-pink-500",
      ...t.whoIsItFor.profiles[1],
    },
    {
      icon: Target,
      gradient: "from-green-500 to-emerald-500",
      ...t.whoIsItFor.profiles[2],
    },
    {
      icon: ShoppingCart,
      gradient: "from-orange-500 to-amber-500",
      ...t.whoIsItFor.profiles[3],
    },
    {
      icon: Briefcase,
      gradient: "from-indigo-500 to-violet-500",
      ...t.whoIsItFor.profiles[4],
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-muted/30 to-muted/10">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-16 space-y-4">
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">
            {t.whoIsItFor.badge}
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            {t.whoIsItFor.title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t.whoIsItFor.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
          {profiles.map((profile, index) => {
            const Icon = profile.icon;
            return (
              <div
                key={index}
                className="bg-card border rounded-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${profile.gradient} flex items-center justify-center mb-4`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-lg font-bold text-foreground mb-3">
                  {profile.title}
                </h3>
                
                <div className="space-y-3 mb-4 flex-1">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {profile.description}
                  </p>
                </div>
                
                <p className="text-xs text-muted-foreground italic border-t pt-3">
                  "{profile.example}"
                </p>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Button
            size="lg"
            className="bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
            onClick={() => navigate('/auth')}
          >
            {t.whoIsItFor.cta}
          </Button>
        </div>
      </div>
    </section>
  );
};