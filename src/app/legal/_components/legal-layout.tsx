import Link from "next/link";
import * as React from "react";
import { ArrowLeft, Flower2 } from "lucide-react";

type LegalPage = "privacy" | "terms" | "support";

interface LegalLayoutProps {
  /** Which page is currently active (highlighted in footer nav). */
  active: LegalPage;
  /** Page title shown in the sticky header (next to the brand). */
  title: string;
  /** Optional eyebrow/subtitle shown under the title in the hero band. */
  subtitle?: string;
  children: React.ReactNode;
}

const footerLinks: { href: string; label: string; key: LegalPage }[] = [
  { href: "/legal/privacy", label: "Privacy Policy", key: "privacy" },
  { href: "/legal/terms", label: "Terms of Service", key: "terms" },
  { href: "/legal/support", label: "Help & Support", key: "support" },
];

export function LegalLayout({
  active,
  title,
  subtitle,
  children,
}: LegalLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-rose-50/40 dark:bg-background">
      {/* ─── Sticky Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-rose-100 bg-white/85 dark:bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-rose-700 dark:text-rose-300 transition-colors hover:text-rose-900 dark:hover:text-rose-200"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-sm">
              <Flower2 className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-serif text-lg font-semibold tracking-tight text-rose-900 dark:text-rose-100">
                ChandraCycle
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-rose-400 dark:text-rose-500">
                Legal
              </span>
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-3.5 py-1.5 text-xs font-medium text-rose-700 shadow-sm transition-all hover:border-rose-300 hover:bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to ChandraCycle
          </Link>
        </div>
      </header>

      {/* ─── Hero band with the page title ─────────────────────────── */}
      <section className="border-b border-rose-100 bg-gradient-to-b from-rose-100/60 to-transparent dark:from-rose-950/20">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-500 dark:text-rose-400">
            ChandraCycle Legal
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-rose-950 dark:text-rose-50 sm:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-rose-700/80 dark:text-rose-200/70 sm:text-base">
              {subtitle}
            </p>
          ) : null}
        </div>
      </section>

      {/* ─── Main scrollable content ───────────────────────────────── */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>

      {/* ─── Sticky footer ─────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-rose-100 bg-white dark:bg-rose-950/30">
        <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-sm">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
                <Flower2 className="h-4 w-4" />
                <span className="font-serif text-base font-semibold">
                  ChandraCycle
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Your AI-powered women&apos;s health companion. Made with care in
                India.
              </p>
            </div>

            <nav
              aria-label="Legal pages"
              className="flex flex-col gap-2 text-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                Legal
              </p>
              {footerLinks.map((link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  aria-current={link.key === active ? "page" : undefined}
                  className={
                    link.key === active
                      ? "font-medium text-rose-700 dark:text-rose-300"
                      : "text-muted-foreground transition-colors hover:text-rose-700 dark:hover:text-rose-300"
                  }
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/"
                className="text-muted-foreground transition-colors hover:text-rose-700 dark:hover:text-rose-300"
              >
                Back to App
              </Link>
            </nav>
          </div>

          <div className="mt-8 border-t border-rose-100 pt-6 text-xs text-muted-foreground">
            <p>
              © {new Date().getFullYear()} ChandraCycle Health Pvt. Ltd. All rights
              reserved.
            </p>
            <p className="mt-1">
              For questions about this page, email{" "}
              <a
                href="mailto:support@chandracycle.health"
                className="font-medium text-rose-700 underline-offset-2 hover:underline dark:text-rose-300"
              >
                support@chandracycle.health
              </a>
              . In a medical emergency in India, call{" "}
              <span className="font-semibold">112</span>.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** A small section helper for consistent heading + body spacing. */
export function LegalSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-serif text-xl font-semibold text-rose-950 dark:text-rose-50 sm:text-2xl">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground/90 sm:text-[15px]">
        {children}
      </div>
    </section>
  );
}
