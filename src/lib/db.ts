import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Only log queries in development — logging in production wastes resources
// and leaks SQL to Vercel logs.
export const db =
  globalForPrisma.prisma ??
  new PrismaClient(
    process.env.NODE_ENV === 'development'
      ? { log: ['warn', 'error'] }
      : { log: ['error'] }
  )

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db