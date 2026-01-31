'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

const stats = [
  { label: 'Gyms Onboarded', value: '250+' },
  { label: 'Active Members Managed', value: '120k+' },
  { label: 'WhatsApp Messages Sent', value: '2.4M+' },
  { label: 'Avg Renewal Increase', value: '38%' },
]

const testimonials = [
  {
    name: 'Ahasan Nasim',
    role: 'Owner',
    gym: 'Life Time Fitness Gym',
    location: 'Karachi',
    avatar: '/avatars/ahsan.jpg',
    logo: '/logos/life-time-fitness.png',
    verified: true,
    quote:
      'FitOpsCentral completely changed how we manage renewals. WhatsApp reminders alone recovered lost revenue.',
  },
  {
    name: 'Yousuf',
    role: 'Manager',
    gym: 'Fitness World',
    location: 'Karachi',
    avatar: '/avatars/yousuf.jpg',
    logo: '/logos/fitness-world.png',
    verified: true,
    quote:
      'Our staff saves hours every day. Admissions, payments, attendance — everything is finally in one place.',
  },
  {
    name: 'Naveed Najam',
    role: 'Owner',
    gym: 'Monster Gym',
    location: 'Karachi',
    avatar: '/avatars/naveed.jpg',
    logo: '/logos/monster-gym.png',
    verified: true,
    quote:
      'This feels like software built by someone who actually understands gyms. Clean, fast, and powerful.',
  },
  {
    name: 'Daud Khan',
    role: 'Owner',
    gym: 'Alpha Fitness',
    location: 'Karachi',
    avatar: '/avatars/daud.jpg',
    logo: '/logos/alpha-fitness.png',
    verified: true,
    quote:
      'FitOpsCentral has streamlined our entire operation. Managing everything is easier than ever.',
  },
]

export default function TrustBuilder() {
  return (
    <section className="relative py-10 bg-background overflow-hidden">
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
            Trusted by successful gym owners 🚀
          </h2>
          <p className="mt-4 text-muted text-lg">
            Real gyms. Real growth. Real results.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-4xl font-bold text-primary">{stat.value}</p>
              <p className="mt-2 text-sm text-muted">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Infinite Slider */}
      <div className="mt-20 relative">
        <motion.div
          className="flex gap-8 w-max px-6"
          animate={{ x: ['0%', '-50%'] }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: 'linear',
          }}
          whileHover={{ animationPlayState: 'paused' }}
        >
          {[...testimonials, ...testimonials].map((t, index) => (
            <div
              key={index}
              className="w-[320px] shrink-0 rounded-3xl border border-border bg-card p-6 shadow-sm"
            >
              {/* Logo */}
              <div className="flex items-center justify-between mb-4">
                <Image
                  src={t.logo}
                  alt={t.gym}
                  width={70}
                  height={28}
                  className="object-contain"
                />
                 {t.verified && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full 
                                    bg-primary/10 text-primary text-xs font-medium
                                    shadow-sm">
                    <CheckCircle2 size={14} />
                    Verified Gym
                    </div>
                )}
                <span className="text-xs text-muted">{t.location}</span>
              </div>

              {/* Quote */}
              <p className="text-sm text-foreground leading-relaxed">
                “{t.quote}”
              </p>

              {/* Profile */}
              <div className="mt-6 flex items-center gap-3">
                <Image
                  src={t.avatar}
                  alt={t.name}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {t.name}
                  </p>
                  <p className="text-xs text-muted">
                    {t.role}, {t.gym}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* CTA */}
      <div className="mt-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-2xl md:text-3xl font-bold text-foreground">
            Join successful gym owners today 💪
          </h3>
          <p className="mt-3 text-muted">
            Start managing your gym smarter — not harder.
          </p>

          <Link
            href="/signup"
            className="inline-block mt-8 px-8 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-hover transition"
          >
            Start Now — It’s Free
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
