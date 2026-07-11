'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'

// ─── PayPal JS SDK type declarations ─────────────────────────────────────────
declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        style?: {
          layout?: 'vertical' | 'horizontal'
          color?: 'gold' | 'blue' | 'silver' | 'white' | 'black'
          shape?: 'rect' | 'pill'
          label?: 'paypal' | 'pay' | 'checkout' | 'installment'
          height?: number
        }
        createOrder?: () => Promise<string>
        onApprove?: (data: { orderID: string }, actions: { order?: { capture?: () => Promise<unknown> } }) => Promise<void> | void
        onCancel?: () => void
        onError?: (err: unknown) => void
      }) => {
        render: (selector: HTMLElement) => Promise<void>
        close: () => Promise<void>
      }
    }
  }
}

interface PaypalSmartButtonsProps {
  /** Fired when the buyer clicks the PayPal button — must return a PayPal orderID. */
  onCreateOrder: () => Promise<string>
  /** Fired when PayPal approves the order (buyer logged in + consented). */
  onApprove: (orderID: string) => void | Promise<void>
  /** Fired when the buyer closes the PayPal popup. */
  onCancel?: () => void
  /** Fired when PayPal SDK errors. */
  onError?: (err: unknown) => void
  /** Optional height for the button (default 45). */
  height?: number
}

let scriptPromise: Promise<void> | null = null
function loadPaypalScript(clientId: string): Promise<void> {
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('no window'))
    if (window.paypal?.Buttons) return resolve()
    const src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture&components=buttons`
    const existing = document.querySelector(`script[src^="https://www.paypal.com/sdk/js?client-id="]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load PayPal SDK')))
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load PayPal SDK script'))
    document.head.appendChild(script)
  })
  return scriptPromise
}

export function PaypalSmartButtons({
  onCreateOrder,
  onApprove,
  onCancel,
  onError,
  height = 45,
}: PaypalSmartButtonsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [clientId, setClientId] = useState<string>('')
  const [sdkReady, setSdkReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const buttonsRef = useRef<{ close: () => Promise<void> } | null>(null)

  // Keep latest callbacks in refs so the PayPal button config always uses fresh
  // closures (PayPal Buttons only read the config once at render time).
  const createOrderRef = useRef(onCreateOrder)
  const onApproveRef = useRef(onApprove)
  const onCancelRef = useRef(onCancel)
  const onErrorRef = useRef(onError)
  useEffect(() => {
    createOrderRef.current = onCreateOrder
    onApproveRef.current = onApprove
    onCancelRef.current = onCancel
    onErrorRef.current = onError
  })

  // 1. Fetch the public PayPal client id from our config endpoint
  useEffect(() => {
    let cancelled = false
    async function fetchConfig() {
      try {
        const res = await fetch('/api/payment/paypal', { method: 'GET' })
        const data = await res.json().catch(() => ({}))
        if (!cancelled) {
          if (data.configured && data.publicClientId) {
            setClientId(data.publicClientId)
          } else {
            setLoadError(data.error || 'PayPal is not configured on the server.')
          }
        }
      } catch {
        if (!cancelled) setLoadError('Could not reach the payment server.')
      }
    }
    fetchConfig()
    return () => {
      cancelled = true
    }
  }, [])

  // 2. Load the PayPal JS SDK once we have a client id
  useEffect(() => {
    if (!clientId) return
    loadPaypalScript(clientId)
      .then(() => setSdkReady(true))
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load PayPal.'))
  }, [clientId])

  // 3. Render the Smart Buttons into the container
  useEffect(() => {
    if (!sdkReady || !window.paypal?.Buttons || !containerRef.current) return

    let cancelled = false
    let buttons: { close: () => Promise<void> } | null = null

    try {
      buttons = window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'pill',
          label: 'paypal',
          height,
        },
        createOrder: async () => {
          try {
            const orderID = await createOrderRef.current()
            return orderID
          } catch (err) {
            onErrorRef.current?.(err)
            throw err
          }
        },
        onApprove: async (data) => {
          await onApproveRef.current(data.orderID)
        },
        onCancel: () => {
          onCancelRef.current?.()
        },
        onError: (err) => {
          onErrorRef.current?.(err)
        },
      })
      buttonsRef.current = buttons
    } catch (err) {
      console.error('[paypal] Buttons init failed', err)
      // Defer the state update so we don't trigger a cascading render inside the effect.
      queueMicrotask(() => {
        if (!cancelled) setLoadError('Could not initialize PayPal.')
      })
      return
    }

    if (buttons && containerRef.current) {
      buttons.render(containerRef.current).catch((err) => {
        console.error('[paypal] render failed', err)
        if (!cancelled) setLoadError('Could not render PayPal buttons.')
      })
    }

    return () => {
      cancelled = true
      buttons?.close().catch(() => {})
      buttonsRef.current = null
    }
  }, [sdkReady, height])

  if (loadError) {
    return (
      <div className="w-full space-y-1.5">
        <div className="flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
          <Loader2 className="h-3.5 w-3.5" />
          <span>{loadError}</span>
        </div>
      </div>
    )
  }

  if (!sdkReady) {
    return (
      <div className="flex h-[45px] w-full items-center justify-center gap-2 rounded-full bg-[#ffc439] text-sm font-semibold text-[#2c2e2f]">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading PayPal…</span>
      </div>
    )
  }

  return <div ref={containerRef} className="w-full [&>div]:!w-full" />
}
