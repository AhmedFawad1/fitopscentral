
'use client'
import { motion } from 'framer-motion'
import {
  Users,
  CreditCard,
  CalendarCheck,
  MessageCircle,
  BarChart3,
  ShieldCheck,
} from 'lucide-react'

const features = [
  {
    title: 'Never miss a renewal again',
    description:
      'Automatic WhatsApp reminders and payment tracking ensure members renew on time — every time.',
    icon: <CalendarCheck size={28} />,
  },
  {
    title: 'Get paid faster & stay organized',
    description:
      'Track fees, discounts, and outstanding balances with crystal-clear payment records.',
    icon: <CreditCard size={28} />,
  },
  {
    title: 'Know exactly who is attending',
    description:
      'Attendance tracking helps you understand engagement and trainer performance instantly.',
    icon: <Users size={28} />,
  },
  {
    title: 'Communicate with members effortlessly',
    description:
      'Send announcements, promotions, and reminders directly to members via WhatsApp.',
    icon: <MessageCircle size={28} />,
  },
  {
    title: 'Make decisions with real data',
    description:
      'Visual dashboards show revenue trends, growth, and performance at a glance.',
    icon: <BarChart3 size={28} />,
  },
  {
    title: 'Built for security & reliability',
    description:
      'Role-based access and secure data handling keep your gym operations protected.',
    icon: <ShieldCheck size={28} />,
  },
]

export default function FeatureHighlights() {
  return (
    <section id='features' className="relative py-10 border-t border-[var(--border)] bg-background">
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
            Everything your gym needs — minus the chaos 💥
          </h2>
          <p className="mt-4 text-lg text-muted">
            FitOpsCentral is designed to save time, increase revenue, and give you
            full control of your gym.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="mt-20 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="group rounded-3xl border border-border bg-card p-6 
                         shadow-sm hover:shadow-md transition"
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl bg-primary/15 text-primary 
                           flex items-center justify-center mb-6
                           group-hover:scale-110 transition"
              >
                {feature.icon}
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm text-muted leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-24 text-center"
        >
          <p className="text-muted mb-4">
            Less admin work. More time to grow your gym.
          </p>
          <a
            href="/signup"
            className="inline-block px-8 py-3 rounded-full bg-primary 
                       text-white font-semibold hover:bg-primary-hover transition"
          >
            Start Free — No Credit Card
          </a>
        </motion.div>

      </div>
    </section>
  )
}
