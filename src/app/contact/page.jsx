'use client'

import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Send } from 'lucide-react'

export default function ContactPage() {
  return (
    <main className="bg-background">

      {/* HERO */}
      <section className="py-28">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-foreground"
          >
            Let’s talk about your gym 💬
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-lg text-muted max-w-3xl mx-auto"
          >
            Have questions, need a demo, or want help choosing the right plan?
            We’re here to help.
          </motion.p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="pb-32">
        <div className="max-w-6xl mx-auto px-6 grid gap-16 lg:grid-cols-2 items-start">

          {/* CONTACT INFO */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-foreground">
              Get in touch
            </h2>

            <p className="mt-4 text-muted leading-relaxed">
              Whether you’re running a small gym or managing multiple branches,
              our team is ready to support you.
            </p>

            <div className="mt-8 space-y-6 text-muted">
              <div className="flex items-center gap-3">
                <Mail size={18} />
                <span>support@fitopscentral.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} />
                <span>+92 332 8266209</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={18} />
                <span>Karachi, Pakistan</span>
              </div>
            </div>

            <p className="mt-10 text-sm text-muted">
              ⏱️ Average response time: under 24 hours
            </p>
          </motion.div>

          {/* FORM */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl border border-border bg-card p-8 shadow-sm"
          >
            <h3 className="text-xl font-semibold text-foreground mb-6">
              Send us a message
            </h3>

            <form className="space-y-5">
              <Input label="Full name" placeholder="Your name" />
              <Input label="Email address" placeholder="you@example.com" type="email" />
              <Input label="Gym name" placeholder="Your gym or business name" />

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Message
                </label>
                <textarea
                  rows={4}
                  placeholder="Tell us a little about your gym or what you need help with..."
                  className="w-full rounded-xl border border-border bg-background 
                             px-4 py-3 text-sm text-foreground 
                             focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-4 inline-flex items-center justify-center gap-2
                           px-6 py-3 rounded-full bg-[var(--primary)] text-white 
                           font-semibold hover:bg-primary-hover transition"
              >
                Send Message
                <Send size={18} />
              </button>

              <p className="text-xs text-muted text-center mt-3">
                We’ll never share your information with anyone.
              </p>
            </form>
          </motion.div>

        </div>
      </section>

    </main>
  )
}

function Input({ label, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-background 
                   px-4 py-3 text-sm text-foreground 
                   focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
    </div>
  )
}
