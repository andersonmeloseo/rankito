import { useState } from "react";
import { useGBPProfileEditor } from "@/hooks/useGBPProfileEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface GBPProfileEditorProps {
  profileId: string;
}

export const GBPProfileEditor = ({ profileId }: GBPProfileEditorProps) => {
  const { profile, isLoading, updateProfile, isUpdating } = useGBPProfileEditor(profileId);
  const [formData, setFormData] = useState<any>({});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
  };

  const getValue = (field: string) => {
    return formData[field] !== undefined ? formData[field] : profile?.[field] || '';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business_name">Nome do Negócio</Label>
            <Input
              id="business_name"
              value={getValue('business_name')}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              placeholder="Ex: Restaurante do João"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_description">Descrição</Label>
            <Textarea
              id="business_description"
              value={getValue('business_description')}
              onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
              placeholder="Descreva seu negócio..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_categories">Categorias (separadas por vírgula)</Label>
            <Input
              id="business_categories"
              value={Array.isArray(getValue('business_categories')) 
                ? getValue('business_categories').join(', ') 
                : ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                business_categories: e.target.value.split(',').map(s => s.trim()) 
              })}
              placeholder="Ex: Restaurante, Comida Italiana, Bar"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contato */}
      <Card>
        <CardHeader>
          <CardTitle>Contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business_phone">Telefone</Label>
              <Input
                id="business_phone"
                value={getValue('business_phone')}
                onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_email">Email</Label>
              <Input
                id="business_email"
                type="email"
                value={getValue('business_email')}
                onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                placeholder="contato@empresa.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_website">Website</Label>
            <Input
              id="business_website"
              value={getValue('business_website')}
              onChange={(e) => setFormData({ ...formData, business_website: e.target.value })}
              placeholder="https://www.seusite.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_address">Endereço Completo</Label>
            <Input
              id="business_address"
              value={getValue('business_address')}
              onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
              placeholder="Rua, Número, Bairro, Cidade, Estado"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={getValue('latitude')}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                placeholder="-23.550520"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={getValue('longitude')}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                placeholder="-46.633308"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isUpdating}>
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
