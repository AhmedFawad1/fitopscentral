'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '../lib/createClient'
import { useRouter } from 'next/navigation'
import { containsDangerousChars, exceedsLength, isRateLimited, isValidEmail, sanitizeEmail, validateSafeInput } from '../utils/security'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleReset = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    // 🛑 Rate-limit spam clicks / bots
    if (isRateLimited()) {
        setError("Slow down bestie 🫣 try again in a sec.");
        return;
    }
    if (!validateSafeInput(email)) {
        setError("Invalid input detected.");
        return;
    }

    if (!email) {
        setError("Please enter your email.");
        setLoading(false);

        return;
    }

    // 🧼 SANITIZE EMAIL ONLY
    const cleanEmail = sanitizeEmail(email);

    // 🚨 BLOCK WEIRD INPUT
    if (
        cleanEmail === "" ||
        exceedsLength(cleanEmail, 254) 
    ) {
        setError("Invalid input.");
        setLoading(false);
        return;
    }

    // 🚨 XSS / Injection defense
    if (containsDangerousChars(cleanEmail)) {
        setError("Invalid email format.");
        setLoading(false);
        return;
    }

    // 🚨 Email structure validation
    if (!isValidEmail(cleanEmail)) {
        setError("Please enter a valid email.");
        setLoading(false);
        return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      setLoading(false);
      return
    }

    router.push('/reset-email-sent')
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-card p-8 shadow-sm"
      >
        <h1 className="text-2xl font-bold text-foreground">
          Reset your password
        </h1>

        <p className="mt-2 text-sm text-muted">
          Enter your email and we’ll send you a password reset link.
        </p>

        <div className="mt-8 space-y-5">
          <Input
            label="Email address"
            type="email"
            placeholder="you@gym.com"
            icon={<Mail size={18} />}
            onChange={(e) => setEmail(e.target.value)}
          />

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
          onClick={(e)=>{
            handleReset(e);
          }}
            disabled={loading}
            className="w-full mt-4 py-3 rounded-full bg-[var(--primary)] 
                       text-white font-semibold text-lg
                       hover:bg-[var(--primary-hover)] transition
                       disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </div>

        <p className="mt-6 text-sm text-muted text-center">
          Remember your password?{' '}
          <Link href="/app" className="text-primary hover:underline">
            Back to login
          </Link>
        </p>
      </motion.div>
    </main>
  )
}

function Input({ label, icon, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">
          {icon}
        </span>
        <input
          {...props}
          required
          className="w-full rounded-xl border border-[var(--border)] bg-background 
                     pl-11 pr-4 py-3 text-sm text-foreground
                     focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>
    </div>
  )
}
