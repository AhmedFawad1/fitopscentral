'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sun, Moon } from 'lucide-react'
import Logo from './Logo'
import { usePathname } from 'next/navigation'
import { noNavbarPaths } from '../lib/functions'
import { useRuntime } from '@/hooks/useRuntime'

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'FAQs', href: '/#faqs' },
  { label: 'Blogs', href: '#blogs' },
]
const donotShowNavbarPaths = ['/login', '/register', '/app']
export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState('light')
  const { isTauri, isWeb, isReady } = useRuntime();
  const path = usePathname()
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-[var(--border-base)]"
      hidden={noNavbarPaths.includes(path)}
    >
      <nav className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Logo className="w-12 h-12" height={18} width={18}  usePrimary={true}/>
          <div className="leading-tight">
            <p className="text-lg font-semibold text-foreground">
              FitOpsCentral
            </p>
            <p className="text-xs text-muted">The Gym App</p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map(link => (
            <Link
              key={link.label}
              href={link.href}
              className={`text-sm md:text-[11pt] px-3 py-2 rounded-md font-medium ${path === link.href ? 'bg-[var(--primary)] text-white' : 'text-muted hover:bg-[var(--primary)] hover:text-white'} hover:text-primary transition-colors`}
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/app"
            className="px-3 py-1 border border-[var(--primary)] hover:bg-[var(--primary)] hover:text-white rounded-md bg-primary  text-sm md:text-base font-semibold hover:bg-primary-hover transition"
          >
            Login
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-full bg-muted/20 hover:bg-muted/40 transition "
          >
            {theme === 'light' ? <Moon size={18} style={
              {
                fill: '#f7ca00',
                stroke: '#f7ca00'
              }
            }  /> : <Sun size={18} />}
          </button>
        </div>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden text-foreground"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-background border-t border-[var(--border)]"
          >
            <div className="flex flex-col gap-5 px-6 py-6">
              {navLinks.map(link => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-muted text-sm hover:text-primary transition"
                >
                  {link.label}
                </Link>
              ))}

              <Link
                href="/login"
                className="mt-2 py-2 border border-[var(--primary)] hover:bg-[var(--primary)] text-center rounded-md bg-primary font-semibold"
              >
                Login
              </Link>

              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="flex items-center justify-center gap-2 mt-4 text-sm text-muted"
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                Toggle Theme
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
