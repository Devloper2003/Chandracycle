import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Lock, Mail, FileText, HeartPulse } from "lucide-react";
import { LegalLayout, LegalSection } from "../_components/legal-layout";

export const metadata = {
  title: "Privacy Policy — ChandraCycle",
  description:
    "How ChandraCycle collects, uses, stores, and protects your women's health data.",
};

const EFFECTIVE_DATE = "July 4, 2026";

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      active="privacy"
      title="Privacy Policy"
      subtitle={`Effective ${EFFECTIVE_DATE}. This policy explains what health and account data ChandraCycle collects, how we use it, and the rights you have over it.`}
    >
      {/* At-a-glance summary card */}
      <Card className="border-rose-200 bg-rose-50/60 dark:bg-rose-950/20 dark:border-rose-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-rose-900 dark:text-rose-100">
            <ShieldCheck className="h-5 w-5 text-rose-600" />
            Privacy at a glance
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-4 w-4 text-rose-600" />
            <div>
              <p className="font-medium">Encrypted at rest</p>
              <p className="text-muted-foreground">
                All health data is encrypted using industry-standard AES-256.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <HeartPulse className="mt-0.5 h-4 w-4 text-rose-600" />
            <div>
              <p className="font-medium">Stored in India</p>
              <p className="text-muted-foreground">
                Indian data residency — your data never leaves Indian
                jurisdiction.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-4 w-4 text-rose-600" />
            <div>
              <p className="font-medium">You own your data</p>
              <p className="text-muted-foreground">
                Export, correct, or delete everything — anytime, on your terms.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-4 w-4 text-rose-600" />
            <div>
              <p className="font-medium">Talk to a human</p>
              <p className="text-muted-foreground">
                Email{" "}
                <a
                  href="mailto:support@chandracycle.health"
                  className="font-medium text-rose-700 underline-offset-2 hover:underline dark:text-rose-300"
                >
                  support@chandracycle.health
                </a>{" "}
                for any privacy question.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-10 bg-rose-100" />

      <div className="space-y-10">
        <LegalSection id="intro" title="1. Introduction">
          <p>
            ChandraCycle Health Pvt. Ltd. (&ldquo;ChandraCycle&rdquo;, &ldquo;we&rdquo;,
            &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates the ChandraCycle mobile and
            web application (&ldquo;the Service&rdquo;), an AI-powered
            women&apos;s health companion. We understand that the information you
            share with us &mdash; about your body, your cycle, your mood, and
            your health journey &mdash; is deeply personal. This Privacy Policy
            describes what we collect, why we collect it, and the choices you
            have.
          </p>
          <p>
            This policy applies to all users of the Service. By creating an
            account or using ChandraCycle, you consent to the practices described
            here. We comply with the Digital Personal Data Protection Act, 2023
            (&ldquo;DPDP Act&rdquo;) of India.
          </p>
        </LegalSection>

        <LegalSection id="collect" title="2. Data We Collect">
          <p>
            <span className="font-semibold text-rose-800 dark:text-rose-200">
              Account data:
            </span>{" "}
            Your name, email address, hashed password, optional profile photo,
            and authentication provider details (Google or Apple ID) when you
            sign in with OAuth.
          </p>
          <p>
            <span className="font-semibold text-rose-800 dark:text-rose-200">
              Health data you enter:
            </span>{" "}
            Menstrual cycle dates and flow patterns, symptoms (cramps, bloating,
            headaches, breast tenderness, fatigue, etc.), mood entries, sleep
            duration and quality, daily water intake, fertility signs (basal
            body temperature, cervical mucus, ovulation tests), pregnancy
            milestones (due date, trimester notes, kick counts), PCOS tracking
            (medication, insulin resistance markers, hirsutism), and menopause
            symptoms (hot flashes, night sweats, cycle irregularity).
          </p>
          <p>
            <span className="font-semibold text-rose-800 dark:text-rose-200">
              Conversations with the AI coach:
            </span>{" "}
            The questions you ask the AI coach and the responses it generates,
            so we can personalize future guidance.
          </p>
          <p>
            <span className="font-semibold text-rose-800 dark:text-rose-200">
              Community content:
            </span>{" "}
            Posts, comments, reactions, and direct messages you create in
            community spaces.
          </p>
          <p>
            <span className="font-semibold text-rose-800 dark:text-rose-200">
              Device and usage data:
            </span>{" "}
            Device type, operating system, app version, IP address, approximate
            location (city-level), and crash &amp; analytics logs needed to keep
            the Service running.
          </p>
          <p>
            <span className="font-semibold text-rose-800 dark:text-rose-200">
              Payment metadata:
            </span>{" "}
            When you subscribe, Razorpay shares the last 4 digits of your card,
            payment method type, transaction ID, and invoice number. We never
            see or store full card numbers or CVVs.
          </p>
        </LegalSection>

        <LegalSection id="use" title="3. How We Use Your Data">
          <p>We use your data for the following purposes:</p>
          <ul className="ml-4 list-disc space-y-2">
            <li>
              <span className="font-medium">Personalized insights</span> —
              predicting your next period, fertile window, ovulation day, and
              symptom patterns based on the cycle history you log.
            </li>
            <li>
              <span className="font-medium">AI coaching</span> — generating
              tailored guidance, meal plans, and exercise suggestions through
              our AI provider. Conversations are processed to produce your
              response and may be retained to improve response quality.
            </li>
            <li>
              <span className="font-medium">Community features</span> — letting
              you post, react, and connect with other members in
              women&apos;s-health-focused community spaces.
            </li>
            <li>
              <span className="font-medium">Account management</span> —
              authentication, session maintenance, password resets, and keeping
              your subscription active.
            </li>
            <li>
              <span className="font-medium">Service improvement</span> —
              anonymized, aggregated analytics to fix bugs and prioritise new
              features.
            </li>
            <li>
              <span className="font-medium">Safety and legal</span> — preventing
              abuse, fraud, and meeting obligations under Indian law.
            </li>
          </ul>
          <p>
            We never sell your health data to advertisers, insurance companies,
            or any third party.
          </p>
        </LegalSection>

        <LegalSection id="storage" title="4. Data Storage &amp; Security">
          <p>
            Your data is stored on encrypted database servers located in India
            (Mumbai region, AWS ap-south-1) to comply with Indian data
            residency requirements under the DPDP Act. All data is{" "}
            <span className="font-medium">encrypted at rest</span> using
            AES-256, and{" "}
            <span className="font-medium">encrypted in transit</span> using
            TLS 1.2+. Backups are also encrypted and retained for 30 days.
          </p>
          <p>
            Access to production data is restricted to a small number of
            authorised engineers via individual SSO credentials, multi-factor
            authentication, and audited access logs. Engineers do not have
            access to your raw cycle entries &mdash; they are only viewable
            through your authenticated account.
          </p>
          <p>
            Despite our safeguards, no system is 100% secure. If a breach
            occurs that is likely to cause you harm, we will notify you and the
            Data Protection Board of India within 72 hours, as required by law.
          </p>
        </LegalSection>

        <LegalSection id="third-parties" title="5. Third Parties We Share Data With">
          <p>
            We only share data with processors who help us run ChandraCycle. Each
            processor is bound by a Data Processing Agreement (DPA) and is
            limited to using your data only to provide the service we asked
            them to provide:
          </p>
          <ul className="ml-4 list-disc space-y-2">
            <li>
              <span className="font-medium">Google &amp; Apple</span> — for
              OAuth sign-in. They share your name, email, and a stable account
              ID. They do not receive any health data from us.
            </li>
            <li>
              <span className="font-medium">Razorpay</span> — for subscription
              payments and GST invoicing. Razorpay receives only the payment
              metadata needed to process your transaction.
            </li>
            <li>
              <span className="font-medium">AI chat provider</span> — processes
              your coach questions and AI responses. We share only the text of
              your question and necessary context (cycle phase, symptoms), not
              your full identity.
            </li>
            <li>
              <span className="font-medium">Cloud hosting &amp; email
              delivery</span> — AWS for compute and storage, and a transactional
              email provider for password resets, receipts, and policy-update
              notices.
            </li>
          </ul>
          <p>
            We never share health data with advertising networks, data brokers,
            or insurance providers.
          </p>
        </LegalSection>

        <LegalSection id="rights" title="6. Your Rights">
          <p>
            Under the DPDP Act and our own commitments, you have the following
            rights over your personal data:
          </p>
          <ul className="ml-4 list-disc space-y-2">
            <li>
              <span className="font-medium">Access</span> — request a copy of
              all the data we hold about you.
            </li>
            <li>
              <span className="font-medium">Correction</span> — ask us to fix
              inaccurate or incomplete data.
            </li>
            <li>
              <span className="font-medium">Deletion</span> — request that we
              erase your account and associated health data. We will delete it
              within 30 days, except where retention is required by law (e.g.
              tax records).
            </li>
            <li>
              <span className="font-medium">Export</span> — download all your
              data as a portable JSON or CSV file from{" "}
              <Link
                href="/"
                className="font-medium text-rose-700 underline-offset-2 hover:underline dark:text-rose-300"
              >
                Settings → Privacy &amp; Security → Export My Data
              </Link>
              .
            </li>
            <li>
              <span className="font-medium">Withdraw consent</span> — turn off
              optional data sharing (analytics, AI personalization) at any time
              without losing access to core tracking features.
            </li>
            <li>
              <span className="font-medium">Grievance redressal</span> — file a
              complaint with our Grievance Officer (contact below) and, if
              unresolved, with the Data Protection Board of India.
            </li>
          </ul>
          <p>
            To exercise any of these rights, email{" "}
            <a
              href="mailto:support@chandracycle.health"
              className="font-medium text-rose-700 underline-offset-2 hover:underline dark:text-rose-300"
            >
              support@chandracycle.health
            </a>{" "}
            with the subject line &ldquo;Data Rights Request&rdquo;. We will
            respond within 30 days.
          </p>
        </LegalSection>

        <LegalSection id="cookies" title="7. Cookies &amp; Local Storage">
          <p>
            ChandraCycle uses minimal client-side storage so you can stay logged in
            and so the app remembers your preferences:
          </p>
          <ul className="ml-4 list-disc space-y-2">
            <li>
              <span className="font-medium">Auth session cookie</span> — a
              30-day, HttpOnly, Secure token that keeps you signed in. It is
              essential and cannot be disabled if you want to use the Service.
            </li>
            <li>
              <span className="font-medium">Local storage</span> — your
              theme preference, last-viewed module, and cached cycle data for
              offline use.
            </li>
            <li>
              <span className="font-medium">Analytics (opt-in)</span> — we use
              privacy-respecting, anonymous analytics to understand which
              features are used. This is{" "}
              <span className="font-medium">off by default</span> and can be
              enabled in Settings → Privacy &amp; Security.
            </li>
          </ul>
          <p>
            We do not use third-party advertising or tracking cookies.
          </p>
        </LegalSection>

        <LegalSection id="children" title="8. Children&apos;s Privacy">
          <p>
            ChandraCycle is designed for women aged{" "}
            <span className="font-medium">16 and older</span>. We do not
            knowingly collect data from anyone under 16. If you believe a
            minor has created an account, please contact us and we will delete
            it promptly. Teenagers aged 16–18 should use ChandraCycle with the
            involvement of a parent or guardian.
          </p>
        </LegalSection>

        <LegalSection id="retention" title="9. Data Retention">
          <p>
            We keep your data for as long as your account is active. If you
            cancel your subscription, your data remains accessible to you on
            the free plan. If you delete your account, we erase your health
            data within 30 days. We retain billing records (invoices, GST
            details) for 6 years as required by Indian tax law, and security
            logs for 12 months for fraud prevention.
          </p>
        </LegalSection>

        <LegalSection id="updates" title="10. Updates to This Policy">
          <p>
            We may update this Privacy Policy from time to time. When we do, we
            will bump the effective date at the top of this page and{" "}
            <span className="font-medium">email you</span> at the address on
            file at least 7 days before the change takes effect, unless the
            change is required by law or benefits you. Continued use of
            ChandraCycle after the effective date means you accept the updated
            policy.
          </p>
        </LegalSection>

        <LegalSection id="contact" title="11. Contact Us">
          <p>
            If you have any questions about this Privacy Policy or how we
            handle your data, please contact our Grievance Officer:
          </p>
          <div className="rounded-xl border border-rose-200 bg-white p-4 dark:bg-rose-950/20 dark:border-rose-900">
            <p className="font-semibold text-rose-900 dark:text-rose-100">
              ChandraCycle Health Pvt. Ltd. — Grievance Officer
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Email:{" "}
              <a
                href="mailto:support@chandracycle.health"
                className="font-medium text-rose-700 underline-offset-2 hover:underline dark:text-rose-300"
              >
                support@chandracycle.health
              </a>
            </p>
            <p className="text-sm text-muted-foreground">
              Response time: 24–48 hours on business days.
            </p>
          </div>
        </LegalSection>
      </div>

      <Separator className="my-10 bg-rose-100" />

      <p className="text-xs text-muted-foreground">
        This Privacy Policy was last updated on {EFFECTIVE_DATE}. See also our{" "}
        <Link
          href="/legal/terms"
          className="font-medium text-rose-700 underline-offset-2 hover:underline dark:text-rose-300"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/legal/support"
          className="font-medium text-rose-700 underline-offset-2 hover:underline dark:text-rose-300"
        >
          Help &amp; Support
        </Link>
        .
      </p>
    </LegalLayout>
  );
}
