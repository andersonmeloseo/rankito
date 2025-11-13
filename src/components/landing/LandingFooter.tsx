import { Mail, ExternalLink } from "lucide-react";
import { useLandingTranslation } from "@/hooks/useLandingTranslation";

export const LandingFooter = () => {
  const { t } = useLandingTranslation();

  return (
    <footer className="bg-muted border-t">
      <div className="container mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Produto */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-foreground">Produto</h3>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Funcionalidades
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Planos e Preços
                </a>
              </li>
              <li>
                <a href="/auth" className="text-muted-foreground hover:text-foreground transition-colors">
                  Começar Agora
                </a>
              </li>
              <li>
                <a href="#gsc" className="text-muted-foreground hover:text-foreground transition-colors">
                  Integração GSC
                </a>
              </li>
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-foreground">Recursos</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Documentação
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Tutoriais
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-foreground">Empresa</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Sobre
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Termos de Uso
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contato
                </a>
              </li>
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-foreground">Suporte</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Central de Ajuda
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Status do Sistema
                </a>
              </li>
              <li>
                <a 
                  href="mailto:suporte@rankitocrm.com" 
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Mail className="h-4 w-4" />
                  Contato Comercial
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
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
