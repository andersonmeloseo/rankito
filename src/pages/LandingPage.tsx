import { useState } from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { CommunicationPillarsSection } from "@/components/landing/CommunicationPillarsSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { WhoIsItForSection } from "@/components/landing/WhoIsItForSection";
import { GSCShowcase } from "@/components/landing/GSCShowcase";
import { EcommerceShowcase } from "@/components/landing/EcommerceShowcase";
import { UserJourneyShowcase } from "@/components/landing/UserJourneyShowcase";
import { ROICalculator } from "@/components/landing/ROICalculator";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLandingTranslation } from "@/hooks/useLandingTranslation";
import { LandingLanguageProvider } from "@/contexts/LandingLanguageContext";
import { supabase } from "@/integrations/supabase/client";

const LandingPageContent = () => {
  const navigate = useNavigate();
  const { t, locale, setLocale, isTransitioning } = useLandingTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Redirecionamento temporariamente desabilitado para edição
  // useEffect(() => {
  //   const checkAuthAndRedirect = async () => {
  //     const { data: { session } } = await supabase.auth.getSession();
  //     if (session && window.location.pathname === '/') {
  //       navigate('/dashboard', { replace: true });
  //     }
  //   };
  //   checkAuthAndRedirect();
  // }, [navigate]);

  return (
    <div 
      className="min-h-screen bg-background transition-opacity duration-200"
      style={{ opacity: isTransitioning ? 0 : 1 }}
    >
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
                {t.nav.features}
              </a>
              <a href="#gsc" className="text-muted-foreground hover:text-foreground transition-colors">
                {t.nav.gsc}
              </a>
              <a href="#ecommerce" className="text-muted-foreground hover:text-foreground transition-colors">
                E-commerce
              </a>
              <a href="#user-journey" className="text-muted-foreground hover:text-foreground transition-colors">
                Jornada do Usuário
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                {t.nav.pricing}
              </a>
              <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">
                {t.nav.faq}
              </a>
            </div>

            <div className="flex items-center gap-4">
              <LanguageSwitcher locale={locale} setLocale={setLocale} />
              <Button 
                variant="ghost"
                onClick={() => navigate('/auth')}
                className="hidden md:inline-flex"
              >
                {t.nav.login}
              </Button>
              <Button
                className="hidden md:inline-flex bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => navigate('/auth')}
              >
                {t.nav.startFree}
              </Button>
              
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sections */}
      <HeroSection />
      
      <CommunicationPillarsSection />
      
      <ProblemSection />
      
      <div id="features">
        <FeaturesSection />
      </div>
      
      <WhoIsItForSection />
      
      <div id="gsc">
        <GSCShowcase />
      </div>
      
      <div id="ecommerce">
        <EcommerceShowcase />
      </div>
      
      <div id="user-journey">
        <UserJourneyShowcase />
      </div>
      
      <ROICalculator />
      
      <ComparisonSection />
      
      <div id="pricing">
        <PricingSection />
      </div>
      
      <TestimonialsSection />
      
      <div id="faq">
        <FAQSection />
      </div>
      
      <CTASection />
      
      <LandingFooter />
      
      {/* Mobile Navigation Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-[300px]">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-6 mt-8">
            <a 
              href="#features" 
              className="text-lg text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t.nav.features}
            </a>
            <a 
              href="#gsc" 
              className="text-lg text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t.nav.gsc}
            </a>
            <a 
              href="#ecommerce" 
              className="text-lg text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              E-commerce
            </a>
            <a 
              href="#user-journey" 
              className="text-lg text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Jornada do Usuário
            </a>
            <a 
              href="#pricing" 
              className="text-lg text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t.nav.pricing}
            </a>
            <a 
              href="#faq" 
              className="text-lg text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t.nav.faq}
            </a>
            
            <div className="flex flex-col gap-3 mt-4 pt-6 border-t">
              <Button 
                variant="outline"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/auth');
                }}
                className="w-full"
              >
                {t.nav.login}
              </Button>
              <Button
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/auth');
                }}
              >
                {t.nav.startFree}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

const LandingPage = () => {
  return (
    <LandingLanguageProvider>
      <LandingPageContent />
    </LandingLanguageProvider>
  );
};

export default LandingPage;
