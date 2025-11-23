import { useState, useEffect } from "react";
import { useLandingTranslation } from "@/hooks/useLandingTranslation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Clock, DollarSign, Calculator } from "lucide-react";

export const ROICalculator = () => {
  const { t, formatCurrency } = useLandingTranslation();
  const navigate = useNavigate();
  
  const [numSites, setNumSites] = useState(10);
  const [manualHours, setManualHours] = useState(20);
  const [hourlyRate, setHourlyRate] = useState(100);

  // Calculations
  const timePerSite = numSites * 2; // 2h/semana por site
  const hoursSaved = Math.min(manualHours, timePerSite);
  const monthlySavings = (hoursSaved * 4) * hourlyRate; // 4 semanas
  const rankitoCost = 197; // Professional plan
  const monthlyROI = monthlySavings - rankitoCost;
  const yearlyROI = monthlyROI * 12;
  const roiPercentage = ((monthlyROI / rankitoCost) * 100).toFixed(0);

  return (
    <section className="py-24 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-16 space-y-4">
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">
            {t.roiCalculator.badge}
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            {t.roiCalculator.title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t.roiCalculator.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Left: Inputs */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Label htmlFor="num-sites" className="text-base font-semibold">
                {t.roiCalculator.inputs.sites.label}
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  id="num-sites"
                  min={1}
                  max={100}
                  step={1}
                  value={[numSites]}
                  onValueChange={(value) => setNumSites(value[0])}
                  className="flex-1"
                />
                <span className="text-2xl font-bold text-blue-600 min-w-[4rem] text-right">
                  {numSites}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t.roiCalculator.inputs.sites.description}
              </p>
            </div>

            <div className="space-y-4">
              <Label htmlFor="manual-hours" className="text-base font-semibold">
                {t.roiCalculator.inputs.hours.label}
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  id="manual-hours"
                  min={0}
                  max={40}
                  step={1}
                  value={[manualHours]}
                  onValueChange={(value) => setManualHours(value[0])}
                  className="flex-1"
                />
                <span className="text-2xl font-bold text-purple-600 min-w-[4rem] text-right">
                  {manualHours}h
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t.roiCalculator.inputs.hours.description}
              </p>
            </div>

            <div className="space-y-4">
              <Label htmlFor="hourly-rate" className="text-base font-semibold">
                {t.roiCalculator.inputs.rate.label}
              </Label>
              <Input
                id="hourly-rate"
                type="number"
                min={0}
                step={10}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value) || 0)}
                className="text-2xl font-bold text-green-600"
              />
              <p className="text-sm text-muted-foreground">
                {t.roiCalculator.inputs.rate.description}
              </p>
            </div>

            {/* Calculation Logic Explanation */}
            <div className="mt-8 p-6 bg-background rounded-xl border-2 border-primary/20 shadow-sm">
              <h4 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                {t.roiCalculator.calculationLogic.title}
              </h4>
              
              <div className="space-y-3 text-sm">
                {/* Step 1: Time per site */}
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <span className="font-bold text-blue-600 dark:text-blue-400">1.</span>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{t.roiCalculator.calculationLogic.steps.timePerSite.title}</p>
                    <p className="text-muted-foreground">
                      {numSites} sites × 2h/{t.roiCalculator.results.week} = {timePerSite}h/{t.roiCalculator.results.week}
                    </p>
                  </div>
                </div>

                {/* Step 2: Hours saved */}
                <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <span className="font-bold text-purple-600 dark:text-purple-400">2.</span>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{t.roiCalculator.calculationLogic.steps.hoursSaved.title}</p>
                    <p className="text-muted-foreground">
                      {hoursSaved}h/{t.roiCalculator.results.week} {t.roiCalculator.calculationLogic.steps.hoursSaved.description}
                    </p>
                  </div>
                </div>

                {/* Step 3: Monthly savings */}
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <span className="font-bold text-green-600 dark:text-green-400">3.</span>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{t.roiCalculator.calculationLogic.steps.monthlySavings.title}</p>
                    <p className="text-muted-foreground">
                      {hoursSaved}h × 4 {t.roiCalculator.calculationLogic.steps.monthlySavings.weeks} × {formatCurrency(hourlyRate)}/h = {formatCurrency(monthlySavings)}
                    </p>
                  </div>
                </div>

                {/* Step 4: Rankito cost */}
                <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <span className="font-bold text-orange-600 dark:text-orange-400">4.</span>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{t.roiCalculator.calculationLogic.steps.rankitoCost.title}</p>
                    <p className="text-muted-foreground">
                      {t.roiCalculator.calculationLogic.steps.rankitoCost.plan}: {formatCurrency(rankitoCost)}/{t.roiCalculator.results.month}
                    </p>
                  </div>
                </div>

                {/* Step 5: Net profit */}
                <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <span className="font-bold text-green-700 dark:text-green-400">✓</span>
                  <div className="flex-1">
                    <p className="font-bold text-foreground">{t.roiCalculator.calculationLogic.steps.netProfit.title}</p>
                    <p className="text-green-700 dark:text-green-400 font-semibold">
                      {formatCurrency(monthlySavings)} - {formatCurrency(rankitoCost)} = {formatCurrency(monthlyROI)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  💡 {t.roiCalculator.calculationLogic.footer.replace('{total}', formatCurrency(yearlyROI)).replace('{percentage}', roiPercentage)}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
            <h3 className="text-2xl font-bold mb-8">{t.roiCalculator.results.title}</h3>
            
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="h-6 w-6" />
                  <p className="text-sm font-medium opacity-90">{t.roiCalculator.results.monthlySavings}</p>
                </div>
                <p className="text-4xl font-bold">
                  {formatCurrency(monthlySavings)}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-6 w-6" />
                  <p className="text-sm font-medium opacity-90">{t.roiCalculator.results.timeSaved}</p>
                </div>
                <p className="text-4xl font-bold">
                  {hoursSaved}h/{t.roiCalculator.results.month}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="h-6 w-6" />
                  <p className="text-sm font-medium opacity-90">{t.roiCalculator.results.yearlyROI}</p>
                </div>
                <p className="text-4xl font-bold">
                  {formatCurrency(yearlyROI)}
                </p>
                <div className="mt-3 pt-3 border-t border-white/20">
                  <p className="text-sm opacity-90">
                    {t.roiCalculator.results.roiPercentage}: <span className="font-bold text-lg">{roiPercentage}%</span>
                  </p>
                </div>
              </div>

              <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-4 mt-6">
                <p className="text-sm font-medium text-center">
                  {t.roiCalculator.results.netProfit}: <span className="font-bold text-xl">{formatCurrency(monthlyROI)}</span>
                </p>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full mt-8 bg-white text-blue-700 hover:bg-gray-100 font-bold"
              onClick={() => navigate('/auth')}
            >
              {t.roiCalculator.cta}
            </Button>
            
            <p className="text-center text-sm opacity-75 mt-4">
              {t.roiCalculator.ctaSubtext}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};