/**
 * Admin Sync Helper — sends events from the main website to the admin panel.
 * Both apps share the same Neon PostgreSQL database, so data is immediately visible.
 * This helper additionally notifies the admin panel of key events for audit logging.
 */

const ADMIN_SYNC_URL = process.env.ADMIN_SYNC_URL || "https://admin.chandracycle.app/api/admin/sync"
const SYNC_API_KEY = process.env.SYNC_API_KEY || "chandracycle_sync_secret_2026"

type SyncEvent =
  | { event: "user.registered"; data: { email: string; name?: string; userId: string } }
  | { event: "user.login"; data: { email: string } }
  | { event: "payment.completed"; data: { txnId?: string; orderId?: string; userId?: string; userEmail?: string; userName?: string; amount: number; currency?: string; status?: string; method?: string; gateway?: string; description?: string } }
  | { event: "subscription.activated"; data: { userId: string; tier?: string; plan?: string; endDate?: string } }
  | { event: "subscription.cancelled"; data: { userId: string } }

export async function syncToAdmin(payload: SyncEvent): Promise<void> {
  try {
    await fetch(ADMIN_SYNC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sync-api-key": SYNC_API_KEY,
      },
      body: JSON.stringify(payload),
    })
  } catch (e) {
    // Silent fail — sync is best-effort, the shared DB already has the data
    console.error("[admin-sync] Failed to sync:", e)
  }
}
