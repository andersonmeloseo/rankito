import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";

export const CTASection = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="container mx-auto px-6 lg:px-12 relative">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
            Comece a Gerenciar Seu Império de Rank & Rent Hoje
          </h2>
          <p className="text-xl text-blue-100 leading-relaxed">
            Junte-se a centenas de profissionais de SEO que confiam no Rankito CRM
            para gerenciar seus portfólios com eficiência e profissionalismo
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 shadow-xl text-lg px-8 py-6"
              onClick={() => window.location.href = '/auth'}
            >
              Iniciar Trial Gratuito de 7 Dias
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
            <div className="flex items-center gap-2 text-white">
              <CheckCircle className="h-5 w-5" />
              <span>Não precisa cartão de crédito</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <CheckCircle className="h-5 w-5" />
              <span>Cancele quando quiser</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <CheckCircle className="h-5 w-5" />
              <span>Suporte dedicado</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
