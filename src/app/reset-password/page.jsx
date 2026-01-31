'use client'

import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/createClient'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // ✅ Ensure session exists
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/login')
      }
    })
  }, [router])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    router.push('/login')
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm"
      >
        <h1 className="text-2xl font-bold text-foreground">
          Set a new password
        </h1>

        <p className="mt-2 text-sm text-muted">
          Choose a strong password to secure your account.
        </p>

        <form onSubmit={handleUpdate} className="mt-8 space-y-5">
          <Input
            label="New password"
            type="password"
            placeholder="••••••••"
            icon={<Lock size={18} />}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Input
            label="Confirm password"
            type="password"
            placeholder="••••••••"
            icon={<Lock size={18} />}
            onChange={(e) => setConfirm(e.target.value)}
          />

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 rounded-full bg-[var(--primary)] 
                       text-white font-semibold text-lg
                       hover:bg-[var(--primary-hover)] transition
                       disabled:opacity-50"
          >
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted text-center">
          <Link href="/login" className="text-primary hover:underline">
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
          className="w-full rounded-xl border border-border bg-background 
                     pl-11 pr-4 py-3 text-sm text-foreground
                     focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>
    </div>
  )
}
