'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-32 bg-background">
      
      {/* Background glow */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 
                      w-[600px] h-[600px] bg-primary/20 
                      rounded-full blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-6 text-center">

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold text-foreground"
        >
          Ready to run your gym  
          <span className="text-primary"> smarter</span>? 💪
        </motion.h2>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 text-lg text-muted max-w-2xl mx-auto"
        >
          Join gym owners who’ve simplified operations, reduced admin work,
          and increased renewals — all from one powerful platform.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 
                       px-10 py-4 rounded-full 
                       bg-primary text-white font-semibold text-lg
                       hover:bg-primary-hover transition"
          >
            Start Free Today
            <ArrowRight size={20} />
          </Link>

          <Link
            href="/contact-sales"
            className="inline-flex items-center justify-center 
                       px-10 py-4 rounded-full 
                       border border-border text-foreground 
                       font-semibold text-lg
                       hover:bg-muted/10 transition"
          >
            Talk to Sales
          </Link>
        </motion.div>

        {/* Reassurance */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-sm text-muted"
        >
          No credit card required · Upgrade anytime · Local support available 🇵🇰
        </motion.p>

      </div>
    </section>
  )
}
