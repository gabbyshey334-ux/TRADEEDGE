import type { Metadata } from "next";
import { LegalEmail, LegalLayout, LegalList } from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy · TradeEdge AI",
  description:
    "How TradeEdge AI collects, uses, stores, and protects your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="PRIVACY POLICY"
      effectiveDate="January 1, 2026"
      intro={
        <p>
          This Privacy Policy explains how TradeEdge AI handles your information
          when you use our trading journal and analytics platform. We keep this
          policy short, specific, and honest. If anything is unclear, reach out
          to <LegalEmail address="support@tradeedge.ai" />.
        </p>
      }
      sections={[
        {
          id: "introduction",
          title: "Introduction",
          body: (
            <>
              <p>
                TradeEdge AI is operated by the TradeEdge AI team
                (&ldquo;TradeEdge,&rdquo; &ldquo;we,&rdquo; or &ldquo;us&rdquo;).
                This Privacy Policy covers all data processing related to
                tradeedge.ai, our web application, and any associated services.
              </p>
              <p>
                Effective date: <strong>January 1, 2026</strong>. By creating an
                account or using TradeEdge AI you agree to the practices
                described below.
              </p>
            </>
          ),
        },
        {
          id: "information-we-collect",
          title: "Information We Collect",
          body: (
            <>
              <p>We collect the minimum information required to run the platform:</p>
              <LegalList
                items={[
                  <>
                    <strong>Account information</strong> — your name, email
                    address, and password (stored as a one-way hash by our
                    authentication provider).
                  </>,
                  <>
                    <strong>Trade data you enter</strong> — symbols, prices,
                    sizes, P&amp;L, notes, screenshots, and any other content
                    you log in your journal.
                  </>,
                  <>
                    <strong>Payment information</strong> — handled directly by
                    Stripe. We never see or store credit card numbers. We only
                    receive your customer ID and subscription status from
                    Stripe.
                  </>,
                  <>
                    <strong>Usage data and analytics</strong> — basic logs such
                    as the pages you visit, errors, and feature usage so we can
                    improve the product. We do not sell this data.
                  </>,
                ]}
              />
            </>
          ),
        },
        {
          id: "how-we-use-information",
          title: "How We Use Your Information",
          body: (
            <>
              <p>We use the information described above to:</p>
              <LegalList
                items={[
                  "Provide and improve the service",
                  "Process payments and manage your subscription",
                  "Send transactional emails (account confirmations, billing receipts, password resets)",
                  "Generate the AI coaching reports you request",
                ]}
              />
              <p>
                We do not run advertising and we do not share your data with
                third parties for marketing.
              </p>
            </>
          ),
        },
        {
          id: "storage-and-security",
          title: "Data Storage and Security",
          body: (
            <>
              <LegalList
                items={[
                  "Your data is stored in Supabase on EU-region servers.",
                  "Row-level security policies isolate every user's data so other accounts cannot read it.",
                  "All connections to TradeEdge AI use industry-standard TLS encryption.",
                  "Passwords are hashed by our authentication provider; we never store them in plaintext.",
                ]}
              />
            </>
          ),
        },
        {
          id: "third-party-services",
          title: "Third Party Services",
          body: (
            <>
              <p>
                We rely on a small set of trusted infrastructure providers to
                run the platform:
              </p>
              <LegalList
                items={[
                  <>
                    <strong>Supabase</strong> — database, authentication, and
                    file storage.
                  </>,
                  <>
                    <strong>Stripe</strong> — subscription payments and billing.
                  </>,
                  <>
                    <strong>Anthropic</strong> — large-language model used to
                    generate AI coaching reports.
                  </>,
                  <>
                    <strong>Vercel</strong> — application hosting and edge
                    delivery.
                  </>,
                ]}
              />
              <p>
                Each of these providers is contractually required to protect
                your data and process it only on our instructions.
              </p>
            </>
          ),
        },
        {
          id: "data-retention",
          title: "Data Retention",
          body: (
            <p>
              We retain your account data and trade history while your account
              is active. You can request deletion of your account and all
              associated data at any time by emailing{" "}
              <LegalEmail address="support@tradeedge.ai" />. We will fulfill
              deletion requests within a reasonable period and confirm by email.
            </p>
          ),
        },
        {
          id: "your-rights",
          title: "Your Rights",
          body: (
            <>
              <p>You have the right to:</p>
              <LegalList
                items={[
                  "Access the personal data we hold about you",
                  "Correct any inaccurate or outdated information",
                  "Delete your account and associated data",
                  "Export your trade data in a portable format",
                ]}
              />
              <p>
                To exercise any of these rights, email{" "}
                <LegalEmail address="support@tradeedge.ai" /> from the address
                associated with your account.
              </p>
            </>
          ),
        },
        {
          id: "cookies",
          title: "Cookies",
          body: (
            <p>
              TradeEdge AI uses essential cookies only — they keep you signed in
              and keep your session secure. We do not run advertising cookies,
              cross-site trackers, or third-party analytics that profile you.
            </p>
          ),
        },
        {
          id: "contact",
          title: "Contact",
          body: (
            <p>
              For any privacy questions or requests, please email{" "}
              <LegalEmail address="support@tradeedge.ai" />.
            </p>
          ),
        },
        {
          id: "changes",
          title: "Changes to This Policy",
          body: (
            <p>
              We may update this Privacy Policy from time to time. If we make
              material changes, we will notify all active users by email and
              update the effective date at the top of this page.
            </p>
          ),
        },
      ]}
    />
  );
}
