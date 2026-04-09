import ParticleBackground from "@/components/landing/ParticleBackground";
import LandingHeader from "@/components/landing/LandingHeader";
import HeroSection from "@/components/landing/HeroSection";
import AudienceSection from "@/components/landing/AudienceSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturedPeptidesSection from "@/components/landing/FeaturedPeptidesSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PricingSection from "@/components/landing/PricingSection";
import FAQSection from "@/components/landing/FAQSection";
import FinalCTASection from "@/components/landing/FinalCTASection";

const Index = () => (
  <div className="relative min-h-screen">
    <ParticleBackground />
    <div className="relative z-10">
      <LandingHeader />
      <HeroSection />
      <AudienceSection />
      <FeaturesSection />
      <HowItWorksSection />
      <FeaturedPeptidesSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <FinalCTASection />
    </div>
  </div>
);

export default Index;
