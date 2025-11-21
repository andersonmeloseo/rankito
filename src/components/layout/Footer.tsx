import { Mountain, Mail, Phone } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-black text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex items-center gap-2">
            <Mountain className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Rankito</span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">
            Desenvolvido para suprir necessidades reais de gestão de projetos Rank & Rent.
            Uma solução completa e inteligente para maximizar seus resultados.
          </p>
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
