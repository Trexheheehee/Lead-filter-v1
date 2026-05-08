/**
 * App Config — fetches key/value pairs from Supabase `app_config` table
 * and caches them in memory for the lifetime of the session.
 *
 * After loading, it also calls reinitClient() so that all subsequent
 * Supabase queries (via getSupabase()) use the anon key stored in
 * the config table rather than the bootstrap env var.
 *
 * Usage:
 *   import { initConfig, getConfig } from './lib/config'
 *   await initConfig()              // called once in App.jsx on mount
 *   getConfig('n8n_webhook_url')    // read anywhere after init
 */

import { supabase, reinitClient } from './supabase'

let _cache = null

/**
 * Load all rows from app_config into the in-memory cache.
 * Safe to call multiple times — only fetches once per session.
 */
export async function initConfig() {
  if (_cache) return _cache

  const { data, error } = await supabase
    .from('app_config')
    .select('key, value')

  if (error) {
    console.warn('[config] Failed to load app_config:', error.message)
    _cache = {}
    return _cache
  }

  _cache = Object.fromEntries((data || []).map(row => [row.key, row.value]))

  // 🔑 Reinitialize the Supabase live client with the stored anon key
  // so all subsequent app queries use the tenant-specific key.
  if (_cache.supabase_anon_key) {
    reinitClient(_cache.supabase_anon_key)
  }

  return _cache
}

/**
 * Retrieve a value from the cached config.
 * Returns undefined if key doesn't exist or initConfig hasn't been called.
 * @param {string} key
 * @returns {string | undefined}
 */
export function getConfig(key) {
  return _cache?.[key]
}

/**
 * Invalidate the in-memory cache.
 * Call this after saving new values in the Settings page so the next
 * initConfig() re-fetches fresh data from Supabase.
 */
export function clearConfigCache() {
  _cache = null
}
