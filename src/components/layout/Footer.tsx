import { Mountain, Mail, Phone } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-black text-white mt-32">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Coluna 1 - Logo e Descrição */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Mountain className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Rankito</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Desenvolvido para suprir necessidades reais de gestão de projetos Rank & Rent.
              Uma solução completa e inteligente para maximizar seus resultados.
            </p>
          </div>

          {/* Coluna 2 - Links Úteis */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Links Úteis</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="/dashboard" className="hover:text-primary transition-colors">
                  • Dashboard
                </a>
              </li>
              <li>
                <a href="/dashboard#sites" className="hover:text-primary transition-colors">
                  • Meus Sites
                </a>
              </li>
              <li>
                <a href="/dashboard#clients" className="hover:text-primary transition-colors">
                  • Clientes
                </a>
              </li>
              <li>
                <a href="/dashboard#financial" className="hover:text-primary transition-colors">
                  • Financeiro
                </a>
              </li>
            </ul>
          </div>

          {/* Coluna 3 - Contato */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contato</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2 hover:text-primary transition-colors">
                <Mail className="h-4 w-4" />
                <span>contato@goeverest.com.br</span>
              </li>
              <li className="flex items-center gap-2 hover:text-primary transition-colors">
                <Phone className="h-4 w-4" />
                <span>Suporte via WhatsApp</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-gray-800 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>
              © {new Date().getFullYear()} Rankito. Todos os direitos reservados.
            </p>
            <p className="flex items-center gap-2">
              Desenvolvido por{" "}
              <span className="font-semibold text-primary hover:text-primary/80 transition-colors">
                GO Everest Marketing
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
