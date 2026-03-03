'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'
import Logo from './Logo'
import { noNavbarPaths } from '../lib/functions'

export default function Footer() {
  const isWeb = process.env.NEXT_PUBLIC_WEB === 'true'

  const [mounted, setMounted] = useState(false)
  const [hideFooter, setHideFooter] = useState(false)

  useEffect(() => {
    setMounted(true)
    const path = window.location.pathname
    console.log('Current path:', path, noNavbarPaths)  // Debugging line
    setHideFooter(noNavbarPaths.includes(path))
  }, [])

  if (!isWeb) return null
  if (!mounted) return null   // prevents hydration mismatch

  return (
    <footer
      hidden={hideFooter}
      className="border border-transparent border-t-[var(--border)] bg-background"
    >
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid gap-12 md:grid-cols-4">

          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                <Logo width={25} height={25} usePrimary />
              </div>
              <span className="text-lg font-semibold">
                FitOpsCentral
              </span>
            </div>

            <p className="mt-4 text-sm text-muted leading-relaxed">
              Smart gym management software built for modern fitness businesses.
              Simple, secure, and scalable.
            </p>
          </div>

          <div>
            <span className="font-semibold mb-4">Product</span>
            <ul className="space-y-3 text-sm text-muted">
              <li><Link href="/#features">Features</Link></li>
              <li><Link href="/#pricing">Pricing</Link></li>
              <li><Link href="/#demo">Demo</Link></li>
              <li><Link href="/#faq">FAQs</Link></li>
            </ul>
          </div>

          <div>
            <span className="font-semibold mb-4">Company</span>
            <ul className="space-y-3 text-sm text-muted">
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/terms">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
            </ul>
          </div>

          <div>
            <span className="font-semibold mb-4">Get in touch</span>
            <ul className="space-y-4 text-sm text-muted">
              <li className="flex items-center gap-2">
                <Mail size={16} /> support@fitopscentral.com
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} /> +92 332 8266209
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={16} /> Karachi, Pakistan
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-16 pt-8 border border-transparent border-t-[var(--border)] text-sm text-muted flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} FitOpsCentral. All rights reserved.</p>
          <p>Built for gyms that want to grow 🚀</p>
        </div>
      </div>
    </footer>
  )
}