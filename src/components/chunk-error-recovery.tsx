'use client'

import { useEffect } from 'react'

/**
 * Global ChunkLoadError recovery.
 *
 * When the dev server rebuilds (or the `.next` cache is cleared), the
 * content-hashed chunk filenames change. A browser that has an older HTML
 * shell cached may still try to fetch chunk URLs that no longer exist on the
 * server, producing `ChunkLoadError` / "Loading chunk X failed" and surfacing
 * to the user as: "Application error: a client-side exception has occurred".
 *
 * This component listens for those errors and performs a single cache-busting
 * reload so the browser picks up the fresh HTML + chunks.
 */
export function ChunkErrorRecovery() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const isChunkError = (message: string) =>
      typeof message === 'string' &&
      (message.includes('ChunkLoadError') ||
        /Loading chunk\s+\d+\s+failed/i.test(message) ||
        /Loading CSS chunk\s+\d+\s+failed/i.test(message) ||
        /Failed to fetch dynamically imported module/i.test(message) ||
        /Importing a module script failed/i.test(message))

    // Already reloaded once for a chunk error — don't loop forever.
    const alreadyReloaded = window.location.search.includes('__chunk_reload=1')

    const reloadWithBust = () => {
      if (alreadyReloaded) return
      try {
        const url = new URL(window.location.href)
        url.searchParams.set('__chunk_reload', '1')
        // Hard reload — bypass browser cache
        window.location.replace(url.toString())
      } catch {
        window.location.reload()
      }
    }

    const onWindowError = (event: ErrorEvent) => {
      const msg = event?.message ?? ''
      if (isChunkError(msg)) {
        reloadWithBust()
      }
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event?.reason
      const msg =
        typeof reason === 'string'
          ? reason
          : reason?.message ?? ''
      if (isChunkError(msg)) {
        reloadWithBust()
      }
    }

    window.addEventListener('error', onWindowError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)

    return () => {
      window.removeEventListener('error', onWindowError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

  return null
}
