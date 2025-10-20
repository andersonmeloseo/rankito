import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UserProfile } from '@/hooks/useUserProfile';

interface NotificationsTabProps {
  profile: UserProfile | undefined;
  onUpdate: (updates: Partial<UserProfile>) => void;
  isUpdating: boolean;
}

export const NotificationsTab = ({ profile, onUpdate, isUpdating }: NotificationsTabProps) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    profile?.notifications_enabled ?? true
  );
  const [emailNotifications, setEmailNotifications] = useState(
    profile?.email_notifications ?? true
  );

  useEffect(() => {
    if (profile) {
      setNotificationsEnabled(profile.notifications_enabled ?? true);
      setEmailNotifications(profile.email_notifications ?? true);
    }
  }, [profile]);

  const handleSave = () => {
    onUpdate({
      notifications_enabled: notificationsEnabled,
      email_notifications: emailNotifications,
    });
  };

  const hasChanges =
    notificationsEnabled !== (profile?.notifications_enabled ?? true) ||
    emailNotifications !== (profile?.email_notifications ?? true);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
        <p className="text-muted-foreground mt-2">
          Escolha como você quer ser notificado sobre eventos importantes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notificações no Sistema</CardTitle>
          <CardDescription>
            Receba alertas e notificações dentro da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="system-notifications" className="text-base">
                Habilitar notificações
              </Label>
              <p className="text-sm text-muted-foreground">
                Receba alertas sobre atividades importantes no sistema
              </p>
            </div>
            <Switch
              id="system-notifications"
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notificações por Email</CardTitle>
          <CardDescription>
            Receba atualizações importantes por email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications" className="text-base">
                Habilitar emails
              </Label>
              <p className="text-sm text-muted-foreground">
                Receba notificações por email sobre eventos importantes
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          {emailNotifications && (
            <>
              <Separator />
              <div className="space-y-4">
                <p className="text-sm font-medium">Tipos de notificação por email:</p>
                <div className="space-y-3 pl-6">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-sm text-muted-foreground">
                      Novos clientes cadastrados
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-sm text-muted-foreground">
                      Pagamentos recebidos
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-sm text-muted-foreground">
                      Contratos próximos do vencimento
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-sm text-muted-foreground">
                      Relatórios semanais de performance
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-sm text-muted-foreground">
                      Atualizações do sistema
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Frequência</CardTitle>
          <CardDescription>
            Configure com que frequência deseja receber resumos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            📧 Você receberá um resumo semanal toda segunda-feira pela manhã com um resumo
            das atividades da semana anterior, desde que tenha as notificações por email habilitadas.
          </p>
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
