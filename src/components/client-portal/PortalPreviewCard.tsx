import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Target, TrendingUp } from 'lucide-react';
import { PortalSettings } from '@/hooks/usePortalCustomization';

interface PortalPreviewCardProps {
  settings: PortalSettings;
}

export const PortalPreviewCard = ({ settings }: PortalPreviewCardProps) => {
  const { branding, texts } = settings;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Preview em Tempo Real
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Header Preview */}
        <div 
          className="p-6 rounded-lg border-2"
          style={{ 
            borderColor: branding.primary_color,
            background: `linear-gradient(135deg, ${branding.primary_color}10 0%, ${branding.secondary_color}10 100%)`
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            {branding.logo_url ? (
              <img 
                src={branding.logo_url} 
                alt="Logo preview" 
                className="h-12 w-12 object-contain"
              />
            ) : (
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: branding.primary_color }}
              >
                {branding.company_name ? branding.company_name.charAt(0).toUpperCase() : 'P'}
              </div>
            )}
            <div>
              <h3 className="font-bold text-foreground">
                {branding.company_name || 'Nome da Empresa'}
              </h3>
              {branding.tagline && (
                <p className="text-xs text-muted-foreground">{branding.tagline}</p>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-foreground">
              {texts.welcome_title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {texts.welcome_description}
            </p>
          </div>
        </div>

        {/* Metric Card Preview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <TrendingUp className="h-3 w-3" style={{ color: branding.accent_color }} />
            </div>
            <p className="text-xs text-muted-foreground mb-1">Conversões</p>
            <p className="text-2xl font-bold">128</p>
          </div>

          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-center justify-between mb-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mb-1">Visualizações</p>
            <p className="text-2xl font-bold">1,284</p>
          </div>
        </div>

        {/* Button Preview */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Preview do Botão</p>
          <Button 
            className="w-full"
            style={{ 
              backgroundColor: branding.accent_color,
              color: '#ffffff'
            }}
          >
            Ação Principal
          </Button>
        </div>

        {/* Badge Preview */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Preview do Badge</p>
          <Badge 
            style={{ 
              backgroundColor: branding.primary_color,
              color: '#ffffff'
            }}
          >
            Status Ativo
          </Badge>
        </div>

        {/* Footer Preview */}
        {texts.footer_text && (
          <div className="pt-3 border-t">
            <p className="text-xs text-center text-muted-foreground">
              {texts.footer_text}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
