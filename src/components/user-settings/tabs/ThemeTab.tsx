import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { HexColorPicker } from 'react-colorful';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';

interface ThemeTabProps {
  profile: UserProfile | undefined;
  onUpdate: (updates: Partial<UserProfile>) => void;
  isUpdating: boolean;
}

const presets = [
  { name: 'ClickUp Blue', primary: '#3b82f6', accent: '#10b981' },
  { name: 'Purple Dream', primary: '#a855f7', accent: '#ec4899' },
  { name: 'Forest Green', primary: '#22c55e', accent: '#84cc16' },
  { name: 'Sunset Orange', primary: '#f97316', accent: '#fb923c' },
  { name: 'Ruby Red', primary: '#ef4444', accent: '#f43f5e' },
];

const hexToHsl = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const hslToHex = (hsl: string): string => {
  const [h, s, l] = hsl.split(' ').map((v, i) => {
    const num = parseFloat(v);
    return i === 0 ? num : num / 100;
  });

  const hueToRgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = Math.round(hueToRgb(p, q, h / 360 + 1/3) * 255);
  const g = Math.round(hueToRgb(p, q, h / 360) * 255);
  const b = Math.round(hueToRgb(p, q, h / 360 - 1/3) * 255);

  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
};

export const ThemeTab = ({ profile, onUpdate, isUpdating }: ThemeTabProps) => {
  const defaultPrimary = '217 91% 60%';
  const defaultAccent = '142 76% 36%';

  const [primaryColor, setPrimaryColor] = useState(
    hslToHex(profile?.theme_preferences?.primary_color || defaultPrimary)
  );
  const [accentColor, setAccentColor] = useState(
    hslToHex(profile?.theme_preferences?.accent_color || defaultAccent)
  );

  useEffect(() => {
    if (profile?.theme_preferences) {
      setPrimaryColor(hslToHex(profile.theme_preferences.primary_color || defaultPrimary));
      setAccentColor(hslToHex(profile.theme_preferences.accent_color || defaultAccent));
    }
  }, [profile]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', hexToHsl(primaryColor));
    root.style.setProperty('--accent', hexToHsl(accentColor));
  }, [primaryColor, accentColor]);

  const handleSave = () => {
    onUpdate({
      theme_preferences: {
        ...profile?.theme_preferences,
        primary_color: hexToHsl(primaryColor),
        accent_color: hexToHsl(accentColor),
      },
    });
  };

  const handlePreset = (preset: typeof presets[0]) => {
    setPrimaryColor(preset.primary);
    setAccentColor(preset.accent);
    toast.success(`Tema "${preset.name}" aplicado`);
  };

  const handleReset = () => {
    setPrimaryColor(hslToHex(defaultPrimary));
    setAccentColor(hslToHex(defaultAccent));
    toast.success('Cores restauradas ao padrão');
  };

  const hasChanges =
    hexToHsl(primaryColor) !== (profile?.theme_preferences?.primary_color || defaultPrimary) ||
    hexToHsl(accentColor) !== (profile?.theme_preferences?.accent_color || defaultAccent);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tema</h1>
        <p className="text-muted-foreground mt-2">
          Personalize as cores e o visual do sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Presets de Cores</CardTitle>
          <CardDescription>Escolha um tema pré-configurado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {presets.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                onClick={() => handlePreset(preset)}
                className="h-auto flex-col gap-2 p-4"
              >
                <div className="flex gap-2">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-border"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <div
                    className="w-8 h-8 rounded-full border-2 border-border"
                    style={{ backgroundColor: preset.accent }}
                  />
                </div>
                <span className="text-xs font-medium">{preset.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cores Personalizadas</CardTitle>
          <CardDescription>Ajuste as cores primária e de destaque</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Cor Primária</Label>
              <div className="flex items-center gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 h-12"
                    >
                      <div
                        className="w-8 h-8 rounded border-2 border-border"
                        style={{ backgroundColor: primaryColor }}
                      />
                      <span className="font-mono text-sm">{primaryColor.toUpperCase()}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3">
                    <HexColorPicker color={primaryColor} onChange={setPrimaryColor} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cor de Destaque</Label>
              <div className="flex items-center gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 h-12"
                    >
                      <div
                        className="w-8 h-8 rounded border-2 border-border"
                        style={{ backgroundColor: accentColor }}
                      />
                      <span className="font-mono text-sm">{accentColor.toUpperCase()}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3">
                    <HexColorPicker color={accentColor} onChange={setAccentColor} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t space-y-3">
            <p className="text-sm font-medium">Preview ao vivo</p>
            <div className="flex flex-wrap gap-3">
              <Button style={{ backgroundColor: primaryColor, color: 'white' }}>
                Botão Primário
              </Button>
              <Button variant="outline" style={{ borderColor: primaryColor, color: primaryColor }}>
                Botão Outline
              </Button>
              <div
                className="px-4 py-2 rounded-md text-sm font-medium text-white"
                style={{ backgroundColor: accentColor }}
              >
                Badge Destaque
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasChanges && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            Restaurar Padrão
          </Button>
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? 'Salvando...' : 'Salvar Tema'}
          </Button>
        </div>
      )}
    </div>
  );
};
