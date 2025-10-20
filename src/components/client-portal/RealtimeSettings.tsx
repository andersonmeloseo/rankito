import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Volume2, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

interface RealtimeSettingsProps {
  onSettingsChange?: (settings: RealtimeSettings) => void;
}

export interface RealtimeSettings {
  realtimeEnabled: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  notifyOnPhone: boolean;
  notifyOnWhatsApp: boolean;
}

const DEFAULT_SETTINGS: RealtimeSettings = {
  realtimeEnabled: true,
  notificationsEnabled: true,
  soundEnabled: true,
  notifyOnPhone: true,
  notifyOnWhatsApp: true,
};

export const RealtimeSettingsComponent = ({ onSettingsChange }: RealtimeSettingsProps) => {
  const [settings, setSettings] = useState<RealtimeSettings>(() => {
    const saved = localStorage.getItem('realtime-settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('realtime-settings', JSON.stringify(settings));
    onSettingsChange?.(settings);
  }, [settings, onSettingsChange]);

  const updateSetting = (key: keyof RealtimeSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Configurações de Tempo Real
        </CardTitle>
        <CardDescription>
          Personalize como você recebe atualizações e notificações
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Realtime Enable */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="realtime-enabled" className="text-base">
              Atualizações em Tempo Real
            </Label>
            <p className="text-sm text-muted-foreground">
              Receber conversões instantaneamente
            </p>
          </div>
          <Switch
            id="realtime-enabled"
            checked={settings.realtimeEnabled}
            onCheckedChange={(checked) => updateSetting('realtimeEnabled', checked)}
          />
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <div>
              <Label htmlFor="notifications-enabled" className="text-base">
                Notificações
              </Label>
              <p className="text-sm text-muted-foreground">
                Mostrar alertas para conversões importantes
              </p>
            </div>
          </div>
          <Switch
            id="notifications-enabled"
            checked={settings.notificationsEnabled}
            onCheckedChange={(checked) => updateSetting('notificationsEnabled', checked)}
            disabled={!settings.realtimeEnabled}
          />
        </div>

        {/* Sound */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <Label htmlFor="sound-enabled" className="text-base">
                Som de Notificação
              </Label>
              <p className="text-sm text-muted-foreground">
                Reproduzir som ao receber conversão
              </p>
            </div>
          </div>
          <Switch
            id="sound-enabled"
            checked={settings.soundEnabled}
            onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
            disabled={!settings.notificationsEnabled || !settings.realtimeEnabled}
          />
        </div>

        {/* Notification Types */}
        <div className="space-y-4 pt-4 border-t">
          <Label className="text-base">Notificar para:</Label>
          
          <div className="flex items-center justify-between pl-4">
            <Label htmlFor="notify-phone" className="text-sm font-normal">
              Conversões de Telefone
            </Label>
            <Switch
              id="notify-phone"
              checked={settings.notifyOnPhone}
              onCheckedChange={(checked) => updateSetting('notifyOnPhone', checked)}
              disabled={!settings.notificationsEnabled || !settings.realtimeEnabled}
            />
          </div>

          <div className="flex items-center justify-between pl-4">
            <Label htmlFor="notify-whatsapp" className="text-sm font-normal">
              Conversões de WhatsApp
            </Label>
            <Switch
              id="notify-whatsapp"
              checked={settings.notifyOnWhatsApp}
              onCheckedChange={(checked) => updateSetting('notifyOnWhatsApp', checked)}
              disabled={!settings.notificationsEnabled || !settings.realtimeEnabled}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};