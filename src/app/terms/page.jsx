'use client'

import { motion } from 'framer-motion'

export default function TermsPage() {
  return (
    <main className="bg-background">
      <section className="py-10">
        <div className="max-w-4xl mx-auto px-6">

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-foreground"
          >
            Terms of Service
          </motion.h1>

          <p className="mt-4 text-muted">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="mt-12 space-y-10 text-sm text-muted leading-relaxed">

            <Section title="1. Acceptance of Terms">
              By accessing or using FitOpsCentral, you agree to be bound by these
              Terms of Service. If you do not agree, please do not use the platform.
            </Section>

            <Section title="2. Description of Service">
              FitOpsCentral provides gym management software including desktop
              applications, web-based dashboards, cloud data storage, and optional
              automation features.
            </Section>

            <Section title="3. User Responsibilities">
              You are responsible for maintaining the confidentiality of your
              account credentials and for all activities that occur under your
              account.
            </Section>

            <Section title="4. Data & Storage">
              Basic plans operate offline without cloud storage. Premium and
              Enterprise plans include secure cloud data storage and backups.
              Users remain the owners of their data.
            </Section>

            <Section title="5. Payments & Subscriptions">
              Subscription fees are billed as described on our pricing page.
              Add-ons and hardware integrations may incur additional charges.
            </Section>

            <Section title="6. Prohibited Use">
              You agree not to misuse the platform, attempt unauthorized access,
              or interfere with system security or performance.
            </Section>

            <Section title="7. Limitation of Liability">
              FitOpsCentral is provided “as is.” We are not liable for indirect,
              incidental, or consequential damages arising from the use of the service.
            </Section>

            <Section title="8. Termination">
              We reserve the right to suspend or terminate access for violations
              of these terms or misuse of the platform.
            </Section>

            <Section title="9. Changes to Terms">
              We may update these Terms from time to time. Continued use of the
              platform constitutes acceptance of updated terms.
            </Section>

            <Section title="10. Contact">
              For questions regarding these Terms, please contact us at
              support@fitopscentral.com.
            </Section>

          </div>
        </div>
      </section>
    </main>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h2>
      <p>{children}</p>
    </div>
  )
}
