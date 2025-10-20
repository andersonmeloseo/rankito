import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { UserProfile } from '@/hooks/useUserProfile';

interface AppearanceTabProps {
  profile: UserProfile | undefined;
  onUpdate: (updates: Partial<UserProfile>) => void;
  isUpdating: boolean;
}

const timezones = [
  { value: 'America/Sao_Paulo', label: '(GMT-3) Brasília' },
  { value: 'America/Fortaleza', label: '(GMT-3) Fortaleza' },
  { value: 'America/Manaus', label: '(GMT-4) Manaus' },
  { value: 'America/Rio_Branco', label: '(GMT-5) Rio Branco' },
  { value: 'America/Noronha', label: '(GMT-2) Fernando de Noronha' },
  { value: 'America/New_York', label: '(GMT-5) Nova York' },
  { value: 'America/Los_Angeles', label: '(GMT-8) Los Angeles' },
  { value: 'Europe/London', label: '(GMT+0) Londres' },
  { value: 'Europe/Lisbon', label: '(GMT+0) Lisboa' },
  { value: 'Asia/Tokyo', label: '(GMT+9) Tóquio' },
];

export const AppearanceTab = ({ profile, onUpdate, isUpdating }: AppearanceTabProps) => {
  const [theme, setTheme] = useState(profile?.theme || 'light');
  const [timezone, setTimezone] = useState(profile?.timezone || 'America/Sao_Paulo');

  useEffect(() => {
    if (profile) {
      setTheme(profile.theme || 'light');
      setTimezone(profile.timezone || 'America/Sao_Paulo');
    }
  }, [profile]);

  const handleSave = () => {
    onUpdate({ theme, timezone });
  };

  const hasChanges = 
    theme !== (profile?.theme || 'light') ||
    timezone !== (profile?.timezone || 'America/Sao_Paulo');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Aparência</h1>
        <p className="text-muted-foreground mt-2">
          Personalize como o sistema aparece para você
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tema</CardTitle>
          <CardDescription>
            Escolha o tema visual do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={theme} onValueChange={setTheme}>
            <div className="flex items-center space-x-3 space-y-0">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="font-normal cursor-pointer">
                <div className="font-medium">Claro</div>
                <div className="text-sm text-muted-foreground">
                  Fundo claro, ideal para ambientes iluminados
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-3 space-y-0">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="font-normal cursor-pointer">
                <div className="font-medium">Escuro</div>
                <div className="text-sm text-muted-foreground">
                  Fundo escuro, reduz o cansaço visual
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-3 space-y-0">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system" className="font-normal cursor-pointer">
                <div className="font-medium">Sistema</div>
                <div className="text-sm text-muted-foreground">
                  Usar configuração do sistema operacional
                </div>
              </Label>
            </div>
          </RadioGroup>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              💡 O tema será aplicado na próxima sessão. Estamos trabalhando para implementar
              a troca de tema em tempo real.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fuso Horário</CardTitle>
          <CardDescription>
            Configure seu fuso horário para exibir datas e horários corretamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timezone">Fuso horário</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {hasChanges && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      )}
    </div>
  );
};
