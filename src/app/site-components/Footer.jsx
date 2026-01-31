'use client'

import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'
import Logo from './Logo'
import { noNavbarPaths } from '../lib/functions'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const path = usePathname()
  return (
    <footer className="border-t border-border bg-background"
      hidden={noNavbarPaths.includes(path)}
    >
      <div className="max-w-7xl mx-auto px-6 py-20">

        {/* Top Grid */}
        <div className="grid gap-12 md:grid-cols-4">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-lg">
                <Logo width={25} height={25} usePrimary={true}/>
              </div>
              <span className="text-lg font-semibold text-foreground">
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
            <h4 className="font-semibold text-foreground mb-4">
              Product
            </h4>
            <ul className="space-y-3 text-sm text-muted">
              <li><Link href="#features" className="hover:text-primary transition">Features</Link></li>
              <li><Link href="#pricing" className="hover:text-primary transition">Pricing</Link></li>
              <li><Link href="#demo" className="hover:text-primary transition">Demo</Link></li>
              <li><Link href="#faq" className="hover:text-primary transition">FAQs</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">
              Company
            </h4>
            <ul className="space-y-3 text-sm text-muted">
              <li><Link href="/about" className="hover:text-primary transition">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">
              Get in touch
            </h4>

            <ul className="space-y-4 text-sm text-muted">
              <li className="flex items-center gap-2">
                <Mail size={16} />
                support@fitopscentral.com
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} />
                +92 332 8266209
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={16} />
                Karachi, Pakistan
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row 
                        items-center justify-between gap-4 text-sm text-muted">
          <p>
            © {new Date().getFullYear()} FitOpsCentral. All rights reserved.
          </p>
          <p>
            Built for gyms that want to grow 🚀
          </p>
        </div>

      </div>
    </footer>
  )
}
