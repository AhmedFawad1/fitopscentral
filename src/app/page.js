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
import HashScrollFix from './site-components/HashScrollFix'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
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
   const router = useRouter();
  if (!isReady) return null;
  else if (isTauri) {
    window.location.href = "/app";
    return null;
  }
  useEffect(() => {
    const hash = window.location.hash;

    if (!hash) return;

    const params = new URLSearchParams(hash.substring(1));
    const error = params.get('error');
    const errorCode = params.get('error_code');

    if (error === 'access_denied') {
      router.replace(
        `/auth-error?code=${errorCode || 'unknown'}`
      );
    }
  }, [router])
  return (
    <main className="bg-[var(--background)]">
      {/* HERO */}
      <HashScrollFix />
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
