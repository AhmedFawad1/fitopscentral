import React from 'react'
import { motion } from 'framer-motion'
import { Lock, Mail } from 'lucide-react';
import Link from 'next/link';
import Logo from '../site-components/Logo';
export default function LoginUI({
    handleLogin,
    email,
    setEmail,
    password,
    setPassword,
    signingIn,
    error,
    loading 
}) {
  return loading ? (
    <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">

        {/* Spinner */}
        <div
            className="w-12 h-12 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin"
        />

        {/* Text */}
        <p className="text-sm text-muted tracking-wide">
            Checking session…
        </p>

        </div>
    </main>
    ) : (
    <main className="min-h-screen py-20 bg-background flex items-center justify-center px-6">
        <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-4xl rounded-3xl border border-[var(--border)]
                    bg-card shadow-lg overflow-hidden"
        >
        <div className="grid md:grid-cols-2">

            {/* LEFT */}
            <div className="hidden md:flex flex-col justify-center
                            bg-[var(--primary)]/5 px-10 py-12">
            <Logo width={70} height={70} usePrimary />
            <h1 className="mt-6 text-3xl font-bold text-foreground">
                Welcome back
            </h1>
            <p className="mt-3 text-muted">
                Log in to manage your gym smarter.
            </p>
            </div>

            {/* RIGHT */}
            <div className="px-8 py-10 sm:px-10">
            <h2 className="text-2xl font-bold text-foreground">
                Log in to your account
            </h2>

            <div className="mt-8 space-y-5" >
                <Input
                label="Email address"
                type="email"
                placeholder="you@gym.com"
                icon={<Mail size={18} />}
                onChange={(e) => setEmail(e.target.value)}
                />

                <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={<Lock size={18} />}
                onChange={(e) => setPassword(e.target.value)}
                />

                {error && (
                <p className="text-sm text-red-500">{error}</p>
                )}

                <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-muted">
                    <input
                    type="checkbox"
                    className="rounded border-[var(--border)] text-primary focus:ring-primary/40"
                    aria-label="Remember me"
                    />
                    Remember me
                </label>

                <Link href="/forgot-password" className="text-primary hover:underline">
                    Forgot password?
                </Link>
                </div>

                <button
                className="w-full mt-4 py-3 rounded-full bg-[var(--primary)]
                            text-white font-semibold text-lg
                            hover:bg-[var(--primary-hover)] transition
                            disabled:opacity-50"
                onClick={(e)=>{
                    handleLogin(e);
                }}
                >
                {signingIn ? "Logging in…" : "Log In"}
                </button>
            </div>

            <p className="mt-6 text-xs text-muted text-center">
                Secure login · Encrypted connection
            </p>
            </div>

        </div>
        </motion.div>
    </main>
    );

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
          aria-label={label}
          {...props}
          required
          spellCheck={false}
          onPaste={(e) => e.preventDefault()} // optional
          autoComplete='off'
          className="w-full rounded-xl border border-[var(--border)] 
                     pl-11 pr-4 py-3 text-sm text-foreground
                     focus:outline-none focus:ring-2 focus:ring-primary/40 autofill:!bg-yellow-500"
        />
      </div>
    </div>
  )
}
