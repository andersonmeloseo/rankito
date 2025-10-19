import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export interface ReportStyle {
  theme: 'modern' | 'minimal' | 'corporate' | 'vibrant';
  customColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

interface ReportStyleConfiguratorProps {
  style: ReportStyle;
  onStyleChange: (style: ReportStyle) => void;
}

const THEMES = {
  modern: { primary: '#8b5cf6', secondary: '#6366f1', accent: '#06b6d4' },
  minimal: { primary: '#374151', secondary: '#6b7280', accent: '#9ca3af' },
  corporate: { primary: '#1e40af', secondary: '#3b82f6', accent: '#60a5fa' },
  vibrant: { primary: '#ec4899', secondary: '#f59e0b', accent: '#10b981' }
};

export const ReportStyleConfigurator = ({ style, onStyleChange }: ReportStyleConfiguratorProps) => {
  const handleThemeChange = (theme: ReportStyle['theme']) => {
    onStyleChange({
      theme,
      customColors: THEMES[theme]
    });
  };

  const handleColorChange = (colorKey: keyof ReportStyle['customColors'], color: string) => {
    onStyleChange({
      ...style,
      customColors: {
        ...style.customColors,
        [colorKey]: color
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🎨 Customização Visual</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="mb-2 block">Tema</Label>
          <Select value={style.theme} onValueChange={handleThemeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="modern">🌟 Moderno</SelectItem>
              <SelectItem value="minimal">⚪ Minimalista</SelectItem>
              <SelectItem value="corporate">💼 Corporativo</SelectItem>
              <SelectItem value="vibrant">🎨 Vibrante</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-3 block">Cores Personalizadas</Label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs mb-2 block">Primária</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full h-10"
                    style={{ backgroundColor: style.customColors.primary }}
                  >
                    <span className="sr-only">Escolher cor primária</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                  <HexColorPicker 
                    color={style.customColors.primary}
                    onChange={(color) => handleColorChange('primary', color)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="text-xs mb-2 block">Secundária</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full h-10"
                    style={{ backgroundColor: style.customColors.secondary }}
                  >
                    <span className="sr-only">Escolher cor secundária</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                  <HexColorPicker 
                    color={style.customColors.secondary}
                    onChange={(color) => handleColorChange('secondary', color)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="text-xs mb-2 block">Destaque</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full h-10"
                    style={{ backgroundColor: style.customColors.accent }}
                  >
                    <span className="sr-only">Escolher cor de destaque</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                  <HexColorPicker 
                    color={style.customColors.accent}
                    onChange={(color) => handleColorChange('accent', color)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
