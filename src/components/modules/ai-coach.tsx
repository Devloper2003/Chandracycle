'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  MessageCircle,
  Send,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Bot,
  User,
  Lightbulb,
  Moon,
  Apple,
  Stethoscope,
  Activity,
  Brain,
  Heart,
  MapPin,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const quickPrompts = [
  { icon: Moon, label: 'Improve my sleep', prompt: 'How can I improve my sleep quality during my cycle?' },
  { icon: Apple, label: 'PMS-friendly foods', prompt: 'What foods help with PMS symptoms?' },
  { icon: Stethoscope, label: 'When to see a doctor', prompt: 'What symptoms should prompt me to see a doctor about my cycle?' },
  { icon: Activity, label: 'Track the right things', prompt: 'What symptoms should I be tracking for better health insights?' },
  { icon: Brain, label: 'Understand my hormones', prompt: 'Can you explain how my hormone levels change through my cycle?' },
  { icon: Heart, label: 'Manage cycle anxiety', prompt: 'How can I manage anxiety that seems tied to my cycle?' },
]

// Chat starts empty — a friendly greeting + suggested prompts are shown in the
// empty-state UI below the chat input. No fake previous messages.
const initialMessages: Message[] = []

export default function CoachModule() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const userProfile = useAppStore((s) => s.userProfile)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Build history for context (last 10 messages)
      const history = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history,
        }),
      })

      const data = await response.json()

      if (data.success && data.response) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        // Fallback response
        const fallbackMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I'm here for you! While I process your question, remember that staying hydrated, getting enough sleep, and tracking your symptoms consistently can make a big difference in understanding your health. 💚\n\n*This is general wellness information. Please consult a healthcare professional for medical advice.*",
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, fallbackMessage])
      }
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I appreciate your question! While I'm having trouble connecting right now, I'd recommend checking your tracked symptoms in the app for patterns. For any health concerns, please consult with your healthcare provider. 💚",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const resetConversation = () => {
    setMessages(initialMessages)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">AI Health Coach</h2>
          <p className="text-sm text-muted-foreground">Powered by AI • Your wellness companion</p>
        </div>
        <Button variant="ghost" size="sm" onClick={resetConversation} className="text-muted-foreground">
          <RotateCcw className="h-4 w-4 mr-1" /> Reset
        </Button>
      </div>

      {/* Safety Banner */}
      <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-2.5">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          AI Coach provides wellness guidance, not medical diagnosis. Always consult a healthcare professional for medical concerns.
        </p>
      </div>

      {/* Chat Container */}
      <Card className="border-0 glass shadow-lg overflow-hidden">
        <CardContent className="p-0">
          {/* Messages Area */}
          <ScrollArea className="h-[480px] p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 mb-3">
                    <Sparkles className="h-6 w-6 text-emerald-600" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Hi{userProfile?.name ? `, ${userProfile.name.split(' ')[0]}` : ''}! I&apos;m your AI Health Coach 💚
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Ask me anything about your cycle, mood, nutrition, or fitness. Tap a suggested prompt below to get started.
                  </p>
                </div>
              )}
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  {/* Avatar */}
                  <div className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    message.role === 'assistant'
                      ? 'bg-emerald-100 dark:bg-emerald-900/50'
                      : 'bg-primary/10'
                  )}>
                    {message.role === 'assistant' ? (
                      <Bot className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <User className="h-4 w-4 text-primary" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-3',
                    message.role === 'assistant'
                      ? 'bg-muted/50 rounded-tl-sm'
                      : 'bg-primary text-primary-foreground rounded-tr-sm'
                  )}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    <p className={cn(
                      'text-[10px] mt-1.5',
                      message.role === 'assistant' ? 'text-muted-foreground' : 'text-primary-foreground/60'
                    )}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex gap-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                      <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" />
                    </div>
                    <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>

          <Separator />

          {/* Quick Prompts */}
          <div className="px-4 py-3">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {quickPrompts.map((prompt) => (
                <Button
                  key={prompt.label}
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-xs h-8 gap-1.5 rounded-full"
                  onClick={() => sendMessage(prompt.prompt)}
                  disabled={isLoading}
                >
                  <prompt.icon className="h-3 w-3" />
                  {prompt.label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 p-4">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your health..."
              className="flex-1 rounded-full bg-muted/50 border-0 focus-visible:ring-1"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
              disabled={isLoading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Coaching Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: '🩸', label: 'Period Health', desc: 'Cycle & period guidance' },
          { icon: '🧠', label: 'Mental Wellness', desc: 'Mood & stress support' },
          { icon: '🥗', label: 'Nutrition', desc: 'Diet & supplement tips' },
          { icon: '🏃‍♀️', label: 'Exercise', desc: 'Phase-based fitness' },
        ].map((cat) => (
          <Card key={cat.label} className="glass border-0 cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <span className="text-2xl">{cat.icon}</span>
              <p className="font-medium text-sm mt-1">{cat.label}</p>
              <p className="text-[10px] text-muted-foreground">{cat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Consult Doctor CTA */}
      <Card className="border-0 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 shadow-md">
        <CardContent className="p-5 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/50 shrink-0">
            <Stethoscope className="h-6 w-6 text-teal-600" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-semibold text-sm">Facing a high-severity issue?</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Connect with trusted healthcare specialists near you. Book appointments or video consultations instantly.
            </p>
          </div>
          <Button
            onClick={() => useAppStore.getState().setActiveModule('doctors')}
            className="bg-teal-600 hover:bg-teal-700 text-white shrink-0"
            size="sm"
          >
            <MapPin className="h-4 w-4 mr-1" /> Find a Doctor
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
