'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Sparkles, BarChart3, Users, MessageCircle } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      
      {/* Glow / Accent */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute top-40 -left-24 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6 py-28 grid lg:grid-cols-2 gap-16 items-center">

        {/* LEFT CONTENT */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles size={16} />
            Built for modern gyms
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold text-foreground leading-tight">
            Run your gyms <span className="text-primary">smarter</span>,  
            <br />
            not harder 💪
          </h1>

          {/* Subtext */}
          <p className="mt-6 text-lg text-muted max-w-xl">
            FitOpsCentral helps gym owners manage members, payments, trainers,
            attendance, WhatsApp reminders, and insights — all in one powerful dashboard.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-hover transition"
            >
              Get Started Free
              <ArrowRight size={18} />
            </Link>

            <Link
              href="#demo"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full border border-border text-foreground hover:bg-muted/10 transition"
            >
              Watch Demo
            </Link>
          </div>

          {/* Trust text */}
          <p className="mt-6 text-sm text-muted">
            No credit card required · Cancel anytime
          </p>
        </motion.div>

        {/* RIGHT VISUAL */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          className="relative"
        >
          <div className="relative rounded-3xl border border-border bg-card p-6 shadow-xl">

            {/* Fake dashboard preview */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon={<Users />}
                title="Active Members"
                value="1,248"
              />
              <StatCard
                icon={<BarChart3 />}
                title="Monthly Revenue"
                value="$18.6k"
              />
              <StatCard
                icon={<MessageCircle />}
                title="WhatsApp Alerts"
                value="Auto"
              />
              <StatCard
                icon={<Sparkles />}
                title="Renewals"
                value="Smart"
              />
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}

function StatCard({ icon, title, value }) {
  return (
    <div className="rounded-2xl bg-muted/10 p-4 flex flex-col gap-2">
      <div className="w-9 h-9 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
        {icon}
      </div>
      <p className="text-sm text-muted">{title}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}
