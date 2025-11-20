import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Map, Settings, Search, FileText, Globe, Zap, CheckCircle2, AlertCircle } from 'lucide-react';

interface IndexingWorkflowGuideProps {
  currentTab: string;
  currentSubTab?: string;
  onNavigate: (tab: string, subTab?: string) => void;
  indexNowKey?: string;
  indexNowFileName?: string;
}

const steps = [
  {
    id: 1,
    icon: Settings,
    title: 'Configuração',
    description: 'Configure integração GSC',
    tab: 'config',
    badge: null,
  },
  {
    id: 2,
    icon: Search,
    title: 'Descobrir',
    description: 'Descobrir Páginas + Processar Sitemap',
    tab: 'indexing',
    badge: null,
  },
  {
    id: 3,
    icon: FileText,
    title: 'Enviar Sitemaps',
    description: 'Buscar → Selecionar → Enviar',
    tab: 'indexing',
    subTab: 'sitemaps',
    badge: null,
  },
  {
    id: 4,
    icon: Globe,
    title: 'Enviar URLs',
    description: 'Selecionar URLs (máx. 200/dia)',
    tab: 'indexing',
    subTab: 'urls',
    badge: { text: '200 URLs/dia', variant: 'warning' },
  },
  {
    id: 5,
    icon: Zap,
    title: 'IndexNow',
    description: 'Criar TXT → Validar → Enviar',
    tab: 'indexnow',
    badge: null,
  },
];

export const IndexingWorkflowGuide = ({ 
  currentTab, 
  currentSubTab, 
  onNavigate,
  indexNowKey,
  indexNowFileName 
}: IndexingWorkflowGuideProps) => {
  const getCurrentStep = () => {
    if (currentTab === 'config') return 1;
    if (currentTab === 'indexing' && currentSubTab === 'sitemaps') return 3;
    if (currentTab === 'indexing' && currentSubTab === 'urls') return 4;
    if (currentTab === 'indexing') return 2;
    if (currentTab === 'indexnow') return 5;
    return 1;
  };

  const currentStepIndex = getCurrentStep();

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-blue-200 dark:border-blue-800 mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Map className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Guia de Indexação: Passo a Passo
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stepper horizontal - Desktop */}
        <div className="hidden md:flex items-start justify-between gap-2">
          {steps.map((step, index) => {
            const isCompleted = index + 1 < currentStepIndex || (index + 1 === currentStepIndex && step.id === 5);
            const isCurrent = index + 1 === currentStepIndex;
            const isPending = index + 1 > currentStepIndex;
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex-1 flex items-center">
                <div 
                  className="flex flex-col items-center cursor-pointer group flex-1"
                  onClick={() => onNavigate(step.tab, step.subTab)}
                >
                  {/* Círculo com ícone/check */}
                  <div className={`
                    relative w-12 h-12 rounded-full flex items-center justify-center
                    transition-all duration-300
                    ${isCompleted ? 'bg-green-500 text-white shadow-lg' : ''}
                    ${isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-200 dark:ring-blue-800 animate-pulse' : ''}
                    ${isPending ? 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-400' : ''}
                    group-hover:scale-110 group-hover:shadow-lg
                  `}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>

                  {/* Título */}
                  <p className={`
                    mt-3 font-semibold text-sm text-center
                    ${isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-foreground'}
                  `}>
                    {step.title}
                  </p>

                  {/* Descrição */}
                  <p className="mt-1 text-xs text-muted-foreground text-center max-w-[120px]">
                    {step.description}
                  </p>

                  {/* Badge de alerta */}
                  {step.badge && isCurrent && (
                    <Badge variant="outline" className="mt-2 text-xs bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {step.badge.text}
                    </Badge>
                  )}

                  {/* Badge de status */}
                  <Badge 
                    variant={isCompleted ? 'default' : isCurrent ? 'secondary' : 'outline'}
                    className="mt-2 text-xs"
                  >
                    {isCompleted ? '✓ Concluído' : isCurrent ? 'Em andamento' : 'Pendente'}
                  </Badge>
                </div>

                {/* Linha conectora */}
                {index < steps.length - 1 && (
                  <div className="flex items-center justify-center -mt-16 px-2">
                    <div className={`
                      h-1 w-full rounded-full
                      ${isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}
                    `} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Stepper vertical - Mobile */}
        <div className="md:hidden space-y-4">
          {steps.map((step, index) => {
            const isCompleted = index + 1 < currentStepIndex || (index + 1 === currentStepIndex && step.id === 5);
            const isCurrent = index + 1 === currentStepIndex;
            const isPending = index + 1 > currentStepIndex;
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex items-start gap-4">
                {/* Linha vertical e círculo */}
                <div className="flex flex-col items-center">
                  <div 
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center cursor-pointer
                      transition-all duration-300
                      ${isCompleted ? 'bg-green-500 text-white' : ''}
                      ${isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-200 dark:ring-blue-800' : ''}
                      ${isPending ? 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-400' : ''}
                    `}
                    onClick={() => onNavigate(step.tab, step.subTab)}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      w-1 flex-1 min-h-[40px] rounded-full
                      ${isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}
                    `} />
                  )}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`
                      font-semibold text-sm
                      ${isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-foreground'}
                    `}>
                      {step.title}
                    </p>
                    <Badge 
                      variant={isCompleted ? 'default' : isCurrent ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {isCompleted ? '✓' : isCurrent ? '⋯' : '○'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                  {step.badge && isCurrent && (
                    <Badge variant="outline" className="mt-2 text-xs bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {step.badge.text}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Instruções detalhadas para IndexNow */}
        {currentStepIndex === 5 && indexNowKey && indexNowFileName && (
          <Alert className="mt-6 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-700">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertTitle className="text-yellow-800 dark:text-yellow-300">Instruções IndexNow</AlertTitle>
            <AlertDescription className="space-y-2 text-yellow-700 dark:text-yellow-400">
              <p>1. Crie um arquivo <code className="bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded font-mono text-xs">.txt</code> na raiz do seu site</p>
              <p>2. Nome do arquivo: <code className="bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded font-mono text-xs">{indexNowFileName}</code></p>
              <p>3. Conteúdo do arquivo: <code className="bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded font-mono text-xs break-all">{indexNowKey}</code></p>
              <p>4. Clique em "Validar Chave" na aba IndexNow abaixo</p>
              <p>5. Selecione todas as URLs e clique em "Enviar para IndexNow"</p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
