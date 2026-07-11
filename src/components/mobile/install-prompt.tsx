'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Share, Plus, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

const DISMISS_KEY = 'chandracycle-install-dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null)
  const [showAndroid, setShowAndroid] = React.useState(false)
  const [showIOS, setShowIOS] = React.useState(false)
  const [showIOSGuide, setShowIOSGuide] = React.useState(false)
  const [installing, setInstalling] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    // Don't show if already dismissed or already running as PWA.
    const dismissed = window.localStorage.getItem(DISMISS_KEY) === '1'
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true
    if (dismissed || isStandalone) return

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    if (isIOS) {
      setShowIOS(true)
      return
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowAndroid(true)
    }

    const onAppInstalled = () => {
      setShowAndroid(false)
      setShowIOS(false)
      setDeferredPrompt(null)
      toast.success('ChandraCycle installed!', {
        description: 'Find it on your home screen.',
      })
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  const dismiss = () => {
    setShowAndroid(false)
    setShowIOS(false)
    try {
      window.localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore storage errors */
    }
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    setInstalling(true)
    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        setShowAndroid(false)
        setDeferredPrompt(null)
      } else {
        // User dismissed the native prompt; hide our banner too.
        dismiss()
      }
    } catch {
      toast.error('Install failed', {
        description: 'Try again from your browser menu.',
      })
    } finally {
      setInstalling(false)
    }
  }

  const visible = showAndroid || showIOS

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="lg:hidden fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+84px)] z-50"
          >
            <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-rose-200/60 bg-card/95 backdrop-blur-xl shadow-2xl shadow-rose-500/10">
              <div className="flex items-center gap-3 p-3">
                {/* App icon */}
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600 text-white font-bold shadow-md shadow-rose-500/30">
                  <span className="text-lg font-serif">C</span>
                  <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight">Install ChandraCycle App</p>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">
                    {showAndroid
                      ? 'Quick access from your home screen'
                      : 'Add to Home Screen for the full app experience'}
                  </p>
                </div>

                <Button
                  onClick={showAndroid ? handleInstall : () => setShowIOSGuide(true)}
                  disabled={installing}
                  size="sm"
                  className="shrink-0 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white border-0"
                >
                  {installing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : showAndroid ? (
                    <>
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Install
                    </>
                  ) : (
                    'How to Install'
                  )}
                </Button>

                <button
                  type="button"
                  onClick={dismiss}
                  aria-label="Dismiss install prompt"
                  className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS manual install guide */}
      <Dialog open={showIOSGuide} onOpenChange={setShowIOSGuide}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-400 to-pink-600 text-white text-sm font-serif">
                C
              </span>
              Install ChandraCycle on iPhone
            </DialogTitle>
            <DialogDescription>
              Follow these steps in Safari to add ChandraCycle to your Home Screen.
            </DialogDescription>
          </DialogHeader>

          <ol className="space-y-3 py-2">
            <IOSStep
              n={1}
              icon={<Share className="h-5 w-5" />}
              title="Tap the Share button"
              hint="It's the square with an arrow at the bottom of Safari."
            />
            <IOSStep
              n={2}
              icon={<Plus className="h-5 w-5" />}
              title="Tap “Add to Home Screen”"
              hint="Scroll the share sheet down to find it."
            />
            <IOSStep
              n={3}
              icon={<Sparkles className="h-5 w-5" />}
              title="Tap “Add”"
              hint="ChandraCycle will appear on your Home Screen like a native app."
            />
          </ol>

          <div className="rounded-xl bg-rose-50 dark:bg-rose-950/30 p-3 text-[11px] text-rose-700 dark:text-rose-300">
            Tip: once installed, launch from your Home Screen to use ChandraCycle in fullscreen mode —
            no Safari chrome.
          </div>

          <Button
            onClick={() => {
              setShowIOSGuide(false)
              dismiss()
            }}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white border-0"
          >
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}

function IOSStep({
  n,
  icon,
  title,
  hint,
}: {
  n: number
  icon: React.ReactNode
  title: string
  hint: string
}) {
  return (
    <li className="flex items-start gap-3">
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300">
        {icon}
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
          {n}
        </span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium leading-tight">{title}</p>
        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{hint}</p>
      </div>
    </li>
  )
}
