/**
 * Supabase client
 *
 * Two-phase initialization:
 *  1. Bootstrap client — created immediately from .env vars so the app
 *     can start and fetch app_config from Supabase.
 *  2. Live client — recreated by config.js after app_config loads,
 *     using the supabase_anon_key stored in the table.
 *     All pages import `getSupabase()` so they always use the
 *     most up-to-date client.
 *
 * Direct `supabase` export is kept for the bootstrap phase only
 * (used by config.js itself to fetch app_config).
 */

import { createClient } from '@supabase/supabase-js'

const BOOTSTRAP_URL  = import.meta.env.VITE_SUPABASE_URL
const BOOTSTRAP_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY

// Bootstrap client — always available, used to fetch app_config
export const supabase = createClient(BOOTSTRAP_URL, BOOTSTRAP_KEY)

// Live client reference — starts as the bootstrap client,
// replaced by config.js once app_config has loaded
let _liveClient = supabase

/**
 * Replace the live client with one using the key from app_config.
 * Called by config.js after it fetches the config table.
 * @param {string} anonKey
 */
export function reinitClient(anonKey) {
  if (!anonKey || anonKey === BOOTSTRAP_KEY) return
  _liveClient = createClient(BOOTSTRAP_URL, anonKey)
}

/**
 * Returns the live Supabase client.
 * Pages should call this instead of importing `supabase` directly.
 */
export function getSupabase() {
  return _liveClient
}
