import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { Check, Sparkles, Clock, Users, Gift, HeadphonesIcon, Crown } from "lucide-react";
import { useEarlyAccessSubmit } from "@/hooks/useEarlyAccessSubmit";
import { toast } from "@/hooks/use-toast";

const EarlyAccessPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    whatsapp: "",
    numSites: "",
    mainPain: "",
    acceptCommunication: true,
  });

  const submitMutation = useEarlyAccessSubmit();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.whatsapp || !formData.numSites || !formData.mainPain) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    // Capture UTM params
    const urlParams = new URLSearchParams(window.location.search);
    const utmParams = {
      utm_source: urlParams.get('utm_source'),
      utm_medium: urlParams.get('utm_medium'),
      utm_campaign: urlParams.get('utm_campaign'),
      utm_content: urlParams.get('utm_content'),
      utm_term: urlParams.get('utm_term'),
    };

    submitMutation.mutate({
      full_name: formData.fullName,
      email: formData.email,
      whatsapp: formData.whatsapp,
      num_sites: formData.numSites,
      main_pain: formData.mainPain,
      accept_communication: formData.acceptCommunication,
      utm_params: utmParams,
    });
  };

  const benefits = [
    {
      icon: Gift,
      title: "50% OFF Vitalício",
      description: "Enquanto mantiver assinatura",
    },
    {
      icon: HeadphonesIcon,
      title: "Setup Call Gratuita",
      description: "30min com especialista",
    },
    {
      icon: Sparkles,
      title: "Acesso Antecipado",
      description: "Novos recursos primeiro",
    },
    {
      icon: Crown,
      title: "Suporte Prioritário",
      description: "Primeiros 3 meses VIP",
    },
    {
      icon: Users,
      title: "Comunidade Exclusiva",
      description: "Grupo early adopters",
    },
    {
      icon: Clock,
      title: "Trial 14 Dias",
      description: "Sem cartão de crédito",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <nav className="border-b bg-white/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">R</span>
              </div>
              <span className="font-bold text-xl">Rankito CRM</span>
            </div>
            <Button variant="ghost" onClick={() => navigate('/')}>
              Voltar ao Site
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Left: Form */}
          <div>
            <div className="mb-8">
              <Badge className="bg-amber-500 text-white hover:bg-amber-600 mb-4 animate-pulse">
                🔥 Oferta Exclusiva - Primeiros 100
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Seja um dos Primeiros 100 Usuários
              </h1>
              <p className="text-xl text-muted-foreground">
                E ganhe <span className="font-bold text-blue-600">50% de desconto vitalício</span> + Setup Call Gratuita de 30 Minutos
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl p-8 shadow-xl border">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp *</Label>
                <PhoneInput
                  defaultCountry="br"
                  value={formData.whatsapp}
                  onChange={(phone) => setFormData({ ...formData, whatsapp: phone })}
                  inputClassName="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numSites">Quantos sites você gerencia? *</Label>
                <Select
                  value={formData.numSites}
                  onValueChange={(value) => setFormData({ ...formData, numSites: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma opção" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-5">1-5 sites</SelectItem>
                    <SelectItem value="6-10">6-10 sites</SelectItem>
                    <SelectItem value="11-20">11-20 sites</SelectItem>
                    <SelectItem value="21-50">21-50 sites</SelectItem>
                    <SelectItem value="50+">Mais de 50 sites</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mainPain">Qual seu maior desafio gerenciando sites? *</Label>
                <Textarea
                  id="mainPain"
                  value={formData.mainPain}
                  onChange={(e) => setFormData({ ...formData, mainPain: e.target.value })}
                  placeholder="Ex: Perco muito tempo criando relatórios manualmente, não consigo ver jornada do usuário..."
                  rows={4}
                  required
                />
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="accept"
                  checked={formData.acceptCommunication}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, acceptCommunication: !!checked })
                  }
                />
                <label
                  htmlFor="accept"
                  className="text-sm text-muted-foreground leading-tight cursor-pointer"
                >
                  Aceito receber comunicações sobre Rankito CRM e ofertas especiais
                </label>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-lg shadow-lg"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? "Garantindo Sua Vaga..." : "🚀 Garantir Minha Vaga Agora"}
              </Button>
            </form>
          </div>

          {/* Right: Benefits */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-xl border">
              <h3 className="text-2xl font-bold text-foreground mb-6">
                O Que Você Recebe:
              </h3>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{benefit.title}</p>
                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Social Proof */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 border-2 border-white flex items-center justify-center text-white font-bold"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Junte-se a <span className="font-bold text-blue-600">profissionais</span> que já garantiram vaga
              </p>
              <div className="flex items-center justify-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="text-yellow-400 text-xl">⭐</span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                4.9/5 baseado em feedback de beta testers
              </p>
            </div>

            {/* FAQ Quick */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border">
              <h4 className="font-bold text-foreground mb-4">Perguntas Frequentes:</h4>
              <div className="space-y-3 text-sm">
                <details className="cursor-pointer group">
                  <summary className="font-semibold text-foreground group-hover:text-blue-600">
                    Como funciona o desconto vitalício?
                  </summary>
                  <p className="text-muted-foreground mt-2 pl-4">
                    Você paga 50% do valor normal enquanto mantiver sua assinatura ativa. É um benefício permanente.
                  </p>
                </details>
                <details className="cursor-pointer group">
                  <summary className="font-semibold text-foreground group-hover:text-blue-600">
                    Quando posso começar a usar?
                  </summary>
                  <p className="text-muted-foreground mt-2 pl-4">
                    Você receberá acesso assim que o sistema for oficialmente lançado (próximas semanas).
                  </p>
                </details>
                <details className="cursor-pointer group">
                  <summary className="font-semibold text-foreground group-hover:text-blue-600">
                    O que acontece após as 100 vagas?
                  </summary>
                  <p className="text-muted-foreground mt-2 pl-4">
                    O desconto de 50% será reduzido ou encerrado. Garanta sua vaga agora!
                  </p>
                </details>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarlyAccessPage;