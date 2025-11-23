import { Check, X, AlertCircle } from "lucide-react";
import { useLandingTranslation } from "@/hooks/useLandingTranslation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const ComparisonSection = () => {
  const { t } = useLandingTranslation();
  const navigate = useNavigate();

  const renderIcon = (status: 'yes' | 'no' | 'partial') => {
    if (status === 'yes') return <Check className="h-5 w-5 text-green-600" />;
    if (status === 'no') return <X className="h-5 w-5 text-red-600" />;
    return <AlertCircle className="h-5 w-5 text-orange-500" />;
  };

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-16 space-y-4">
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">
            {t.comparison.badge}
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            {t.comparison.title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t.comparison.subtitle}
          </p>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2">
                <th className="text-left p-4 font-bold text-foreground">{t.comparison.headers.feature}</th>
                <th className="text-center p-4 font-semibold text-muted-foreground">{t.comparison.headers.googleAnalytics}</th>
                <th className="text-center p-4 font-semibold text-muted-foreground">{t.comparison.headers.semrushAhrefs}</th>
                <th className="text-center p-4 font-semibold text-muted-foreground">{t.comparison.headers.agencyAnalytics}</th>
                <th className="text-center p-4 font-bold text-blue-600 bg-blue-50">
                  {t.comparison.headers.rankito}
                </th>
              </tr>
            </thead>
            <tbody>
              {t.comparison.rows.map((row, index) => (
                <tr key={index} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-semibold text-foreground">{row.feature}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {renderIcon(row.googleAnalytics.status)}
                      <span className="text-sm text-muted-foreground">{row.googleAnalytics.text}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {renderIcon(row.semrushAhrefs.status)}
                      <span className="text-sm text-muted-foreground">{row.semrushAhrefs.text}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {renderIcon(row.agencyAnalytics.status)}
                      <span className="text-sm text-muted-foreground">{row.agencyAnalytics.text}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center bg-blue-50/50">
                    <div className="flex items-center justify-center gap-2">
                      {renderIcon(row.rankito.status)}
                      <span className="text-sm font-semibold text-blue-700">{row.rankito.text}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-6">
          {t.comparison.rows.map((row, index) => (
            <div key={index} className="bg-card border rounded-lg p-6">
              <h3 className="font-bold text-foreground mb-4">{row.feature}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t.comparison.headers.googleAnalytics}</span>
                  <div className="flex items-center gap-2">
                    {renderIcon(row.googleAnalytics.status)}
                    <span className="text-sm">{row.googleAnalytics.text}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t.comparison.headers.semrushAhrefs}</span>
                  <div className="flex items-center gap-2">
                    {renderIcon(row.semrushAhrefs.status)}
                    <span className="text-sm">{row.semrushAhrefs.text}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t.comparison.headers.agencyAnalytics}</span>
                  <div className="flex items-center gap-2">
                    {renderIcon(row.agencyAnalytics.status)}
                    <span className="text-sm">{row.agencyAnalytics.text}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-blue-50 -mx-6 px-6 py-3 rounded">
                  <span className="text-sm font-semibold text-blue-700">{t.comparison.headers.rankito}</span>
                  <div className="flex items-center gap-2">
                    {renderIcon(row.rankito.status)}
                    <span className="text-sm font-semibold text-blue-700">{row.rankito.text}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8 italic">
          {t.comparison.footer}
        </p>

        <div className="text-center mt-12">
          <Button
            size="lg"
            className="bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
            onClick={() => navigate('/auth')}
          >
            {t.comparison.cta}
          </Button>
        </div>
      </div>
    </section>
  );
};