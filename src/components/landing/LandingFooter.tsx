import { useLandingTranslation } from "@/hooks/useLandingTranslation";

export const LandingFooter = () => {
  const { t } = useLandingTranslation();

  return (
    <footer className="bg-muted border-t">
      <div className="container mx-auto px-6 lg:px-12 py-16">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">R</span>
            </div>
            <div>
              <div className="font-bold text-foreground text-xl">Rankito CRM</div>
              <div className="text-sm text-muted-foreground">Sistema de Gestão de Rank & Rent</div>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Desenvolvido para suprir necessidades reais de gestão de projetos Rank & Rent.
            Uma solução completa e inteligente para maximizar seus resultados.
          </p>
        </div>

        <div className="border-t mt-12 pt-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">R</span>
            </div>
            <div>
              <div className="font-bold text-foreground">Rankito CRM</div>
              <div className="text-sm text-muted-foreground">Sistema de Gestão de Rank & Rent</div>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Rankito CRM. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
};
