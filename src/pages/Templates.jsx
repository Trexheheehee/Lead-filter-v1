import { useEffect, useState } from 'react'
import { getSupabase } from '../lib/supabase'
import { initConfig } from '../lib/config'
import { FileText, ChevronRight, X, LayoutTemplate, Search } from 'lucide-react'

// ─── Status Badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = (status || '').toUpperCase()
  if (s === 'APPROVED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Approved
      </span>
    )
  }
  if (s === 'REJECTED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-hot-bg text-hot border border-hot-border">
        <span className="w-1.5 h-1.5 rounded-full bg-hot" />
        Rejected
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-warm-bg text-warm border border-warm-border">
      <span className="w-1.5 h-1.5 rounded-full bg-warm" />
      Pending
    </span>
  )
}

// ─── Pill ────────────────────────────────────────────────────────────────────
function Pill({ children }) {
  return (
    <span className="text-xs bg-muted/40 text-text-secondary px-2 py-0.5 rounded font-mono uppercase tracking-wide border border-border">
      {children}
    </span>
  )
}

// ─── Preview Panel ───────────────────────────────────────────────────────────
function PreviewPanel({ template, onClose }) {
  if (!template) return null
  return (
    <div className="w-full md:w-[420px] flex-shrink-0 bg-surface border-l border-border flex flex-col h-full animate-slide-in">
      {/* Header */}
      <div className="p-5 border-b border-border flex items-center justify-between bg-card/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
            <FileText size={15} className="text-accent" />
          </div>
          <h2 className="font-display font-semibold text-sm text-text-primary">Template Preview</h2>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-text-dim hover:text-text-primary hover:bg-muted/40 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Name + meta */}
        <div>
          <h3 className="font-display text-lg font-bold text-text-primary mb-3">{template.name}</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            <Pill>{template.category}</Pill>
            <Pill>{template.language}</Pill>
            <StatusBadge status={template.status} />
          </div>

          {/* Meta ID */}
          <div className="bg-card border border-border rounded-lg px-3 py-2">
            <p className="text-xs text-text-dim font-mono mb-0.5">Meta Template ID</p>
            <p className="text-xs text-text-secondary font-mono break-all">
              {template.meta_template_id || template.id}
            </p>
          </div>
        </div>

        {/* WhatsApp bubble mockup */}
        <div>
          <p className="text-xs font-mono text-text-dim uppercase tracking-wider mb-3">Preview</p>
          <div className="rounded-xl overflow-hidden border border-border" style={{ background: '#0b141a' }}>
            {/* WA header bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5" style={{ background: '#202c33' }}>
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xs text-text-secondary font-display font-bold">
                  {template.name?.[0]?.toUpperCase() || 'W'}
                </span>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-white/90">{template.name}</p>
                <p className="text-[10px] text-white/40">Business Account</p>
              </div>
            </div>

            {/* Chat area */}
            <div className="p-4 min-h-[140px]">
              {/* Bubble */}
              <div
                className="relative max-w-[85%] rounded-lg rounded-tl-none px-3.5 py-2.5 shadow-sm"
                style={{ background: '#005c4b' }}
              >
                <p className="text-[13px] leading-relaxed text-white whitespace-pre-wrap">
                  {template.content || 'No content available.'}
                </p>
                <p className="text-[10px] text-right text-white/50 mt-1.5 font-mono">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                </p>
                {/* Bubble tail */}
                <span
                  className="absolute -left-2 top-0 w-2 h-3"
                  style={{
                    background: '#005c4b',
                    clipPath: 'polygon(100% 0, 100% 100%, 0 0)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Created date */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-text-dim font-mono">Created</span>
          <span className="text-xs text-text-secondary font-mono">
            {new Date(template.created_at).toLocaleDateString('en-US', {
              day: 'numeric', month: 'short', year: 'numeric'
            })}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-muted/40 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-muted/40 rounded w-2/3" />
          <div className="h-3 bg-muted/30 rounded w-1/3" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-muted/30 rounded-full" />
        <div className="h-5 w-16 bg-muted/30 rounded-full" />
        <div className="h-5 w-20 bg-muted/30 rounded-full ml-auto" />
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Templates() {
  const [templates, setTemplates] = useState([])
  const [filtered, setFiltered]   = useState([])
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    fetchTemplates()
  }, [])

  // Apply search filter
  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      q ? templates.filter(t => t.name.toLowerCase().includes(q)) : templates
    )
  }, [search, templates])

  async function fetchTemplates() {
    setLoading(true)
    try {
      // Ensure the live Supabase client is ready before querying
      await initConfig()

      const { data, error } = await getSupabase()
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[Templates] Supabase error:', error.message, error)
      } else {
        setTemplates(data || [])
      }
    } catch (err) {
      console.error('[Templates] Fetch failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full animate-fade-up">
      {/* ── Left: Template List ── */}
      <div className={`flex-1 flex flex-col p-6 md:p-8 overflow-hidden ${selected ? 'hidden md:flex' : 'flex'}`}>

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-text-primary tracking-tight">Templates</h1>
          <p className="text-text-secondary text-sm mt-1">
            WhatsApp message templates synced from Meta
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder-text-dim focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>

        {/* Template Cards */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} />)
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-card border border-dashed border-border rounded-2xl text-center p-8">
              <LayoutTemplate size={42} className="text-text-dim mb-3" />
              <p className="text-text-primary font-medium">No templates found</p>
              <p className="text-text-secondary text-sm mt-1.5 max-w-xs">
                Templates are synced from Meta WhatsApp Manager automatically via n8n.
              </p>
            </div>
          ) : (
            filtered.map(template => (
              <button
                key={template.id}
                onClick={() => setSelected(template)}
                className={`w-full text-left bg-card border rounded-xl p-4 transition-all hover:shadow-sm group ${
                  selected?.id === template.id
                    ? 'border-accent/50 shadow-glow'
                    : 'border-border hover:border-muted'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Icon + Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      selected?.id === template.id ? 'bg-accent/15 text-accent' : 'bg-muted/30 text-text-secondary'
                    }`}>
                      <FileText size={17} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-display font-semibold text-sm text-text-primary truncate">
                        {template.name}
                      </p>
                      <p className="text-xs text-text-dim font-mono mt-0.5">
                        {new Date(template.created_at).toLocaleDateString('en-US', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight size={15} className="text-text-dim group-hover:text-text-secondary transition-colors flex-shrink-0 mt-1" />
                </div>

                {/* Pills row */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Pill>{template.category}</Pill>
                  <Pill>{template.language}</Pill>
                  <span className="ml-auto">
                    <StatusBadge status={template.status} />
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Right: Preview Panel ── */}
      {selected && (
        <PreviewPanel template={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
