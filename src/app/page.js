'use client'
import FAQSection from './site-components/FAQSection'
import FeatureHighlights from './site-components/FeatureHighlights'
import FinalCTA from './site-components/FinalCTA'
import Hero from './site-components/Hero'
import HowItWorks from './site-components/HowItWorks'
import Navbar from './site-components/Navbar'
import PricingSection from './site-components/PricingSection'
import TrustBuilder from './site-components/TrustBuilder'
import VideoDemoModal from './site-components/VideoDemoModal'
import { useRuntime } from '../hooks/useRuntime'
const features = [
  { title: 'Member Management', desc: 'Admissions, renewals & attendance tracking.' },
  { title: 'Payments & Packages', desc: 'Flexible plans, receipts & balances.' },
  { title: 'Trainer Control', desc: 'Assign trainers & manage sessions.' },
  { title: 'Templates', desc: 'Custom receipts, SMS & WhatsApp.' },
  { title: 'Expenses & Reports', desc: 'Instant financial clarity.' },
  { title: 'Multi-Branch', desc: 'Scale from one gym to many.' },
] 
export default function HomePage() {
  const { isTauri, isWeb, isReady } = useRuntime();
  if (!isReady) return null;
  else if (isTauri) {
    window.location.href = "/app";
    return null;
  }
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
  )
}
