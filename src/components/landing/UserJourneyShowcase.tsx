import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Route, Target, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { useLandingTranslation } from "@/hooks/useLandingTranslation";
import userJourneyScreenshot from "@/assets/user-journey-screenshot.png";

const featureIcons = [Route, Clock, TrendingUp, Target];

const featureColors = {
  0: 'from-purple-500 to-blue-500',
  1: 'from-blue-500 to-indigo-500',
  2: 'from-indigo-500 to-purple-500',
  3: 'from-purple-600 to-pink-500',
};

export const UserJourneyShowcase = () => {
  const { t } = useLandingTranslation();

  return (
    <section id="user-journey" className="py-24 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-950 dark:via-blue-950 dark:to-indigo-950">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Copy */}
          <div className="space-y-8">
            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 text-sm px-4 py-1.5">
              {t.userJourney.badge}
            </Badge>

            <h2 className="text-5xl lg:text-6xl font-bold leading-tight">
              {t.userJourney.title}
            </h2>

            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-5 rounded-r-lg">
              <p className="text-red-900 dark:text-red-100 font-bold text-lg">
                ⚠️ {t.userJourney.painPoint}
              </p>
            </div>

            <p className="text-lg text-muted-foreground leading-relaxed">
              {t.userJourney.description}
            </p>

            <div className="space-y-5">
              {t.userJourney.features.map((feature, index) => {
                const Icon = featureIcons[index];
                const gradientClass = featureColors[index as keyof typeof featureColors];

                return (
                  <div key={index} className="flex gap-4">
                    <div className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl mb-1.5">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 border-l-4 border-purple-600 p-6 rounded-r-xl">
              <p className="text-purple-900 dark:text-purple-100 font-bold text-lg leading-relaxed">
                💡 {t.userJourney.highlight}
              </p>
            </div>

            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all text-lg px-8 py-6"
              onClick={() => window.location.href = '/auth'}
            >
              {t.userJourney.ctaButton}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Right Column - Visual */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-purple-100 dark:border-purple-800">
              <img
                src={userJourneyScreenshot}
                alt="Dashboard de Jornada do Usuário mostrando sessões recentes com entradas, navegação e saídas marcadas, tempo gasto por página e análise comportamental detalhada"
                className="w-full h-auto"
                loading="lazy"
              />
            </div>

            {/* Floating Stats Card */}
            <div className="absolute -bottom-8 -left-8 bg-white dark:bg-card rounded-xl shadow-2xl p-6 border border-purple-100 dark:border-purple-800">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <Route className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sessões Hoje</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    347 visitas
                  </p>
                  <p className="text-xs text-muted-foreground">2m 34s média</p>
                </div>
              </div>
            </div>

            {/* Top Right Floating Badge */}
            <div className="absolute -top-6 -right-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-xl p-4">
              <div className="flex items-center gap-2 text-white">
                <Target className="w-5 h-5" />
                <div>
                  <p className="text-xs font-semibold">Precisão</p>
                  <p className="text-lg font-bold">100%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
