import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReportNameInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const ReportNameInput = ({ value, onChange }: ReportNameInputProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📝 Nome do Relatório
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="report-name">
            Escolha um nome descritivo para o relatório
          </Label>
          <Input
            id="report-name"
            placeholder="Ex: Relatório Mensal de Performance - Janeiro 2025"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="text-lg"
          />
          <p className="text-sm text-muted-foreground">
            Este nome será usado no cabeçalho dos arquivos exportados
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
