import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { HexColorPicker } from "react-colorful";
import { chartThemes } from "@/lib/reports/chartThemes";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface ReportStyleConfiguratorProps {
  theme: string;
  customColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  onThemeChange: (theme: string) => void;
  onColorChange: (colorKey: string, value: string) => void;
}

export const ReportStyleConfigurator = ({
  theme,
  customColors,
  onThemeChange,
  onColorChange,
}: ReportStyleConfiguratorProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎨 Estilo Visual
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Temas Pré-definidos */}
        <div className="space-y-3">
          <Label>Tema</Label>
          <RadioGroup value={theme} onValueChange={onThemeChange}>
            {Object.entries(chartThemes).map(([key, themeData]) => (
              <div key={key} className="flex items-center space-x-2">
                <RadioGroupItem value={key} id={key} />
                <Label htmlFor={key} className="cursor-pointer">
                  {themeData.name}
                </Label>
                <div className="flex gap-1 ml-auto">
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: themeData.colors.primary }}
                  />
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: themeData.colors.secondary }}
                  />
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: themeData.colors.accent }}
                  />
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Cores Customizadas */}
        <div className="space-y-3">
          <Label>Cores Personalizadas</Label>
          <div className="grid grid-cols-3 gap-3">
            {/* Cor Primária */}
            <div>
              <Label className="text-xs mb-2 block">Primária</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-10"
                    style={{ backgroundColor: customColors.primary }}
                  >
                    <span className="sr-only">Escolher cor primária</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                  <HexColorPicker
                    color={customColors.primary}
                    onChange={(color) => onColorChange("primary", color)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Cor Secundária */}
            <div>
              <Label className="text-xs mb-2 block">Secundária</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-10"
                    style={{ backgroundColor: customColors.secondary }}
                  >
                    <span className="sr-only">Escolher cor secundária</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                  <HexColorPicker
                    color={customColors.secondary}
                    onChange={(color) => onColorChange("secondary", color)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Cor de Destaque */}
            <div>
              <Label className="text-xs mb-2 block">Destaque</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-10"
                    style={{ backgroundColor: customColors.accent }}
                  >
                    <span className="sr-only">Escolher cor de destaque</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                  <HexColorPicker
                    color={customColors.accent}
                    onChange={(color) => onColorChange("accent", color)}
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
