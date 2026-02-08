
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
  return (
    <section id='faqs' className="py-10 border border-transparent border-t-[var(--border)] border-b-[var(--border)] bg-background">
      <div className="max-w-4xl mx-auto px-6">

        {/* Heading */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">
            Frequently asked questions 🤔
          </h2>
          <p className="mt-4 text-lg text-muted">
            Everything you need to know before getting started.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl border border-[var(--border)] bg-card"
            >
              <summary
                className="
                  cursor-pointer list-none px-6 py-5
                  flex items-center justify-between
                  font-medium
                "
              >
                {faq.question}

                <span className="
                  transition-transform
                  group-open:rotate-180
                ">
                  <ChevronDown size={20} />
                </span>
              </summary>

              <div className="px-6 pb-5 text-sm text-muted leading-relaxed">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>

      </div>
    </section>
  )
}