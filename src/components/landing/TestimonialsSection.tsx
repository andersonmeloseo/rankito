import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Carlos Silva",
    role: "CEO, Agência Digital Pro",
    initials: "CS",
    text: "Rankito CRM mudou completamente como gerenciamos nosso portfólio de 30+ sites. A indexação automática no GSC economiza 8 horas por semana.",
    category: "Agência SEO",
  },
  {
    name: "Marina Santos",
    role: "Consultora SEO",
    initials: "MS",
    text: "Finalmente tenho controle financeiro total sobre meus projetos. O ROI automático e o portal whitelabel impressionam meus clientes.",
    category: "Consultora",
  },
  {
    name: "Ricardo Oliveira",
    role: "Head de Growth",
    initials: "RO",
    text: "A integração com Google Search Console é simplesmente incrível. Nenhuma outra plataforma oferece isso de forma tão profissional.",
    category: "Startup",
  },
  {
    name: "Juliana Costa",
    role: "Fundadora, LeadGen Brasil",
    initials: "JC",
    text: "O CRM integrado me ajudou a fechar 40% mais contratos. Não perco mais nenhum lead e o pipeline é cristalino.",
    category: "Agência Lead Gen",
  },
  {
    name: "Pedro Alves",
    role: "Especialista Rank & Rent",
    initials: "PA",
    text: "Gerencio 50 sites com facilidade. O tracking de conversões e os relatórios automáticos economizam dias de trabalho manual.",
    category: "Especialista",
  },
  {
    name: "Ana Paula",
    role: "Diretora de Marketing",
    initials: "AP",
    text: "O portal do cliente é perfeito. Meus clientes adoram a transparência e eu não preciso mais enviar relatórios manuais.",
    category: "Marketing",
  },
];

export const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-16 space-y-4">
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Depoimentos
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            O Que Nossos Clientes Dizem
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Profissionais de SEO que transformaram seus negócios com Rankito CRM
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
            >
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                    {testimonial.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>

              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              <p className="text-muted-foreground leading-relaxed mb-4">
                "{testimonial.text}"
              </p>

              <Badge variant="secondary" className="mt-auto">
                {testimonial.category}
              </Badge>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
