'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'

const SESSION_KEY = 'chandracycle-splash-seen'
const DURATION_MS = 1500

export default function SplashScreen() {
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    // Desktop skips the splash entirely.
    if (window.matchMedia('(min-width: 1024px)').matches) return
    // Only show once per session.
    if (window.sessionStorage.getItem(SESSION_KEY) === '1') return

    setVisible(true)
    const t = window.setTimeout(() => {
      setVisible(false)
      try {
        window.sessionStorage.setItem(SESSION_KEY, '1')
      } catch {
        /* ignore storage errors */
      }
    }, DURATION_MS)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="chandracycle-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="lg:hidden fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600 text-white"
        >
          {/* Decorative glow blobs */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-amber-300/30 blur-3xl" />

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.05 }}
            className="relative flex h-24 w-24 items-center justify-center rounded-[28px] bg-white/15 backdrop-blur-md shadow-2xl shadow-rose-900/30 ring-1 ring-white/40"
          >
            <span className="text-5xl font-serif font-bold drop-shadow">C</span>
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 20 }}
              className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-amber-300 text-amber-900 shadow-lg"
            >
              <Sparkles className="h-4 w-4" />
            </motion.span>
          </motion.div>

          {/* Wordmark */}
          <motion.h1
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.45, ease: 'easeOut' }}
            className="mt-6 text-3xl font-semibold tracking-tight drop-shadow-sm"
          >
            ChandraCycle
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.45, ease: 'easeOut' }}
            className="mt-1.5 text-sm font-light text-white/85"
          >
            AI Women&apos;s Health Companion
          </motion.p>

          {/* Loader dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="absolute bottom-16 flex items-center gap-1.5"
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-2 w-2 rounded-full bg-white/90"
                animate={{ scale: [0.6, 1.1, 0.6], opacity: [0.4, 1, 0.4] }}
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  delay: i * 0.18,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
