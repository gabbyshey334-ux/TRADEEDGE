import type { Metadata } from "next";
import { LegalEmail, LegalLayout, LegalList } from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Terms of Service · TradeEdge AI",
  description:
    "The terms and conditions that govern your use of TradeEdge AI.",
};

export default function TermsOfServicePage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="TERMS OF SERVICE"
      effectiveDate="January 1, 2026"
      intro={
        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and
          use of TradeEdge AI. By using the platform you agree to these Terms.
          If you do not agree, please do not use TradeEdge AI.
        </p>
      }
      sections={[
        {
          id: "acceptance",
          title: "Acceptance of Terms",
          body: (
            <p>
              By creating an account, accessing, or using TradeEdge AI, you
              acknowledge that you have read, understood, and agree to be bound
              by these Terms and our{" "}
              <a
                href="/privacy"
                className="text-[#00e5b0] hover:underline font-medium"
              >
                Privacy Policy
              </a>
              . If you are using TradeEdge AI on behalf of an organization, you
              represent that you are authorized to bind that organization to
              these Terms.
            </p>
          ),
        },
        {
          id: "description",
          title: "Description of Service",
          body: (
            <p>
              TradeEdge AI is a trading journal and analytics platform that
              helps traders log trades, analyze performance, and receive
              AI-generated coaching reports. TradeEdge AI is{" "}
              <strong>not financial advice</strong>. We are a software tool —
              not a registered investment adviser, broker-dealer, or financial
              planner.
            </p>
          ),
        },
        {
          id: "account-registration",
          title: "Account Registration",
          body: (
            <>
              <LegalList
                items={[
                  "You must provide accurate, current, and complete information when creating an account.",
                  "You are responsible for keeping your account credentials secure and for all activity that occurs under your account.",
                  "You must notify us immediately at support@tradeedge.ai if you suspect unauthorized access to your account.",
                  "You must be at least 18 years old to use TradeEdge AI.",
                ]}
              />
            </>
          ),
        },
        {
          id: "subscription-and-billing",
          title: "Subscription and Billing",
          body: (
            <>
              <LegalList
                items={[
                  "Paid plans are billed monthly in advance.",
                  "All payments are processed through Stripe; you can update payment methods or cancel through the billing portal in your dashboard.",
                  "You can cancel anytime. Cancellation takes effect at the end of your current billing period; you retain access until that date.",
                  "Fees are non-refundable except where required by law.",
                ]}
              />
            </>
          ),
        },
        {
          id: "free-trial",
          title: "Free Trial",
          body: (
            <p>
              New accounts include a <strong>14-day free trial</strong> with
              full access to the plan you select. No credit card is required to
              start. We will notify you by email before the trial ends. If you
              do not add a payment method, your account will downgrade to the
              free Starter limits at the end of the trial.
            </p>
          ),
        },
        {
          id: "acceptable-use",
          title: "Acceptable Use",
          body: (
            <>
              <p>You agree not to:</p>
              <LegalList
                items={[
                  "Use TradeEdge AI for any illegal activity or in violation of any applicable law or regulation",
                  "Share your account credentials with anyone else, or use a single account to serve multiple traders",
                  "Attempt to reverse engineer, decompile, or otherwise discover the source code of the platform",
                  "Scrape, harvest, or otherwise extract data from TradeEdge AI in bulk without our written permission",
                  "Upload content that is unlawful, infringing, or harmful to others",
                  "Interfere with or disrupt the platform, its servers, or other users",
                ]}
              />
            </>
          ),
        },
        {
          id: "intellectual-property",
          title: "Intellectual Property",
          body: (
            <>
              <p>
                TradeEdge AI owns all rights, title, and interest in the
                platform&rsquo;s code, design, branding, documentation, and any
                derived works. We grant you a limited, non-exclusive,
                non-transferable license to use the platform during your active
                subscription.
              </p>
              <p>
                <strong>You own your trade data.</strong> You retain all rights
                to the content you upload — including trades, notes, and
                screenshots — and you can export or delete it at any time.
              </p>
            </>
          ),
        },
        {
          id: "disclaimer",
          title: "Disclaimer",
          body: (
            <>
              <p>
                TradeEdge AI is provided &ldquo;as is&rdquo; and &ldquo;as
                available&rdquo; without warranties of any kind, whether express
                or implied. We do not warrant that the service will be
                uninterrupted, error-free, or completely secure.
              </p>
              <p>
                <strong>
                  Nothing on TradeEdge AI constitutes investment, financial,
                  legal, or tax advice.
                </strong>{" "}
                AI coaching reports, analytics, and any other content are
                informational only. Trading involves substantial risk of loss.
                You are solely responsible for your trading decisions.
              </p>
            </>
          ),
        },
        {
          id: "limitation-of-liability",
          title: "Limitation of Liability",
          body: (
            <p>
              To the maximum extent permitted by law, TradeEdge AI and its
              operators will not be liable for any indirect, incidental,
              special, consequential, or punitive damages, or for any loss of
              profits, revenues, data, or trading capital, arising out of or in
              connection with your use of the platform. Our aggregate liability
              for any claim relating to the service shall not exceed the amount
              you paid to us in the twelve months preceding the claim.
            </p>
          ),
        },
        {
          id: "termination",
          title: "Termination",
          body: (
            <p>
              We may suspend or terminate your account if you violate these
              Terms, abuse the service, or engage in fraudulent or harmful
              behavior. You may terminate your account at any time by contacting{" "}
              <LegalEmail address="support@tradeedge.ai" /> or using the
              in-product deletion request. Upon termination, your access ends
              and your data will be deleted in accordance with our Privacy
              Policy.
            </p>
          ),
        },
        {
          id: "governing-law",
          title: "Governing Law",
          body: (
            <p>
              These Terms are governed by the laws of the{" "}
              <strong>State of Maryland, United States</strong>, without regard
              to its conflict-of-law provisions. Any dispute arising from these
              Terms or your use of TradeEdge AI shall be resolved in the courts
              located in Maryland.
            </p>
          ),
        },
        {
          id: "contact",
          title: "Contact",
          body: (
            <p>
              Questions about these Terms? Email{" "}
              <LegalEmail address="support@tradeedge.ai" /> and we&rsquo;ll get
              back to you.
            </p>
          ),
        },
      ]}
    />
  );
}
