// components/Footer.tsx
'use client'
import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'
import Logo from './Logo'
import { usePathname } from 'next/navigation'
const donotShowNavbarPaths = ['/app', '/app/']
export default function Footer() {
  const path = usePathname()
  return (
    <footer hidden={donotShowNavbarPaths.includes(path)} className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-6 py-20">

        {/* Top Grid */}
        <div className="grid gap-12 md:grid-cols-4">

          {/* Brand */}
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

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-muted">
              <li><Link href="/#features">Features</Link></li>
              <li><Link href="/#pricing">Pricing</Link></li>
              <li><Link href="/#demo">Demo</Link></li>
              <li><Link href="/#faq">FAQs</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-muted">
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Get in touch</h4>
            <ul className="space-y-4 text-sm text-muted">
              <li className="flex items-center gap-2"><Mail size={16} /> support@fitopscentral.com</li>
              <li className="flex items-center gap-2"><Phone size={16} /> +92 332 8266209</li>
              <li className="flex items-center gap-2"><MapPin size={16} /> Karachi, Pakistan</li>
            </ul>
          </div>

        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t text-sm text-muted flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} FitOpsCentral. All rights reserved.</p>
          <p>Built for gyms that want to grow 🚀</p>
        </div>

      </div>
    </footer>
  )
}
