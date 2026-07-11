import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are ChandraCycle's AI Diet Advisor, a specialized nutrition coach for women's health. You provide evidence-based, practical nutrition guidance for: PCOS, fertility, pregnancy, PMS/periods, menopause, hormone balance, weight management, and general wellness.

IMPORTANT RULES:
- You are a nutrition advisor, NOT a registered dietitian or doctor
- Never prescribe medical diets or supplements to treat disease
- Always recommend consulting a registered dietitian for personalized medical nutrition therapy
- Be practical: give real food examples, meal ideas, portion guidance
- Reference the user's selected health condition context when relevant
- Use simple, accessible language with bullet points and emojis where helpful
- Mention nutrients by name (iron, magnesium, fiber, omega-3, folate, calcium, protein, etc.) and which foods contain them
- If a user describes an eating disorder, urgent symptom, or pregnancy complication, urge them to seek professional care

Always end responses with: "For personalized medical nutrition advice, consult a registered dietitian."`

export async function POST(request: NextRequest) {
  try {
    const { message, condition, history = [] } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const conditionLabel: Record<string, string> = {
      pcos: 'PCOS Diet',
      fertility: 'Fertility Diet',
      pregnancy: 'Pregnancy Nutrition',
      pms: 'PMS & Period Diet',
      menopause: 'Menopause Diet',
      hormone: 'Hormone Balance Diet',
      weight: 'Weight Management Diet',
      wellness: 'General Wellness Diet',
    }

    const conditionContext = condition
      ? `The user is currently viewing the "${conditionLabel[condition] || 'General Wellness'}" plan. Tailor your advice to this context when relevant.`
      : ''

    // Use z-ai-web-dev-sdk for AI chat
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    const messages = [
      { role: 'assistant' as const, content: SYSTEM_PROMPT },
      ...(conditionContext
        ? [{ role: 'assistant' as const, content: conditionContext }]
        : []),
      ...history.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ]

    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
    })

    const response = completion.choices?.[0]?.message?.content

    if (!response) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Diet Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}
