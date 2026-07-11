import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  BookOpen,
  Clock,
  CreditCard,
  FileText,
  HelpCircle,
  KeyRound,
  LifeBuoy,
  Mail,
  PhoneCall,
  RefreshCw,
  ShieldAlert,
  UserCog,
  Wrench,
} from "lucide-react";
import { LegalLayout, LegalSection } from "../_components/legal-layout";

export const metadata = {
  title: "Help & Support — ChandraCycle",
  description:
    "Get help with your ChandraCycle account, subscription, data, and technical issues. Email, phone, and FAQs.",
};

const faqs: {
  q: string;
  a: React.ReactNode;
  icon: React.ReactNode;
}[] = [
  {
    icon: <UserCog className="h-5 w-5" />,
    q: "How do I create or delete my account?",
    a: (
      <>
        Tap <span className="font-medium">Sign Up</span> on the welcome screen
        and use your email, Google, or Apple account. To delete your account,
        open <span className="font-medium">Settings → Account → Delete
        Account</span>. We erase your health data within 30 days, except for
        billing records we&apos;re required to keep for Indian tax law. You can
        also request deletion by emailing us.
      </>
    ),
  },
  {
    icon: <CreditCard className="h-5 w-5" />,
    q: "How do subscriptions, trials, and refunds work?",
    a: (
      <>
        Every new subscriber gets a <span className="font-medium">7-day free
        trial</span> of Premium. You won&apos;t be charged during the trial.
        After the trial, Premium is{" "}
        <span className="font-medium">₹59/month</span> or{" "}
        <span className="font-medium">₹590/year</span> (incl. 18% GST) and
        auto-renews until cancelled. You can cancel anytime from{" "}
        <Link
          href="/"
          className="font-medium text-rose-700 underline-offset-2 hover:underline dark:text-rose-300"
        >
          Settings → Subscription
        </Link>{" "}
        and keep Premium until the end of the current period. Fees for partial
        periods are non-refundable except where required by Indian law.
      </>
    ),
  },
  {
    icon: <RefreshCw className="h-5 w-5" />,
    q: "Can I export my health data?",
    a: (
      <>
        Yes. Go to <span className="font-medium">Settings → Privacy &amp;
        Security → Export My Data</span>. You&apos;ll receive a ZIP file
        containing your cycle history, symptom logs, mood entries, sleep and
        water data, and AI coach conversations in JSON and CSV formats. The
        download is ready within a few minutes.
      </>
    ),
  },
  {
    icon: <KeyRound className="h-5 w-5" />,
    q: "I forgot my password — what do I do?",
    a: (
      <>
        On the sign-in screen, tap{" "}
        <span className="font-medium">&ldquo;Forgot password?&rdquo;</span>{" "}
        and enter your email. We&apos;ll send a secure reset link valid for 30
        minutes. If you signed up with Google or Apple and forgot that
        password, you&apos;ll need to reset it through Google or Apple directly.
        Still stuck? Email us and we&apos;ll verify your identity and help.
      </>
    ),
  },
  {
    icon: <RefreshCw className="h-5 w-5" />,
    q: "What is your refund policy?",
    a: (
      <>
        Subscription fees for partial billing periods are{" "}
        <span className="font-medium">non-refundable</span>, but you keep
        Premium access until the period ends. Free trials are always free
        &mdash; if you cancel during the trial, you&apos;re never charged. If
        you were charged in error or experienced a verified service outage,
        email us with your invoice number and we&apos;ll review your case
        within 5 business days, as required by Indian consumer law.
      </>
    ),
  },
  {
    icon: <Wrench className="h-5 w-5" />,
    q: "The app is crashing or behaving strangely. Help!",
    a: (
      <>
        First, try the classic fix: fully close and reopen the app, or refresh
        the page. If that doesn&apos;t work, sign out and back in. Still
        broken? Email us with: (1) what you were trying to do, (2) what
        happened instead, (3) a screenshot if possible, and (4) your device
        type and ChandraCycle app version (visible in Settings → About). Our team
        typically responds within 24–48 hours on business days.
      </>
    ),
  },
];

export default function SupportPage() {
  return (
    <LegalLayout
      active="support"
      title="Help &amp; Support"
      subtitle="We're here for you — whether it's a billing question, a forgotten password, or a bug. Reach out and a real human will get back to you."
    >
      {/* ─── Contact card ─────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-rose-200 bg-rose-50/60 dark:bg-rose-950/20 dark:border-rose-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-rose-900 dark:text-rose-100">
              <Mail className="h-5 w-5 text-rose-600" />
              Email support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <a
              href="mailto:support@chandracycle.health"
              className="inline-flex items-center gap-2 font-medium text-rose-700 underline-offset-2 hover:underline dark:text-rose-300"
            >
              support@chandracycle.health
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
            <p className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              Response within 24–48 hours, Mon–Fri.
            </p>
            <p className="text-xs text-muted-foreground">
              Best for: account issues, refunds, data export, billing
              questions, bug reports.
            </p>
          </CardContent>
        </Card>

        <Card className="border-rose-200 bg-rose-50/60 dark:bg-rose-950/20 dark:border-rose-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-rose-900 dark:text-rose-100">
              <PhoneCall className="h-5 w-5 text-rose-600" />
              Phone support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium text-rose-900 dark:text-rose-100">
              +91 80-XXXX-XXXX
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              Monday–Friday, 9 AM – 6 PM IST
            </p>
            <p className="text-xs text-muted-foreground">
              Best for: subscription changes, urgent account lockouts, GST
              invoice corrections.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Quick links ──────────────────────────────────────────────── */}
      <h2 className="mt-10 flex items-center gap-2 font-serif text-xl font-semibold text-rose-950 dark:text-rose-50 sm:text-2xl">
        <LifeBuoy className="h-5 w-5 text-rose-600" />
        Quick links
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Link
          href="/legal/privacy"
          className="group rounded-xl border border-rose-200 bg-white p-4 transition-all hover:border-rose-400 hover:shadow-md dark:border-rose-900 dark:bg-rose-950/20 dark:hover:border-rose-700"
        >
          <FileText className="h-5 w-5 text-rose-600" />
          <p className="mt-2 font-medium text-rose-900 dark:text-rose-100">
            Privacy Policy
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            How we collect, store, and protect your data.
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-rose-600 group-hover:gap-1.5">
            Read policy <ArrowRight className="h-3 w-3" />
          </span>
        </Link>

        <Link
          href="/legal/terms"
          className="group rounded-xl border border-rose-200 bg-white p-4 transition-all hover:border-rose-400 hover:shadow-md dark:border-rose-900 dark:bg-rose-950/20 dark:hover:border-rose-700"
        >
          <BookOpen className="h-5 w-5 text-rose-600" />
          <p className="mt-2 font-medium text-rose-900 dark:text-rose-100">
            Terms of Service
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Subscription terms, billing, and acceptable use.
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-rose-600 group-hover:gap-1.5">
            Read terms <ArrowRight className="h-3 w-3" />
          </span>
        </Link>

        <Link
          href="/"
          className="group rounded-xl border border-rose-200 bg-white p-4 transition-all hover:border-rose-400 hover:shadow-md dark:border-rose-900 dark:bg-rose-950/20 dark:hover:border-rose-700"
        >
          <CreditCard className="h-5 w-5 text-rose-600" />
          <p className="mt-2 font-medium text-rose-900 dark:text-rose-100">
            Cancel Subscription
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage or cancel your Premium plan in Settings.
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-rose-600 group-hover:gap-1.5">
            Open settings <ArrowRight className="h-3 w-3" />
          </span>
        </Link>
      </div>

      <Separator className="my-10 bg-rose-100" />

      {/* ─── FAQ ──────────────────────────────────────────────────────── */}
      <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-rose-950 dark:text-rose-50 sm:text-2xl">
        <HelpCircle className="h-5 w-5 text-rose-600" />
        Frequently asked questions
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Quick answers to the questions we hear most. Tap a card to read more,
        or email us if yours isn&apos;t here.
      </p>

      <div className="mt-6 space-y-4">
        {faqs.map((faq, i) => (
          <Card
            key={i}
            className="border-rose-100 bg-white dark:bg-rose-950/10 dark:border-rose-900/60"
          >
            <CardHeader>
              <CardTitle className="flex items-start gap-3 text-base font-semibold text-rose-900 dark:text-rose-100">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
                  {faq.icon}
                </span>
                <span>{faq.q}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pl-[60px] text-sm leading-relaxed text-foreground/90">
              {faq.a}
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="my-10 bg-rose-100" />

      {/* ─── Health emergency disclaimer ─────────────────────────────── */}
      <LegalSection
        id="emergency"
        title="Health emergency disclaimer"
      >
        <Card className="border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30">
          <CardContent className="flex items-start gap-3 pt-6">
            <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-rose-600" />
            <div className="text-sm">
              <p className="font-semibold text-rose-900 dark:text-rose-100">
                ChandraCycle Support cannot help with medical emergencies.
              </p>
              <p className="mt-1 text-rose-800/90 dark:text-rose-200/80">
                If you experience severe bleeding, severe abdominal or chest
                pain, difficulty breathing, fainting, signs of miscarriage or
                ectopic pregnancy, or thoughts of self-harm &mdash;{" "}
                <span className="font-semibold">
                  call 112 in India immediately
                </span>{" "}
                or go to your nearest hospital emergency room. Do not wait for
                an email or phone response from our team.
              </p>
              <p className="mt-1 text-rose-800/90 dark:text-rose-200/80">
                ChandraCycle is an informational companion, not a medical service,
                and our support team is not trained to provide medical advice.
              </p>
            </div>
          </CardContent>
        </Card>
      </LegalSection>

      <Separator className="my-10 bg-rose-100" />

      <p className="text-xs text-muted-foreground">
        Couldn&apos;t find what you needed? Email{" "}
        <a
          href="mailto:support@chandracycle.health"
          className="font-medium text-rose-700 underline-offset-2 hover:underline dark:text-rose-300"
        >
          support@chandracycle.health
        </a>{" "}
        — we usually reply within 24–48 hours on business days.
      </p>
    </LegalLayout>
  );
}
