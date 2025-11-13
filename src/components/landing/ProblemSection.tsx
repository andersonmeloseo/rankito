import { X } from "lucide-react";

export const ProblemSection = () => {
  const problems = [
    "Sites parados sem saber quais estão convertendo",
    "Páginas criadas mas não indexadas pelo Google",
    "Horas perdidas em planilhas desorganizadas",
    "Cliente pede relatório e você não tem dados",
    "Leads ligam e você anota no papel",
    "Sem saber o ROI real de cada projeto"
  ];

  return (
    <section className="py-16 bg-red-50 dark:bg-red-950/20">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold text-foreground">
            Reconhece Esses Problemas?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 text-left">
            {problems.map((problem, index) => (
              <div key={index} className="flex gap-3 items-start">
                <X className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
                <p className="text-lg text-foreground">{problem}</p>
              </div>
            ))}
          </div>
          
          <p className="text-xl font-semibold text-foreground pt-4">
            👉 O Rankito CRM resolve TODOS esses problemas em uma única plataforma.
          </p>
        </div>
      </div>
    </section>
  );
};
