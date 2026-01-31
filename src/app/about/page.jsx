'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ShieldCheck, Users, BarChart3, Rocket } from 'lucide-react'

export default function AboutUs() {
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
            Built for gyms.  
            <span className="text-primary"> Powered by simplicity.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-lg text-muted max-w-3xl mx-auto"
          >
            FitOpsCentral is a modern gym management platform designed to help
            gym owners simplify operations, reduce admin work, and grow with confidence.
          </motion.p>
        </div>
      </section>

      {/* STORY */}
      <section className="py-24 border-t border-border">
        <div className="max-w-6xl mx-auto px-6 grid gap-14 lg:grid-cols-2 items-center">

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-foreground">
              Why we built FitOpsCentral
            </h2>

            <p className="mt-6 text-muted leading-relaxed">
              Managing a gym should not mean juggling registers, notebooks,
              WhatsApp messages, spreadsheets, and guesswork.
            </p>

            <p className="mt-4 text-muted leading-relaxed">
              We saw gym owners spending more time on admin than on members.
              FitOpsCentral was built to fix that — with software that actually
              understands how gyms work in the real world.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl border border-border bg-card p-8"
          >
            <ul className="space-y-5 text-muted">
              <li>✔ Designed for local & multi-branch gyms</li>
              <li>✔ Works offline & online</li>
              <li>✔ Built with scalability in mind</li>
              <li>✔ Trusted by real gym owners</li>
            </ul>
          </motion.div>

        </div>
      </section>

      {/* VALUES */}
      <section className="py-28 bg-muted/5">
        <div className="max-w-7xl mx-auto px-6">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              What we believe in
            </h2>
            <p className="mt-4 text-lg text-muted">
              Our values guide everything we build.
            </p>
          </motion.div>

          <div className="mt-20 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <ValueCard
              icon={<Users size={26} />}
              title="Gym-first thinking"
              text="Every feature is designed around how gyms actually operate."
            />
            <ValueCard
              icon={<ShieldCheck size={26} />}
              title="Data you can trust"
              text="Secure systems, role-based access, and reliable backups."
            />
            <ValueCard
              icon={<BarChart3 size={26} />}
              title="Growth-focused"
              text="Insights that help gym owners make better decisions."
            />
            <ValueCard
              icon={<Rocket size={26} />}
              title="Built to scale"
              text="From one branch to many — FitOpsCentral grows with you."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 border-t border-border">
        <div className="max-w-4xl mx-auto px-6 text-center">

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-foreground"
          >
            Let’s build a smarter gym together 💪
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-lg text-muted"
          >
            Whether you run a small studio or a multi-branch fitness business,
            FitOpsCentral is built to support your journey.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/signup"
              className="px-10 py-4 rounded-full bg-primary text-white 
                         font-semibold text-lg hover:bg-primary-hover transition"
            >
              Get Started Free
            </Link>

            <Link
              href="/contact"
              className="px-10 py-4 rounded-full border border-border 
                         font-semibold text-lg hover:bg-muted/10 transition"
            >
              Contact Us
            </Link>
          </motion.div>

        </div>
      </section>

    </main>
  )
}

function ValueCard({ icon, title, text }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl border border-border bg-card p-6 text-center"
    >
      <div className="w-12 h-12 mx-auto rounded-xl bg-primary/15 text-primary 
                      flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        {title}
      </h3>
      <p className="mt-3 text-sm text-muted">
        {text}
      </p>
    </motion.div>
  )
}
