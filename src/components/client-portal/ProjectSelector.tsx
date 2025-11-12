import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, TrendingUp, DollarSign, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Project {
  id: string;
  site_name: string;
  site_url: string;
  monthly_rent_value: number;
  niche: string;
  location: string;
  is_rented: boolean;
}

interface ProjectSelectorProps {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
}

export const ProjectSelector = ({ projects, onSelectProject }: ProjectSelectorProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-6xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Seus Projetos</h1>
          <p className="text-muted-foreground text-lg">
            Você tem {projects.length} projeto{projects.length > 1 ? 's' : ''} ativo{projects.length > 1 ? 's' : ''}. Selecione um para visualizar os detalhes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card 
              key={project.id} 
              className="bg-card border border-border hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
              onClick={() => onSelectProject(project.id)}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant={project.is_rented ? 'default' : 'secondary'} className="text-xs">
                      {project.is_rented ? 'Ativo' : 'Disponível'}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {project.site_name}
                </CardTitle>
                <CardDescription className="flex items-center gap-1 text-sm">
                  <ExternalLink className="h-3 w-3" />
                  {new URL(project.site_url).hostname}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Nicho</span>
                    <span className="font-medium text-foreground">{project.niche || 'Não especificado'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Localização</span>
                    <span className="font-medium text-foreground">{project.location || 'Não especificada'}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Valor Mensal
                    </span>
                    <span className="font-bold text-lg text-primary">
                      R$ {project.monthly_rent_value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                <Button 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  variant="outline"
                  onClick={() => onSelectProject(project.id)}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Ver Analytics
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
