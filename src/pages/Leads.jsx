import { useEffect, useState, useRef } from 'react'
import { getSupabase } from '../lib/supabase'
import { getConfig } from '../lib/config'
import { Send, ArrowRight, ChevronLeft } from 'lucide-react'
import ScoreBadge from '../components/ScoreBadge'

const TABS = ['all', 'hot', 'warm', 'cold', 'not_a_lead']

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function ChatView({ lead, onBack }) {
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const [mode, setMode]         = useState('bot')
  const bottomRef = useRef(null)

  useEffect(() => {
    if (lead) loadMessages()
  }, [lead])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadMessages() {
    const { data } = await getSupabase()
      .from('ad_conversations')
      .select('messages, mode')
      .eq('contact_id', lead.contact_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (data) {
      setMode(data.mode)
      const raw = data.messages
      const msgs = Array.isArray(raw) ? raw
        : typeof raw === 'string' ? JSON.parse(raw)
        : Object.values(raw || {})
      setMessages(msgs)
    }
  }

  async function sendMessage() {
    if (!input.trim() || sending) return
    setSending(true)

    const newMsg = {
      role: 'agent',
      content: input.trim(),
      type: 'manual',
      timestamp: new Date().toISOString()
    }

    // Update messages in Supabase + switch mode to human
    const updated = [...messages, newMsg]
    await getSupabase()
      .from('ad_conversations')
      .update({
        messages: JSON.stringify(updated),
        mode: 'human',
        updated_at: new Date().toISOString()
      })
      .eq('contact_id', lead.contact_id)

    // Send via Meta Cloud API (n8n webhook — URL from app_config)
    try {
      const webhookUrl = getConfig('n8n_webhook_url')
      if (!webhookUrl) throw new Error('n8n_webhook_url not set in app_config')
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: lead.contacts?.phone_number,
          message: input.trim()
        })
      })
    } catch (e) {
      console.error('Send failed', e)
    }

    setMessages(updated)
    setMode('human')
    setInput('')
    setSending(false)
  }

  return (
    <div className="flex flex-col h-full bg-surface border-l border-border animate-slide-in">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <button onClick={onBack} className="text-text-secondary hover:text-text-primary md:hidden">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-display font-600 text-text-primary text-sm truncate">
              {lead.contacts?.name || lead.contacts?.phone_number}
            </p>
            <ScoreBadge score={lead.score} />
          </div>
          <p className="text-xs text-text-secondary font-mono">{lead.contacts?.phone_number}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-mono flex-shrink-0 ${
          mode === 'human'
            ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400'
            : 'bg-accent/10 border-accent/30 text-accent'
        }`}>
          {mode === 'human' ? 'You\'re in control' : 'Bot handling'}
        </span>
      </div>

      {/* AI Summary */}
      <div className="px-4 py-2.5 bg-card/50 border-b border-border">
        <p className="text-xs text-text-secondary">
          <span className="text-accent font-mono">AI Summary: </span>
          {lead.summary}
        </p>
        {lead.next_action && (
          <p className="text-xs text-warm mt-0.5">
            <span className="font-mono">Next: </span>{lead.next_action}
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-text-dim text-sm text-center mt-8">No messages</p>
        ) : messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-accent/15 border border-accent/20 text-text-primary rounded-tr-sm'
                : msg.role === 'agent'
                ? 'bg-emerald-400/10 border border-emerald-400/20 text-text-primary rounded-tl-sm'
                : 'bg-card border border-border text-text-primary rounded-tl-sm'
            }`}>
              {msg.role === 'agent' && (
                <p className="text-xs text-emerald-400 font-mono mb-1">You</p>
              )}
              {msg.role === 'bot' && (
                <p className="text-xs text-accent font-mono mb-1">Bot</p>
              )}
              <p>{msg.content}</p>
              <p className="text-xs text-text-dim mt-1 text-right font-mono">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-dim focus:outline-none focus:border-accent/50 transition-colors"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center text-accent hover:bg-accent/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send size={14} />
          </button>
        </div>
        {mode === 'bot' && (
          <p className="text-xs text-text-dim mt-1.5 text-center">
            Sending a message will switch to human mode
          </p>
        )}
      </div>
    </div>
  )
}

export default function Leads() {
  const [leads, setLeads]     = useState([])
  const [filtered, setFiltered] = useState([])
  const [tab, setTab]         = useState('all')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeads()
    const interval = setInterval(() => fetchLeads(false), 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setFiltered(tab === 'all' ? leads : leads.filter(l => l.score === tab))
  }, [tab, leads])

  async function fetchLeads(showLoading = true) {
    if (showLoading) setLoading(true)
    const { data } = await getSupabase()
      .from('lead_scores')
      .select('*, contacts(name, phone_number)')
      .order('scored_at', { ascending: false })
    if (data) { setLeads(data); setFiltered(data) }
    if (showLoading) setLoading(false)
  }

  const counts = leads.reduce((acc, l) => {
    acc[l.score] = (acc[l.score] || 0) + 1
    return acc
  }, {})

  return (
    <div className="flex h-full">
      {/* Lead List */}
      <div className={`flex-1 flex flex-col p-6 md:p-8 overflow-hidden ${selected ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="mb-6 animate-fade-up">
          <h1 className="font-display text-2xl font-700 text-text-primary tracking-tight">Leads</h1>
          <p className="text-text-secondary text-sm mt-1">Scored and ready to convert</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 animate-fade-up stagger-1">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-colors flex-shrink-0 ${
                tab === t
                  ? 'bg-accent/10 border border-accent/30 text-accent'
                  : 'bg-card border border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {t === 'all' ? 'All' : t.replace('_', ' ')}
              {t !== 'all' && counts[t] ? (
                <span className="bg-muted rounded-full w-4 h-4 flex items-center justify-center text-text-secondary" style={{ fontSize: '10px' }}>
                  {counts[t]}
                </span>
              ) : null}
              {t === 'all' && (
                <span className="bg-muted rounded-full w-4 h-4 flex items-center justify-center text-text-secondary" style={{ fontSize: '10px' }}>
                  {leads.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Lead Cards */}
        <div className="flex-1 overflow-y-auto space-y-2 animate-fade-up stagger-2">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-card border border-border rounded-xl animate-pulse" />
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <p className="text-text-dim text-sm">No {tab === 'all' ? '' : tab} leads yet</p>
            </div>
          ) : filtered.map((lead, i) => (
            <div
              key={lead.id}
              onClick={() => setSelected(lead)}
              className={`bg-card border rounded-xl p-4 cursor-pointer transition-all hover:shadow-glow group ${
                selected?.id === lead.id ? 'border-accent/40' : 'border-border hover:border-muted'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-display font-600 text-text-secondary">
                      {(lead.contacts?.name || lead.contacts?.phone_number || '?')[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-text-primary text-sm truncate">
                      {lead.contacts?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-text-secondary font-mono">{lead.contacts?.phone_number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <ScoreBadge score={lead.score} />
                  <ArrowRight size={14} className="text-text-dim group-hover:text-text-secondary transition-colors" />
                </div>
              </div>

              <p className="text-xs text-text-secondary mt-2.5 leading-relaxed line-clamp-2">
                {lead.summary}
              </p>

              {lead.next_action && (
                <p className="text-xs text-warm mt-1.5 truncate">
                  → {lead.next_action}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Panel */}
      {selected && (
        <div className={`w-full md:w-96 flex-shrink-0 ${selected ? 'flex' : 'hidden md:flex'} flex-col h-full`}>
          <ChatView lead={selected} onBack={() => setSelected(null)} />
        </div>
      )}
    </div>
  )
}
