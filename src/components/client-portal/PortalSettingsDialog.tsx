import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Palette, Type, Settings2, Loader2 } from 'lucide-react';
import { usePortalCustomization, PortalSettings, getDefaultPortalSettings } from '@/hooks/usePortalCustomization';
import { LogoUploader } from './LogoUploader';
import { ColorPicker } from './ColorPicker';
import { PortalPreviewCard } from './PortalPreviewCard';

interface PortalSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

export const PortalSettingsDialog = ({
  open,
  onOpenChange,
  clientId,
}: PortalSettingsDialogProps) => {
  const { settings, isLoading, updateSettings, uploadLogo, isUpdating, isUploading, isSuccess, resetMutation } = 
    usePortalCustomization(clientId);

  const [localSettings, setLocalSettings] = useState<PortalSettings>(getDefaultPortalSettings());
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (settings && open) {
      // Merge with defaults to ensure all properties exist
      setLocalSettings({
        branding: { ...getDefaultPortalSettings().branding, ...(settings.branding || {}) },
        texts: { ...getDefaultPortalSettings().texts, ...(settings.texts || {}) },
        features: { ...getDefaultPortalSettings().features, ...(settings.features || {}) },
      });
    }
  }, [settings, open]);

  // Reset to defaults when dialog closes
  useEffect(() => {
    if (!open) {
      setLocalSettings(getDefaultPortalSettings());
      setIsSaved(false);
      resetMutation();
    }
  }, [open, resetMutation]);

  // Track save success
  useEffect(() => {
    if (isSuccess) {
      setIsSaved(true);
    }
  }, [isSuccess]);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleSave = async () => {
    try {
      await updateSettings(localSettings);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    }
  };

  const handleLogoUpload = async (file: File) => {
    const publicUrl = await uploadLogo(file);
    setLocalSettings({
      ...localSettings,
      branding: {
        ...localSettings.branding,
        logo_url: publicUrl,
      },
    });
    return publicUrl;
  };

  const handleLogoRemove = () => {
    setLocalSettings({
      ...localSettings,
      branding: {
        ...localSettings.branding,
        logo_url: null,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customizar Portal do Cliente</DialogTitle>
          <DialogDescription>
            Personalize a aparência, textos e funcionalidades do portal analítico
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Settings Form - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="appearance" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="appearance" className="gap-2">
                  <Palette className="h-4 w-4" />
                  Aparência
                </TabsTrigger>
                <TabsTrigger value="texts" className="gap-2">
                  <Type className="h-4 w-4" />
                  Textos
                </TabsTrigger>
                <TabsTrigger value="features" className="gap-2">
                  <Settings2 className="h-4 w-4" />
                  Funcionalidades
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Aparência */}
              <TabsContent value="appearance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Logo e Marca</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <LogoUploader
                      currentLogoUrl={localSettings.branding.logo_url}
                      onUpload={handleLogoUpload}
                      onRemove={handleLogoRemove}
                      isUploading={isUploading}
                    />

                    <div className="space-y-4">
                      <div>
                        <Label>Nome da Empresa</Label>
                        <Input
                          value={localSettings.branding.company_name}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              branding: {
                                ...localSettings.branding,
                                company_name: e.target.value,
                              },
                            })
                          }
                          placeholder="Ex: Minha Empresa LTDA"
                        />
                      </div>

                      <div>
                        <Label>Tagline (opcional)</Label>
                        <Input
                          value={localSettings.branding.tagline}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              branding: {
                                ...localSettings.branding,
                                tagline: e.target.value,
                              },
                            })
                          }
                          placeholder="Ex: Seu parceiro em SEO"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Cores do Portal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ColorPicker
                      label="Cor Primária"
                      color={localSettings.branding.primary_color}
                      onChange={(color) =>
                        setLocalSettings({
                          ...localSettings,
                          branding: {
                            ...localSettings.branding,
                            primary_color: color,
                          },
                        })
                      }
                    />

                    <ColorPicker
                      label="Cor Secundária"
                      color={localSettings.branding.secondary_color}
                      onChange={(color) =>
                        setLocalSettings({
                          ...localSettings,
                          branding: {
                            ...localSettings.branding,
                            secondary_color: color,
                          },
                        })
                      }
                    />

                    <ColorPicker
                      label="Cor de Destaque (Botões)"
                      color={localSettings.branding.accent_color}
                      onChange={(color) =>
                        setLocalSettings({
                          ...localSettings,
                          branding: {
                            ...localSettings.branding,
                            accent_color: color,
                          },
                        })
                      }
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 2: Textos */}
              <TabsContent value="texts" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Textos do Portal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Título de Boas-Vindas</Label>
                      <Input
                        value={localSettings.texts.welcome_title}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            texts: {
                              ...localSettings.texts,
                              welcome_title: e.target.value,
                            },
                          })
                        }
                        placeholder="Ex: Bem-vindo ao seu Portal de Analytics"
                      />
                    </div>

                    <div>
                      <Label>Descrição de Boas-Vindas</Label>
                      <Textarea
                        value={localSettings.texts.welcome_description}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            texts: {
                              ...localSettings.texts,
                              welcome_description: e.target.value,
                            },
                          })
                        }
                        placeholder="Ex: Acompanhe o desempenho dos seus sites em tempo real"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Texto do Rodapé</Label>
                      <Input
                        value={localSettings.texts.footer_text}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            texts: {
                              ...localSettings.texts,
                              footer_text: e.target.value,
                            },
                          })
                        }
                        placeholder="Ex: © 2025 Minha Empresa. Todos os direitos reservados."
                      />
                    </div>

                    <div>
                      <Label>Email de Suporte (opcional)</Label>
                      <Input
                        type="email"
                        value={localSettings.texts.support_email}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            texts: {
                              ...localSettings.texts,
                              support_email: e.target.value,
                            },
                          })
                        }
                        placeholder="suporte@empresa.com"
                      />
                    </div>

                    <div>
                      <Label>Telefone de Suporte (opcional)</Label>
                      <Input
                        value={localSettings.texts.support_phone}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            texts: {
                              ...localSettings.texts,
                              support_phone: e.target.value,
                            },
                          })
                        }
                        placeholder="+55 11 99999-9999"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 3: Funcionalidades */}
              <TabsContent value="features" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Funcionalidades Visíveis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Dashboard Financeiro</p>
                        <p className="text-sm text-muted-foreground">
                          Mostrar seção com dados financeiros e pagamentos
                        </p>
                      </div>
                      <Switch
                        checked={localSettings.features.show_financial}
                        onCheckedChange={(checked) =>
                          setLocalSettings({
                            ...localSettings,
                            features: {
                              ...localSettings.features,
                              show_financial: checked,
                            },
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Relatórios Salvos</p>
                        <p className="text-sm text-muted-foreground">
                          Permitir acesso aos relatórios salvos
                        </p>
                      </div>
                      <Switch
                        checked={localSettings.features.show_reports}
                        onCheckedChange={(checked) =>
                          setLocalSettings({
                            ...localSettings,
                            features: {
                              ...localSettings.features,
                              show_reports: checked,
                            },
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Exportação de Dados</p>
                        <p className="text-sm text-muted-foreground">
                          Habilitar botões de exportar dados e relatórios
                        </p>
                      </div>
                      <Switch
                        checked={localSettings.features.enable_export}
                        onCheckedChange={(checked) =>
                          setLocalSettings({
                            ...localSettings,
                            features: {
                              ...localSettings.features,
                              enable_export: checked,
                            },
                          })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview - 1 column */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <PortalPreviewCard settings={localSettings} />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          {!isSaved ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Configurações'
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Fechar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
