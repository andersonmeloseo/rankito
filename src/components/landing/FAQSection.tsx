import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const faqs = [
  {
    question: "Como funciona o trial gratuito?",
    answer: "Você pode testar qualquer plano gratuitamente pelo período de trial indicado (7 a 30 dias dependendo do plano). Não é necessário cartão de crédito para começar. Ao final do trial, você decide se quer continuar com a assinatura paga."
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer: "Sim, você pode cancelar sua assinatura a qualquer momento sem perguntas ou taxas adicionais. O acesso continuará até o fim do período pago. Não há contratos de longo prazo ou multas por cancelamento."
  },
  {
    question: "Quantas integrações GSC posso ter?",
    answer: "Depende do seu plano: Starter e Professional permitem 1 integração GSC, enquanto o plano Enterprise oferece integrações ilimitadas. Você pode conectar múltiplas contas Google Search Console para agregar a quota de indexação (200 URLs/dia por conta)."
  },
  {
    question: "O portal do cliente é whitelabel?",
    answer: "Sim! Você pode personalizar completamente o portal com sua logo, cores da marca e informações de contato. Seus clientes verão apenas sua identidade visual, sem qualquer menção ao Rankito CRM. É perfeito para agências que querem manter sua marca."
  },
  {
    question: "Vocês têm integração com WordPress?",
    answer: "Sim, oferecemos dois plugins WordPress: o Rankito LeadGen para captura de leads através de formulários customizáveis, e o Rank & Rent Tracker para rastreamento de conversões via tracking pixel. Ambos se integram automaticamente com o CRM."
  },
  {
    question: "Como funciona o tracking de conversões?",
    answer: "Você instala um tracking pixel no seu site WordPress ou adiciona manualmente em qualquer site. O sistema rastreia automaticamente page views, cliques em botões, telefone, WhatsApp e emails. Todas as conversões aparecem em tempo real no dashboard com dados completos de origem e comportamento."
  },
  {
    question: "Posso gerenciar múltiplos clientes?",
    answer: "Sim, o sistema foi criado especialmente para isso. Você pode gerenciar quantos clientes quiser, cada um com seus próprios portais personalizados, contratos, sites e métricas separadas. Ideal para agências e profissionais que gerenciam portfólios de sites."
  },
  {
    question: "Há limite de conversões rastreadas?",
    answer: "Não há limite de conversões rastreadas. Você pode capturar quantas conversões quiser, independente do plano escolhido. Os limites aplicam-se apenas ao número de sites e páginas gerenciadas, não aos eventos rastreados."
  }
];

export const FAQSection = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-6 lg:px-12 max-w-4xl">
        <div className="text-center mb-16 space-y-4">
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Perguntas Frequentes
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            Tire Suas Dúvidas
          </h2>
          <p className="text-xl text-muted-foreground">
            Tudo que você precisa saber sobre o Rankito CRM
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-background border rounded-lg px-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline py-6">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
