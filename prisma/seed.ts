import { db } from '@/lib/db'

// ChandraCycle database seed.
//
// IMPORTANT: This seed intentionally creates ZERO demo data.
// A brand-new ChandraCycle installation starts completely empty —
// no demo users, no fake cycles, no sample community posts, no mock
// notifications. Every new user who signs up starts with a clean slate
// and builds their own health history from scratch.
//
// This script exists only so that `bun run db:seed` does not error out
// on fresh setups. It simply verifies the database connection and exits.

async function seed() {
  console.log('🌱 ChandraCycle — verifying database connection...')

  // A trivial query to confirm the schema is pushed and the DB is reachable.
  const userCount = await db.user.count()
  console.log(`✅ Database connected. Current users: ${userCount}`)
  console.log('ℹ️  No demo data created — every new user starts fresh.')
}

seed()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
