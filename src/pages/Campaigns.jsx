import { useEffect, useState, useRef } from 'react'
import { getSupabase } from '../lib/supabase'
import { initConfig, getConfig } from '../lib/config'
import {
  Megaphone, Plus, RefreshCw, UploadCloud, X,
  Users, Send, CheckCheck, BookOpen, XCircle
} from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = (status || '').toLowerCase()
  const map = {
    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 bg-dot-emerald',
    running:   'bg-accent/10 text-accent border-accent/20',
    pending:   'bg-warm-bg text-warm border-warm-border',
    failed:    'bg-hot-bg text-hot border-hot-border',
  }
  const dotMap = {
    completed: 'bg-emerald-400',
    running:   'bg-accent',
    pending:   'bg-warm',
    failed:    'bg-hot',
  }
  const cls = map[s] || 'bg-muted/40 text-text-secondary border-border'
  const dot = dotMap[s] || 'bg-text-dim'
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status || 'unknown'}
    </span>
  )
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────
function Stat({ icon: Icon, label, value, colorClass = 'text-text-secondary' }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[48px]">
      <div className={`flex items-center gap-1 ${colorClass}`}>
        <Icon size={12} />
        <span className="font-mono text-xs font-semibold">{value ?? 0}</span>
      </div>
      <span className="text-[10px] text-text-dim font-mono uppercase tracking-wide">{label}</span>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-11 h-11 rounded-full bg-muted/40 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-muted/40 rounded w-1/2" />
          <div className="h-3 bg-muted/30 rounded w-1/3" />
        </div>
        <div className="h-5 w-20 bg-muted/30 rounded-full" />
      </div>
      <div className="flex gap-6 pt-3 border-t border-border/50">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="h-3.5 w-8 bg-muted/40 rounded" />
            <div className="h-2.5 w-10 bg-muted/30 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Campaign Card ────────────────────────────────────────────────────────────
function CampaignCard({ campaign }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-muted transition-colors shadow-sm">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
            <Megaphone size={20} className="text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-bold text-lg text-text-primary truncate pr-4">
              {campaign.audience || `Campaign #${campaign.id?.split('-')[0]}`}
            </h3>
            <p className="text-xs text-text-secondary mt-0.5 truncate">
              Template:{' '}
              <span className="text-text-primary font-mono">
                {campaign.templates?.name || '—'}
              </span>
            </p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <StatusBadge status={campaign.status} />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 md:gap-6 pt-3.5 border-t border-border/60">
        <Stat icon={Users}      label="Total"     value={campaign.total_contacts} colorClass="text-text-secondary" />
        <Stat icon={Send}       label="Sent"      value={campaign.sent}           colorClass="text-accent" />
        <Stat icon={CheckCheck} label="Delivered" value={campaign.delivered}      colorClass="text-emerald-400" />
        <Stat icon={BookOpen}   label="Read"      value={campaign.read_count}     colorClass="text-warm" />
        <Stat icon={XCircle}    label="Failed"    value={campaign.failed}         colorClass="text-hot" />
        <span className="ml-auto text-xs text-text-dim font-mono flex-shrink-0">{fmtDate(campaign.created_at)}</span>
      </div>
    </div>
  )
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────
function parseCSV(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      const lines = text.split(/\r?\n/).filter(l => l.trim())
      if (lines.length < 2) return resolve([])

      const separator = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ','
      const headers = lines[0].split(separator).map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''))
      
      // Look for any common variation of phone number column
      const phoneIdx = headers.findIndex(h => 
        h.includes('phone') || 
        h.includes('mobile') || 
        h.includes('number') || 
        h.includes('contact') || 
        h.includes('whatsapp')
      )
      
      if (phoneIdx === -1) {
        return reject(new Error('Could not find a phone/mobile column in your CSV.'))
      }

      const phones = lines.slice(1)
        .map(line => {
          const cols = line.split(separator)
          let val = (cols[phoneIdx] || '').trim()
          // Remove surrounding quotes
          val = val.replace(/^["']|["']$/g, '')
          // Remove spaces, dashes, parentheses and + prefix
          return val.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '')
        })
        .filter(Boolean)

      resolve(phones)
    }
    reader.onerror = () => reject(new Error('Failed to read file.'))
    reader.readAsText(file)
  })
}

// ─── Campaign Modal ───────────────────────────────────────────────────────────
function CampaignModal({ approvedTemplates, onClose, onSuccess }) {
  const [name, setCampaignName]   = useState('')
  const [templateId, setTemplateId] = useState('')
  const [audienceType, setAudienceType] = useState('all')
  const [csvFile, setCsvFile]     = useState(null)
  const [manualContacts, setManualContacts] = useState('')
  const [sending, setSending]     = useState(false)
  const [error, setError]         = useState('')
  const fileInputRef              = useRef(null)

  // Derived: selected template object
  const selectedTemplate = approvedTemplates.find(t => t.id === templateId)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // Validation
    if (!name.trim()) return setError('Campaign name is required.')
    if (!templateId)  return setError('Please select a template.')
    if (audienceType === 'csv' && !csvFile) return setError('Please upload a CSV file.')
    if (audienceType === 'manual' && !manualContacts.trim()) return setError('Please enter at least one phone number.')

    setSending(true)
    try {
      let contacts = []
      if (audienceType === 'csv') {
        contacts = await parseCSV(csvFile)
        if (contacts.length === 0) throw new Error('CSV has no valid phone numbers.')
      } else if (audienceType === 'manual') {
        contacts = manualContacts
          .split(/[\n,]+/)
          .map(n => n.trim().replace(/[\s\-\(\)]/g, '').replace(/^\+/, ''))
          .filter(Boolean)
        if (contacts.length === 0) throw new Error('No valid phone numbers found.')
      }

      const webhookUrl = getConfig('n8n_bulk_campaign_webhook_url')
      if (!webhookUrl) throw new Error('Bulk webhook URL is not configured in Settings.')

      const payload = {
        campaign_name: name.trim(),
        template_name: selectedTemplate?.name || '',
        language:      selectedTemplate?.language || '',
        contacts,
        audience_type: audienceType,
      }

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error(`Webhook error: ${res.status} ${res.statusText}`)

      onSuccess()
    } catch (err) {
      setError(err.message || 'Failed to send campaign.')
    } finally {
      setSending(false)
    }
  }

  function handleFileChange(e) {
    const f = e.target.files[0]
    if (f && !f.name.endsWith('.csv')) {
      setError('Please upload a valid .csv file.')
      return
    }
    setCsvFile(f || null)
    setError('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-void/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl animate-fade-up overflow-hidden">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Megaphone size={15} className="text-accent" />
            </div>
            <h2 className="font-display font-bold text-text-primary">New Campaign</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-dim hover:text-text-primary hover:bg-muted/40 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Campaign Name */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Campaign Name <span className="text-hot">*</span>
            </label>
            <input
              value={name}
              onChange={e => setCampaignName(e.target.value)}
              placeholder="e.g. April Promo"
              className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder-text-dim focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/10 transition-colors"
            />
          </div>

          {/* Template Dropdown */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Template <span className="text-hot">*</span>
            </label>
            <select
              value={templateId}
              onChange={e => setTemplateId(e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/10 transition-colors appearance-none cursor-pointer"
            >
              <option value="" disabled>Select an approved template</option>
              {approvedTemplates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {approvedTemplates.length === 0 && (
              <p className="text-xs text-text-dim mt-1.5 font-mono">No approved templates available.</p>
            )}
          </div>

          {/* Audience Radio */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2.5">Audience</label>
            <div className="space-y-2.5">
              {[
                {
                  value: 'all',
                  title: 'All Contacts',
                  desc: 'Send to all contacts in database',
                },
                {
                  value: 'csv',
                  title: 'Upload CSV',
                  desc: 'Upload a CSV with phone numbers',
                },
                {
                  value: 'manual',
                  title: 'Manual Entry',
                  desc: 'Type or paste phone numbers directly',
                },
              ].map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    audienceType === opt.value
                      ? 'border-accent/40 bg-accent/5'
                      : 'border-border hover:border-muted bg-card/50'
                  }`}
                >
                  {/* Custom radio */}
                  <div className="mt-0.5 flex-shrink-0">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                        audienceType === opt.value ? 'border-accent' : 'border-text-dim'
                      }`}
                      onClick={() => setAudienceType(opt.value)}
                    >
                      {audienceType === opt.value && (
                        <div className="w-2 h-2 rounded-full bg-accent" />
                      )}
                    </div>
                  </div>
                  <div onClick={() => setAudienceType(opt.value)}>
                    <p className="text-sm font-medium text-text-primary">{opt.title}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* CSV Upload (conditional) */}
          {audienceType === 'csv' && (
            <div>
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload-input"
              />
              <label
                htmlFor="csv-upload-input"
                className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors text-center ${
                  csvFile
                    ? 'border-accent/40 bg-accent/5'
                    : 'border-border hover:border-muted bg-card/50'
                }`}
              >
                <UploadCloud size={26} className={csvFile ? 'text-accent' : 'text-text-dim'} />
                {csvFile ? (
                  <div>
                    <p className="text-sm font-medium text-accent">{csvFile.name}</p>
                    <p className="text-xs text-text-secondary mt-0.5">Click to change file</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-text-primary font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-text-dim mt-0.5">.csv files only</p>
                  </div>
                )}
              </label>
            </div>
          )}

          {/* Manual Entry (conditional) */}
          {audienceType === 'manual' && (
            <div>
              <textarea
                value={manualContacts}
                onChange={e => setManualContacts(e.target.value)}
                placeholder="Enter phone numbers, separated by commas or new lines&#10;e.g. 919876543210, 911234567890"
                rows={4}
                className="w-full bg-card border border-border rounded-xl p-4 text-sm text-text-primary placeholder-text-dim focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/10 transition-colors resize-y shadow-sm"
              />
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-2.5 bg-hot-bg border border-hot-border rounded-lg px-4 py-3">
              <XCircle size={15} className="text-hot flex-shrink-0 mt-0.5" />
              <p className="text-sm text-hot">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2.5 pt-1">
            <button
              type="submit"
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 bg-accent text-void font-bold rounded-lg px-4 py-3 hover:bg-accent/90 transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Megaphone size={16} />
                  Send Campaign
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="w-full py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-muted/30 border border-border hover:border-muted transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Campaigns() {
  const [campaigns, setCampaigns]         = useState([])
  const [approvedTemplates, setApprovedTemplates] = useState([])
  const [loading, setLoading]             = useState(true)
  const [refreshing, setRefreshing]       = useState(false)
  const [isModalOpen, setIsModalOpen]     = useState(false)

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => fetchData(false), 10000)
    return () => clearInterval(interval)
  }, [])

  async function fetchData(showLoading = true) {
    if (showLoading) setLoading(true)
    try {
      // Ensure the live Supabase client is ready before querying
      await initConfig()
      const supabase = getSupabase()

      const [campRes, templRes] = await Promise.all([
        supabase
          .from('campaigns')
          .select('*, templates(name, language)')
          .order('created_at', { ascending: false }),
        supabase
          .from('templates')
          .select('id, name, language, status'),
      ])

      if (campRes.error) {
        console.error('[Campaigns] campaigns fetch error:', campRes.error.message, campRes.error)
      } else {
        setCampaigns(campRes.data || [])
      }

      if (templRes.error) {
        console.error('[Campaigns] templates fetch error:', templRes.error.message, templRes.error)
      } else {
        const templatesData = templRes.data || []
        // Filter case-insensitive 'approved' status
        const approved = templatesData.filter(t => (t.status || '').toUpperCase() === 'APPROVED')
        setApprovedTemplates(approved)
      }
    } catch (err) {
      console.error('[Campaigns] Fetch failed:', err)
    } finally {
      if (showLoading) setLoading(false)
      setRefreshing(false)
    }
  }

  function handleRefresh() {
    setRefreshing(true)
    fetchData(false)
  }

  function handleModalSuccess() {
    setIsModalOpen(false)
    setTimeout(() => fetchData(false), 2000)
  }

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-up">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary tracking-tight">Campaigns</h1>
          <p className="text-text-secondary text-sm mt-1">Manage and send bulk WhatsApp campaigns</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Refresh */}
          <button
            onClick={handleRefresh}
            title="Refresh"
            className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-muted transition-colors"
          >
            <RefreshCw size={17} className={refreshing ? 'animate-spin' : ''} />
          </button>
          {/* New Campaign */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent text-void font-semibold text-sm rounded-lg hover:bg-accent/90 transition-colors shadow-glow"
          >
            <Plus size={17} />
            New Campaign
          </button>
        </div>
      </div>

      {/* ── Campaign List ── */}
      <div className="space-y-4 animate-fade-up">
        {loading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} />)
        ) : campaigns.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-72 bg-card border border-dashed border-border rounded-2xl text-center p-8">
            <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
              <Megaphone size={30} className="text-accent" />
            </div>
            <p className="font-display font-semibold text-text-primary text-lg">No campaigns yet</p>
            <p className="text-text-secondary text-sm mt-2 mb-6">Create your first campaign to get started</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent text-void font-semibold text-sm rounded-lg hover:bg-accent/90 transition-colors shadow-glow"
            >
              <Plus size={16} />
              New Campaign
            </button>
          </div>
        ) : (
          campaigns.map(campaign => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))
        )}
      </div>

      {/* ── Modal ── */}
      {isModalOpen && (
        <CampaignModal
          approvedTemplates={approvedTemplates}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  )
}
