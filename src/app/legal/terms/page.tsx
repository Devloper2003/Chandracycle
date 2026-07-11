import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  HeartPulse,
  PhoneCall,
  Scale,
  Sparkles,
} from "lucide-react";
import { LegalLayout, LegalSection } from "../_components/legal-layout";

export const metadata = {
  title: "Terms of Service — ChandraCycle",
  description:
    "The terms and conditions that govern your use of ChandraCycle, the AI-powered women's health companion.",
};

const EFFECTIVE_DATE = "July 4, 2026";

export default function TermsOfServicePage() {
  return (
    <LegalLayout
      active="terms"
      title="Terms of Service"
      subtitle={`Effective ${EFFECTIVE_DATE}. These terms govern your use of ChandraCycle. Please read them carefully — by creating an account you agree to them.`}
    >
      {/* Health disclaimer banner up top */}
      <Card className="border-amber-200 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-900">
        <CardContent className="flex items-start gap-3 pt-6">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              ChandraCycle is informational, not medical advice.
            </p>
            <p className="mt-1 text-amber-800/90 dark:text-amber-200/80">
              Our AI insights are general guidance for healthy adults. They are{" "}
              <span className="font-medium">not</span> a substitute for a
              qualified physician. In a medical emergency in India, call{" "}
              <span className="font-semibold">112</span>.
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-10 bg-rose-100" />

      <div className="space-y-10">
        <LegalSection id="acceptance" title="1. Acceptance of Terms">
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) form a binding
            agreement between you and ChandraCycle Health Pvt. Ltd.
            (&ldquo;ChandraCycle&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;,
            &ldquo;our&rdquo;) governing your use of the ChandraCycle mobile and web
            application (&ldquo;the Service&rdquo;). By creating an account,
            signing in, or otherwise using the Service, you confirm that you
            have read, understood, and agree to be bound by these Terms and our{" "}
            <Link
              href="/legal/privacy"
              className="font-medium text-rose-700 underline-offset-2 hover:underline dark:text-rose-300"
            >
              Privacy Policy
            </Link>
            . If you do not agree, do not use ChandraCycle.
          </p>
        </LegalSection>

        <LegalSection id="service" title="2. Description of the Service">
          <p>
            ChandraCycle is an AI-powered women&apos;s health companion. The Service
            helps you:
          </p>
          <ul className="ml-4 list-disc space-y-2">
            <li>
              Track menstrual cycles, symptoms, mood, sleep, water intake, and
              fertility signs.
            </li>
            <li>
              Receive AI-generated insights and coaching tailored to your cycle
              phase, fertility goals, pregnancy, PCOS, or menopause journey.
            </li>
            <li>
              Connect with a community of other women on similar health
              journeys.
            </li>
            <li>
              Access premium modules including Hormone Intelligence, Fertility
              Planner, Pregnancy Companion, PCOS Manager, Menopause Guide,
              Diet Coach, and more.
            </li>
          </ul>
          <p>
            We may add, change, or remove features from time to time. Some
            features are only available with a paid subscription.
          </p>
        </LegalSection>

        <LegalSection id="eligibility" title="3. Eligibility">
          <p>
            You may use ChandraCycle only if:
          </p>
          <ul className="ml-4 list-disc space-y-2">
            <li>
              You are at least <span className="font-medium">16 years
              old</span>. If you are 16–18, you must use the Service with the
              involvement of a parent or legal guardian.
            </li>
            <li>
              You are a resident of <span className="font-medium">India</span>.
              ChandraCycle is currently offered only to users in India, and
              subscriptions are billed in Indian Rupees (₹) inclusive of 18%
              GST.
            </li>
            <li>
              You are not legally prohibited from using the Service under
              Indian law.
            </li>
          </ul>
        </LegalSection>

        <LegalSection id="accounts" title="4. Accounts">
          <p>
            To access most features, you must create an account with a valid
            email address and password, or sign in with Google or Apple. You
            agree to:
          </p>
          <ul className="ml-4 list-disc space-y-2">
            <li>
              Provide accurate, current information when registering.
            </li>
            <li>
              Keep your password confidential and promptly notify us if you
              suspect unauthorised access to your account.
            </li>
            <li>
              Be responsible for all activity that occurs under your account.
            </li>
            <li>
              Maintain <span className="font-medium">one account per
              person</span>. Sharing accounts or creating multiple accounts to
              abuse free trials is not permitted.
            </li>
            <li>
              Be at least 16 years old at the time of registration.
            </li>
          </ul>
          <p>
            We may suspend or terminate accounts that violate these Terms or
            that we reasonably believe are being used fraudulently.
          </p>
        </LegalSection>

        <LegalSection id="subscriptions" title="5. Subscriptions &amp; Billing">
          <p>
            ChandraCycle offers a free Basic plan and a paid Premium plan with two
            billing options:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="border-rose-200 dark:border-rose-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-serif text-base text-rose-900 dark:text-rose-100">
                  <Sparkles className="h-4 w-4 text-rose-600" />
                  Monthly
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="font-semibold">
                  ₹59 / month
                </p>
                <p className="mt-1 text-muted-foreground">
                  ₹50 + ₹9 GST (18%). Billed every 30 days.
                </p>
              </CardContent>
            </Card>
            <Card className="border-rose-300 bg-rose-50/60 dark:bg-rose-950/20 dark:border-rose-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-serif text-base text-rose-900 dark:text-rose-100">
                  <Sparkles className="h-4 w-4 text-rose-600" />
                  Yearly · Best Value
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="font-semibold">
                  ₹590 / year
                </p>
                <p className="mt-1 text-muted-foreground">
                  ₹500 + ₹90 GST (18%). ≈ ₹49/month — saves 33%.
                </p>
              </CardContent>
            </Card>
          </div>
          <ul className="ml-4 list-disc space-y-2">
            <li>
              <span className="font-medium">7-day free trial</span> — new
              subscribers get a 7-day Premium trial at no cost. You can cancel
              during the trial and pay nothing. If you don&apos;t cancel before
              the trial ends, your selected plan is automatically charged.
            </li>
            <li>
              <span className="font-medium">Auto-renewal</span> — your
              subscription renews automatically at the end of each billing
              cycle until you cancel.
            </li>
            <li>
              <span className="font-medium">Cancellation</span> — you can
              cancel anytime from{" "}
              <Link
                href="/"
                className="font-medium text-rose-700 underline-offset-2 hover:underline dark:text-rose-300"
              >
                Settings → Subscription
              </Link>
              . You keep Premium access until the end of the current paid
              period, after which you revert to the free Basic plan.
            </li>
            <li>
              <span className="font-medium">Refunds</span> — fees for partial
              billing periods are{" "}
              <span className="font-medium">non-refundable</span>, except where
              required by Indian consumer law. If you cancel during a free
              trial, you are never charged.
            </li>
            <li>
              <span className="font-medium">Taxes</span> — all prices include
              18% GST. A GST invoice is generated and emailed for every
              payment.
            </li>
            <li>
              <span className="font-medium">Price changes</span> — we may
              change subscription fees with at least 30 days&apos; notice by
              email. Any change takes effect at your next renewal; you can
              cancel before then to avoid the new price.
            </li>
          </ul>
        </LegalSection>

        <LegalSection id="acceptable-use" title="6. Acceptable Use">
          <p>You agree not to:</p>
          <ul className="ml-4 list-disc space-y-2">
            <li>
              Use ChandraCycle in any way that violates Indian law or the rights of
              others.
            </li>
            <li>
              Harass, threaten, or impersonate other users in community spaces.
            </li>
            <li>
              <span className="font-medium">Scrape, crawl, or
              reverse-engineer</span> the Service, or attempt to access data
              that doesn&apos;t belong to you.
            </li>
            <li>
              Upload viruses, malware, or any code designed to disrupt the
              Service.
            </li>
            <li>
              Share content that is medically dangerous, misleading, or
              promotes self-harm, eating disorders, or unsupervised use of
              prescription drugs.
            </li>
            <li>
              <span className="font-medium">Rely on ChandraCycle as medical
              advice</span> — the Service is informational only. See the Health
              Disclaimer below.
            </li>
            <li>
              Resell, sublicense, or commercialise access to your account.
            </li>
          </ul>
          <p>
            Violations may result in account suspension, content removal, and
            where appropriate, legal action.
          </p>
        </LegalSection>

        <LegalSection id="health-disclaimer" title="7. Health Disclaimer">
          <Card className="border-rose-200 bg-rose-50/60 dark:bg-rose-950/20 dark:border-rose-900">
            <CardContent className="space-y-3 pt-6 text-sm">
              <div className="flex items-start gap-3">
                <HeartPulse className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                <p>
                  <span className="font-semibold text-rose-900 dark:text-rose-100">
                    ChandraCycle provides general information, not medical advice.
                  </span>{" "}
                  Our insights, predictions, AI coaching, and community content
                  are intended to support &mdash; not replace &mdash; the
                  relationship between you and your qualified healthcare
                  provider. Always consult a licensed physician before making
                  decisions about your health, medications, fertility
                  treatments, or pregnancy.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <PhoneCall className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                <p>
                  <span className="font-semibold text-rose-900 dark:text-rose-100">
                    Emergency?
                  </span>{" "}
                  If you experience severe symptoms (heavy bleeding, severe
                  abdominal pain, difficulty breathing, signs of miscarriage or
                  ectopic pregnancy, suicidal thoughts), do not wait for the
                  app &mdash; <span className="font-medium">call 112 in
                  India</span> or go to your nearest emergency room
                  immediately.
                </p>
              </div>
            </CardContent>
          </Card>
        </LegalSection>

        <LegalSection id="ip" title="8. Intellectual Property">
          <p>
            ChandraCycle and its licensors own all rights, title, and interest in
            the Service, including the ChandraCycle name and logo, the app design,
            the AI models, written content, illustrations, and software code.
            You may not copy, modify, distribute, or create derivative works
            from any part of the Service without our written permission.
          </p>
          <p>
            Content you post in the community (cycle reflections, comments,
            photos you choose to share) remains yours. By posting it, you grant
            ChandraCycle a worldwide, royalty-free licence to host, display, and
            process that content solely to operate the community features. You
            can delete your content at any time.
          </p>
        </LegalSection>

        <LegalSection id="disclaimer-warranty" title="9. Disclaimers &amp; Warranties">
          <p>
            The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as
            available&rdquo; basis. We do not warrant that:
          </p>
          <ul className="ml-4 list-disc space-y-2">
            <li>
              Cycle, ovulation, or fertility predictions will be accurate for
              your body — every cycle is unique and our models are
              statistical, not clinical.
            </li>
            <li>
              The AI coach&apos;s responses are medically correct or suitable
              for your specific health condition.
            </li>
            <li>
              The Service will be uninterrupted, error-free, or secure from all
              threats.
            </li>
          </ul>
          <p>
            To the maximum extent permitted by Indian law, we disclaim all
            implied warranties including merchantability and fitness for a
            particular purpose.
          </p>
        </LegalSection>

        <LegalSection id="liability" title="10. Limitation of Liability">
          <p>
            To the fullest extent permitted by law, neither ChandraCycle nor its
            officers, employees, or affiliates shall be liable for any
            indirect, incidental, special, consequential, or punitive damages
            arising out of your use of the Service &mdash; including but not
            limited to loss of health data, unintended pregnancy, missed
            medical diagnosis, or any decision made in reliance on the
            Service&apos;s insights.
          </p>
          <p>
            Our total aggregate liability for any claim arising from these
            Terms is limited to the amount you paid us in the 12 months
            preceding the claim, or ₹1,000 (one thousand rupees), whichever is
            greater.
          </p>
        </LegalSection>

        <LegalSection id="law" title="11. Governing Law &amp; Disputes">
          <p>
            These Terms are governed by the laws of the Republic of India. Any
            dispute, controversy, or claim arising out of or relating to these
            Terms or the Service shall be subject to the exclusive
            jurisdiction of the competent courts of{" "}
            <span className="font-medium">Bengaluru, Karnataka, India</span>.
          </p>
          <p>
            Before filing a lawsuit, both parties agree to attempt good-faith
            resolution through email negotiation for 30 days. Consumer
            Protection Act remedies remain available to consumers as provided
            by law.
          </p>
        </LegalSection>

        <LegalSection id="changes" title="12. Changes to These Terms">
          <p>
            We may update these Terms from time to time. We will notify you by
            email at least 7 days before material changes take effect, and post
            the new version with an updated effective date on this page.
            Continued use of ChandraCycle after the effective date means you accept
            the updated Terms. If you do not agree, you may cancel your
            subscription and stop using the Service.
          </p>
        </LegalSection>

        <LegalSection id="contact" title="13. Contact">
          <p>
            Questions about these Terms? We&apos;re happy to help:
          </p>
          <div className="rounded-xl border border-rose-200 bg-white p-4 dark:bg-rose-950/20 dark:border-rose-900">
            <p className="flex items-center gap-2 font-semibold text-rose-900 dark:text-rose-100">
              <Scale className="h-4 w-4 text-rose-600" />
              ChandraCycle Health Pvt. Ltd. — Legal
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
              Registered office: Bengaluru, Karnataka, India.
            </p>
          </div>
        </LegalSection>
      </div>

      <Separator className="my-10 bg-rose-100" />

      <p className="text-xs text-muted-foreground">
        These Terms were last updated on {EFFECTIVE_DATE}. See also our{" "}
        <Link
          href="/legal/privacy"
          className="font-medium text-rose-700 underline-offset-2 hover:underline dark:text-rose-300"
        >
          Privacy Policy
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
