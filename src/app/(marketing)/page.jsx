import FAQSection from "../site-components/FAQSection";
import FeatureHighlights from "../site-components/FeatureHighlights";
import FinalCTA from "../site-components/FinalCTA";
import Hero from "../site-components/Hero";
import HowItWorks from "../site-components/HowItWorks";
import PricingSection from "../site-components/PricingSection";
import TrustBuilder from "../site-components/TrustBuilder";
import VideoDemoModal from "../site-components/VideoDemoModal";

export default function HomePage() {
  return (
    <main className="bg-[var(--background)]">
          {/* HERO */}
          <Hero />
          <TrustBuilder />
          <HowItWorks />
          <FeatureHighlights />
          <VideoDemoModal />
          <PricingSection />
          <FAQSection />
          <FinalCTA />
    </main>
  );
}
