'use client'

import { motion } from 'framer-motion'
import {
  Building2,
  Users,
  MessageSquare,
  BarChart3,
} from 'lucide-react'

const steps = [
  {
    step: '01',
    title: 'Create your gym & branches',
    description:
      'Set up your gym, add branches, and assign staff roles in minutes.',
    icon: <Building2 size={28} />,
  },
  {
    step: '02',
    title: 'Add members, packages & trainers',
    description:
      'Manage admissions, memberships, trainers, and renewals effortlessly.',
    icon: <Users size={28} />,
  },
  {
    step: '03',
    title: 'Automate reminders & payments',
    description:
      'Send WhatsApp reminders, track payments, and reduce missed renewals.',
    icon: <MessageSquare size={28} />,
  },
  {
    step: '04',
    title: 'Track growth in real time',
    description:
      'Monitor revenue, attendance, and performance from one dashboard.',
    icon: <BarChart3 size={28} />,
  },
]

export default function HowItWorks() {
  return (
    <section className="relative border-t border-[var(--border)] py-10 bg-background">
      <div className="max-w-7xl mx-auto px-6">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Set up once. Run your gym on autopilot ⚡
          </h2>
          <p className="mt-4 text-lg text-muted">
            FitOpsCentral is designed to be simple, fast, and powerful —
            no technical skills required.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="mt-20 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative rounded-3xl border border-border bg-card p-6 
                         shadow-sm hover:shadow-md transition group"
            >
              {/* Step Number */}
              <span className="absolute top-4 right-4 text-sm font-semibold text-muted">
                {item.step}
              </span>

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl bg-primary/15 text-primary 
                           flex items-center justify-center mb-6
                           group-hover:scale-105 transition"
              >
                {item.icon}
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-3 text-sm text-muted leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-24 text-center"
        >
          <p className="text-muted mb-4">
            Most gyms are fully set up in under 15 minutes ⏱️
          </p>
          <a
            href="/signup"
            className="inline-block px-8 py-3 rounded-full bg-primary 
                       text-white font-semibold hover:bg-primary-hover transition"
          >
            Start Your Gym Setup
          </a>
        </motion.div>

      </div>
    </section>
  )
}
