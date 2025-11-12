import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface ColorPickerProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
  suggestedColors?: string[];
}

export const ColorPicker = ({ 
  label, 
  color, 
  onChange,
  suggestedColors = ['#3b82f6', '#10b981', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b']
}: ColorPickerProps) => {
  const [tempColor, setTempColor] = useState(color);

  const handleColorChange = (newColor: string) => {
    setTempColor(newColor);
    onChange(newColor);
  };

  const isValidHex = (hex: string) => {
    return /^#[0-9A-F]{6}$/i.test(hex);
  };

  const handleHexInput = (value: string) => {
    const hex = value.startsWith('#') ? value : `#${value}`;
    setTempColor(hex);
    if (isValidHex(hex)) {
      onChange(hex);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-3 items-center">
        {/* Color Preview + Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-24 h-10 p-1"
              style={{ backgroundColor: color }}
            >
              <span className="sr-only">Escolher cor</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3">
            <HexColorPicker color={tempColor} onChange={handleColorChange} />
            
            {/* Suggested Colors */}
            {suggestedColors && suggestedColors.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-2">Cores sugeridas</p>
                <div className="grid grid-cols-6 gap-2">
                  {suggestedColors.map((suggestedColor) => (
                    <button
                      key={suggestedColor}
                      className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
                      style={{ 
                        backgroundColor: suggestedColor,
                        borderColor: suggestedColor === color ? '#000' : 'transparent'
                      }}
                      onClick={() => handleColorChange(suggestedColor)}
                    />
                  ))}
                </div>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* HEX Input */}
        <div className="flex-1">
          <Input
            value={tempColor}
            onChange={(e) => handleHexInput(e.target.value)}
            placeholder="#000000"
            className="font-mono uppercase"
            maxLength={7}
          />
        </div>
      </div>
    </div>
  );
};
