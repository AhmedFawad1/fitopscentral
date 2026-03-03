'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

export default function HomePage() {
  const { isTauri, isWeb, isReady, web } = useRuntime()
  const router = useRouter()

  // ✅ HOOK 1: auth error handler
  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return

    const params = new URLSearchParams(hash.substring(1))
    const error = params.get('error')
    const errorCode = params.get('error_code')

    if (error === 'access_denied') {
      router.replace(`/auth-error?code=${errorCode || 'unknown error'}`)
    }
  }, [router])

  // ✅ HOOK 2: tauri redirect
  useEffect(() => {
    if (!web) {
      window.location.href = '/app'
    }
  }, [isReady, isTauri])

  // ✅ NOW safe to return conditionally
  if (!web) return null

  return (
    <main className="bg-[var(--background)]">
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
