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
import { CheckCircle } from "lucide-react";
import { useLandingTranslation } from "@/hooks/useLandingTranslation";

const featureIcons = [
  LayoutDashboard,
  Briefcase,
  Send,
  DollarSign,
  Users,
  BarChart3
];

const featureScreenshots = [
  "/images/screenshots/dashboard-overview.png",
  "/images/screenshots/crm-pipeline.png",
  "/images/screenshots/gsc-monitoring.png",
  "/images/screenshots/financial-performance.png",
  "/images/screenshots/client-portal.png",
  "/images/screenshots/analytics-charts.png",
];

export const FeaturesSection = () => {
  const { t } = useLandingTranslation();

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-16 space-y-4">
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            {t.features.badge}
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            {t.features.title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t.features.subtitle}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
          {t.features.items.map((feature, index) => {
            const Icon = featureIcons[index];
            const isHighlight = index === 2; // GSC feature
            return (
              <Card
                key={index}
                className={`flex flex-col transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
                  isHighlight ? "border-2 border-blue-500 shadow-lg" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <Icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <CardTitle className="text-2xl">{feature.title}</CardTitle>
                    </div>
                    {feature.badge && (
                      <Badge className="bg-yellow-500 text-white hover:bg-yellow-500">
                        {feature.badge}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-grow space-y-6">
                  <ul className="space-y-3">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="pt-4">
                    <img
                      src={featureScreenshots[index]}
                      alt={`Screenshot ${feature.title}`}
                      className="rounded-lg shadow-lg w-full"
                      loading="lazy"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
