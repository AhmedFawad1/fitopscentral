'use client'

import { motion } from 'framer-motion'
import { MailCheck } from 'lucide-react'
import Link from 'next/link'

export default function ResetEmailSent() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md rounded-3xl border border-border bg-card 
                   p-8 shadow-sm text-center"
      >
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/15 
                        text-primary flex items-center justify-center">
          <MailCheck size={24} />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-foreground">
          Check your email
        </h1>

        <p className="mt-3 text-muted">
          We’ve sent a password reset link to your email address.
          Please check your inbox.
        </p>

        <Link
          href="/login"
          className="inline-block mt-8 px-8 py-3 rounded-full 
                     border border-border font-semibold
                     hover:bg-muted/10 transition"
        >
          Back to login
        </Link>

        <p className="mt-6 text-xs text-muted">
          Didn’t receive the email? Check spam or try again.
        </p>
      </motion.div>

    </main>
  )
}
