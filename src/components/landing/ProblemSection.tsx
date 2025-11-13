import { X } from "lucide-react";
import { useLandingTranslation } from "@/hooks/useLandingTranslation";

export const ProblemSection = () => {
  const { t } = useLandingTranslation();

  return (
    <section className="py-16 bg-red-50 dark:bg-red-950/20">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold text-foreground">
            {t.problems.title}
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 text-left">
            {t.problems.items.map((problem, index) => (
              <div key={index} className="flex gap-3 items-start">
                <X className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
                <p className="text-lg text-foreground">{problem}</p>
              </div>
            ))}
          </div>
          
          <p className="text-xl font-semibold text-foreground pt-4">
            {t.problems.conclusion}
          </p>
        </div>
      </div>
    </section>
  );
};
