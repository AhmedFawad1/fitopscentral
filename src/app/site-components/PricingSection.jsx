'use client'

import { motion } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'
import Link from 'next/link'

const plans = [
  {
    name: 'Basic',
    price: '₨3,999',
    period: '/month',
    note: 'Offline only',
    description: 'Best for small gyms starting digitally',
    features: [
      'Desktop application',
      'Member & package management',
      'Attendance & payments',
      'Single system usage',
      'No cloud backup',
      'No web access',
    ],
    highlight: false,
  },
  {
    name: 'Premium',
    price: '₨9,999',
    period: '/month',
    note: 'Most Popular',
    description: 'Complete gym management with secure cloud access',
    features: [
      'Desktop + Web access',
      'Secure cloud database',
      'Automatic data backup',
      'Multi-user role-based access',
      'WhatsApp Reminders',
      'Analytics & growth dashboards',
      'Daily Sales Email'
    ],
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    note: 'For large gyms',
    description: 'Built for multi-branch & enterprise-level gyms',
    features: [
      'Everything in Premium',
      'Multi-branch management',
      'Centralized reporting',
      'Advanced permissions',
      'Priority onboarding & support',
    ],
    highlight: false,
  },
]

const addons = [
  {
    name: 'Biometric Attendance',
    price: '₨25,000',
    period: 'one-time',
    description: 'Fingerprint-based attendance for members & staff',
  },
  {
    name: 'Gate Control System',
    price: '₨35,000',
    period: 'one-time',
    description: 'Automated access control linked with active memberships',
  },
  {
    name: 'WhatsApp Automation',
    price: '₨4,999',
    period: '/month',
    description: 'Renewals, reminders, promotions & alerts',
  },
]

export default function PricingSection() {
  return (
    <section id='pricing' className="relative py-15 border-t border-[var(--border)] bg-background">
      <div className="max-w-7xl mx-auto px-6">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-4xl font-bold text-foreground">
            Transparent pricing. Real value. 🚀
          </h2>
          <p className="mt-4 text-lg text-muted">
            Choose a plan that fits your gym today — upgrade anytime as you grow.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="mt-24 grid gap-10 md:grid-cols-3 items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-3xl p-8 border transition shadow-sm
                ${plan.highlight
                  ? 'border-primary bg-primary/5 scale-[1.06] shadow-lg'
                  : 'border-border bg-card'
                }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 
                                px-4 py-1 rounded-full bg-[var(--primary)] text-white 
                                text-xs font-semibold flex items-center gap-1">
                  <Sparkles size={14} />
                  Most Popular
                </div>
              )}

              <h3 className="text-2xl font-semibold text-foreground">
                {plan.name}
              </h3>
              <p className="text-sm text-muted mt-1">{plan.note}</p>

              <div className="mt-6 flex items-end gap-1">
                <span className="text-4xl font-bold text-foreground">
                  {plan.price}
                </span>
                <span className="text-muted">{plan.period}</span>
              </div>

              <p className="mt-4 text-sm text-muted">
                {plan.description}
              </p>

              <ul className="mt-8 space-y-3">
                {plan.features.map(feature => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <Check size={16} className="text-primary mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={`block mt-10 text-center px-6 py-3 rounded-full 
                  font-semibold transition
                  ${plan.highlight
                    ? 'bg-primary text-white hover:bg-primary-hover'
                    : 'border border-border hover:bg-muted/10'
                  }`}
              >
                {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Add-ons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-28 max-w-5xl mx-auto"
        >
          <h3 className="text-3xl font-bold text-center text-foreground">
            Add-ons for advanced automation 🔐
          </h3>
          <p className="mt-3 text-center text-muted">
            Enhance security, access control, and communication — anytime.
          </p>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {addons.map(addon => (
              <div
                key={addon.name}
                className="rounded-2xl border border-border bg-card p-6 
                           shadow-sm hover:shadow-md transition"
              >
                <h4 className="text-lg font-semibold text-foreground">
                  {addon.name}
                </h4>

                <div className="mt-3 flex items-end gap-1">
                  <span className="text-2xl font-bold text-primary">
                    {addon.price}
                  </span>
                  <span className="text-sm text-muted">
                    {addon.period}
                  </span>
                </div>

                <p className="mt-3 text-sm text-muted">
                  {addon.description}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer note */}
        <p className="mt-20 text-center text-sm text-muted">
          All prices are exclusive of hardware & taxes · Dedicated local support available 🇵🇰
        </p>

      </div>
    </section>
  )
}
