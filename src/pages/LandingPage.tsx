import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { GSCShowcase } from "@/components/landing/GSCShowcase";
import { PricingSection } from "@/components/landing/PricingSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">R</span>
              </div>
              <div className="font-bold text-xl text-foreground">
                Rankito CRM
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Funcionalidades
              </a>
              <a href="#gsc" className="text-muted-foreground hover:text-foreground transition-colors">
                Indexação GSC
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Preços
              </a>
              <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </a>
            </div>

            <div className="flex items-center gap-4">
              <Button 
                variant="ghost"
                onClick={() => navigate('/auth')}
              >
                Entrar
              </Button>
              <Button
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => navigate('/auth')}
              >
                Começar Grátis
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sections */}
      <HeroSection />
      
      <ProblemSection />
      
      <div id="features">
        <FeaturesSection />
      </div>
      
      <div id="gsc">
        <GSCShowcase />
      </div>
      
      <div id="pricing">
        <PricingSection />
      </div>
      
      <TestimonialsSection />
      
      <div id="faq">
        <FAQSection />
      </div>
      
      <CTASection />
      
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
