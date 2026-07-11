'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

// Type definitions for Google Identity Services (loaded from external script)
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: GoogleCredentialResponse) => void
            auto_select?: boolean
            cancel_on_tap_outside?: boolean
          }) => void
          prompt: (momentListener?: (notification: GooglePromptNotification) => void) => void
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black'
              size?: 'large' | 'medium' | 'small'
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
              shape?: 'rectangular' | 'pill' | 'circle' | 'standard'
              width?: number
              locale?: string
            }
          ) => void
          disableAutoSelect: () => void
        }
      }
    }
  }
}

interface GoogleCredentialResponse {
  credential: string // ID token (JWT) signed by Google
  select_by: string
}

interface GooglePromptNotification {
  isNotDisplayed: () => boolean
  isSkippedMoment: () => boolean
  isDismissedMoment: () => boolean
  getNotDisplayedReason: () => string
  getSkippedReason: () => string
  getDismissedReason: () => string
}

interface GoogleOAuthButtonProps {
  onCredential: (idToken: string) => void
  loading: boolean
  setLoading: (loading: boolean) => void
}

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

let scriptPromise: Promise<void> | null = null
function loadGoogleScript(): Promise<void> {
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('no window'))
    if (window.google?.accounts?.id) return resolve()
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Google script')))
      return
    }
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity Services script'))
    document.head.appendChild(script)
  })
  return scriptPromise
}

export default function GoogleOAuthButton({ onCredential, loading, setLoading }: GoogleOAuthButtonProps) {
  const buttonContainerRef = useRef<HTMLDivElement>(null)
  const [clientId, setClientId] = useState<string>('')
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [scriptError, setScriptError] = useState<string | null>(null)
  const [showSetupHelp, setShowSetupHelp] = useState(false)
  const callbackRef = useRef<(idToken: string) => void>(onCredential)
  useEffect(() => {
    callbackRef.current = onCredential
  }, [onCredential])

  // Fetch the client id from /api/auth/config
  useEffect(() => {
    let cancelled = false
    async function fetchConfig() {
      try {
        const res = await fetch('/api/auth/config')
        const data = await res.json()
        if (!cancelled) setClientId(data.google?.clientId || '')
      } catch {
        if (!cancelled) setClientId('')
      }
    }
    fetchConfig()
    return () => { cancelled = true }
  }, [])

  // Load Google Identity Services script when we have a clientId
  useEffect(() => {
    if (!clientId) return
    loadGoogleScript()
      .then(() => setScriptLoaded(true))
      .catch((err) => setScriptError(err.message))
  }, [clientId])

  // Initialize GIS + render the official Google button
  useEffect(() => {
    if (!scriptLoaded || !clientId || !window.google?.accounts?.id) return

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: GoogleCredentialResponse) => {
        if (response.credential) {
          callbackRef.current(response.credential)
        } else {
          setLoading(false)
          toast.error('Google did not return a credential. Please try again.')
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    })

    if (buttonContainerRef.current) {
      buttonContainerRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(buttonContainerRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: 400,
      })
    }
  }, [scriptLoaded, clientId, setLoading])

  const handleFallbackClick = useCallback(() => {
    // If Google script is loaded, trigger One Tap prompt as fallback
    if (scriptLoaded && window.google?.accounts?.id) {
      setLoading(true)
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setLoading(false)
          toast.info('Please use the official Google button shown above to choose your account.')
        }
      })
    } else {
      toast.error('Google Sign-In is still loading. Please wait a moment.')
    }
  }, [scriptLoaded, setLoading])

  // Script failed to load
  if (scriptError) {
    return (
      <div className="w-full space-y-1.5">
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 rounded-xl border-border bg-card text-sm font-medium gap-2.5 opacity-60"
          disabled
        >
          <GoogleIcon className="h-5 w-5" />
          <span>Google Sign-In unavailable</span>
        </Button>
        <p className="text-[11px] text-muted-foreground text-center">Could not load Google Identity Services.</p>
      </div>
    )
  }

  // No client ID configured — show setup help
  if (!clientId) {
    return (
      <div className="w-full space-y-1.5">
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 rounded-xl border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 text-sm font-medium gap-2.5 hover:bg-amber-100 dark:hover:bg-amber-950/30"
          onClick={() => setShowSetupHelp((s) => !s)}
        >
          <AlertCircle className="h-4 w-4" />
          <span>Continue with Google — Setup Required</span>
        </Button>
        {showSetupHelp && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-3 text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
            <p className="font-semibold mb-1">To enable real Google Sign-In:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Open <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="underline">Google Cloud Console</a></li>
              <li>Create an OAuth 2.0 Client ID (Web application)</li>
              <li>Add this site to Authorized JavaScript origins</li>
              <li>Add <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to your <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">.env</code></li>
              <li>Restart the dev server</li>
            </ol>
            <p className="mt-1.5 text-amber-700 dark:text-amber-400">Until configured, use email sign-up — it works fully.</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full space-y-2">
      {/* Official Google rendered button (opens account chooser / consent) */}
      <div className="flex justify-center min-h-[44px]">
        {scriptLoaded ? (
          <div
            ref={buttonContainerRef}
            className="gis-button-wrapper w-full [&>div]:!w-full [&>div>div[role=button]]:!w-full [&>div>div[role=button]]:!rounded-xl [&>div>div[role=button]]:!h-11"
          />
        ) : (
          <Button variant="outline" className="w-full h-11 rounded-xl" disabled>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading Google…</span>
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Connecting to Google…</span>
        </div>
      )}

      {/* Hidden fallback button (used if renderButton fails on some browsers) */}
      <button type="button" onClick={handleFallbackClick} className="sr-only" aria-hidden="true" tabIndex={-1}>
        Fallback
      </button>
    </div>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  )
}
