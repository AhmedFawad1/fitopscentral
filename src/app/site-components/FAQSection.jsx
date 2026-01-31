'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'Is my gym data safe on FitOpsCentral?',
    answer:
      'Yes. Premium and Enterprise plans use secure cloud databases with regular backups and role-based access. Your data is encrypted and protected at all times.',
  },
  {
    question: 'Can I start with Basic and upgrade later?',
    answer:
      'Absolutely. You can upgrade from Basic to Premium or Enterprise at any time. Your data and setup can be migrated smoothly when you move to a cloud-enabled plan.',
  },
  {
    question: 'What happens if my internet is down?',
    answer:
      'The desktop application works offline. For Premium and Enterprise users, data automatically syncs once the internet is restored.',
  },
  {
    question: 'Do I need special hardware for biometric attendance or gate control?',
    answer:
      'Yes. Biometric and gate control features require compatible hardware devices, which can be purchased separately or integrated with existing systems.',
  },
  {
    question: 'Is WhatsApp automation included in all plans?',
    answer:
      'WhatsApp automation is available as an add-on and works best with Premium or Enterprise plans due to cloud synchronization and automation support.',
  },
  {
    question: 'How long does setup take?',
    answer:
      'Most gyms are fully set up within 15–30 minutes. Our team is available to help with onboarding if needed.',
  },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <section className="relative py-10 border-t border-[var(--border)] bg-background">
      <div className="max-w-4xl mx-auto px-6">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Frequently asked questions 🤔
          </h2>
          <p className="mt-4 text-lg text-muted">
            Everything you need to know before getting started.
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index

            return (
              <div
                key={faq.question}
                className="rounded-2xl border border-border bg-card"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between 
                             px-6 py-5 text-left"
                >
                  <span className="font-medium text-foreground">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`transition-transform text-muted
                      ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 text-sm text-muted leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
