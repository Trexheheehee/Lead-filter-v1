import { useEffect, useState } from 'react'
import { getSupabase } from '../lib/supabase'
import { clearConfigCache } from '../lib/config'
import { Settings as SettingsIcon, Save, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

const CONFIG_KEYS = [
  { key: 'supabase_url', label: 'Supabase URL', type: 'text' },
  { key: 'supabase_anon_key', label: 'Supabase Anon Key', type: 'password' },
  { key: 'n8n_webhook_url', label: 'n8n Webhook URL', type: 'text' },
  { key: 'n8n_bulk_campaign_webhook_url', label: 'n8n Bulk Webhook URL', type: 'text' },
  { key: 'whatsapp_token', label: 'WhatsApp Token', type: 'password' },
  { key: 'phone_number_id', label: 'Phone Number ID', type: 'text' }
]

export default function Settings() {
  const [config, setConfig] = useState({})
  const [originalConfig, setOriginalConfig] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(false)
  const [visibleFields, setVisibleFields] = useState({})

  useEffect(() => {
    fetchConfig()
  }, [])

  async function fetchConfig() {
    setLoading(true)
    const { data } = await getSupabase().from('app_config').select('key, value')
    if (data) {
      const configMap = data.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {})
      setConfig(configMap)
      setOriginalConfig(configMap)
    }
    setLoading(false)
  }

  function handleConfigChange(key, value) {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  function toggleVisibility(key) {
    setVisibleFields(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSave() {
    setSaving(true)
    const supabase = getSupabase()

    try {
      const updates = CONFIG_KEYS.map(({ key }) => ({
        key,
        value: config[key] || '',
        updated_at: new Date().toISOString()
      }))

      // Upsert all keys
      for (const record of updates) {
        await supabase
          .from('app_config')
          .upsert(record, { onConflict: 'key' })
      }

      setOriginalConfig(config)
      clearConfigCache() // Force App to refetch next load
      
      setToast(true)
      setTimeout(() => setToast(false), 3000)
    } catch (e) {
      console.error('Save failed', e)
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig)

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto h-full overflow-y-auto animate-fade-up">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary tracking-tight">Settings</h1>
          <p className="text-text-secondary text-sm mt-1">Manage system integrations and secrets</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
          <SettingsIcon size={24} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
        <h2 className="text-lg font-medium text-text-primary mb-6 border-b border-border pb-4">
          Environment Configuration
        </h2>

        {loading ? (
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-surface border border-border rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {CONFIG_KEYS.map(({ key, label, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {label}
                </label>
                <div className="relative">
                  <input
                    type={type === 'password' && !visibleFields[key] ? 'password' : 'text'}
                    value={config[key] || ''}
                    onChange={(e) => handleConfigChange(key, e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-dim focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all font-mono text-sm"
                    placeholder={`Enter ${label}`}
                  />
                  {type === 'password' && (
                    <button
                      onClick={() => toggleVisibility(key)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-primary transition-colors p-1"
                    >
                      {visibleFields[key] ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div className="pt-6 border-t border-border flex items-center justify-between">
              <p className="text-xs text-text-dim max-w-sm">
                Changes to Supabase credentials will require a page reload to take effect globally.
              </p>
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-accent text-void font-bold rounded-lg hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-glow"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Success Toast */}
      {toast && (
        <div className="fixed bottom-8 right-8 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-fade-up z-50">
          <CheckCircle2 size={20} />
          <span className="font-medium">Settings saved successfully</span>
        </div>
      )}
    </div>
  )
}
