import { useEffect, useState } from 'react'
import { getSupabase } from '../lib/supabase'
import { Search, MessageSquare, Clock, ChevronRight } from 'lucide-react'

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function ChatPanel({ conversation, onClose }) {
  if (!conversation) return null
  const messages = Array.isArray(conversation.messages)
    ? conversation.messages
    : (typeof conversation.messages === 'string'
        ? JSON.parse(conversation.messages)
        : Object.values(conversation.messages || {}))

  return (
    <div className="fixed inset-0 z-50 flex justify-end md:relative md:inset-auto">
      <div className="absolute inset-0 bg-void/60 md:hidden" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface border-l border-border h-full flex flex-col animate-slide-in">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <p className="font-display font-600 text-text-primary text-sm">
              {conversation.contacts?.name || conversation.contacts?.phone_number}
            </p>
            <p className="text-xs text-text-secondary font-mono">{conversation.contacts?.phone_number}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${
              conversation.mode === 'human'
                ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400'
                : 'bg-accent/10 border-accent/30 text-accent'
            }`}>
              {conversation.mode === 'human' ? 'Human' : 'Bot'}
            </span>
            <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-lg leading-none">×</button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <p className="text-text-dim text-sm text-center mt-8">No messages yet</p>
          ) : messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'bg-accent/15 border border-accent/20 text-text-primary rounded-tr-sm'
                  : msg.role === 'agent'
                  ? 'bg-emerald-400/10 border border-emerald-400/20 text-text-primary rounded-tl-sm'
                  : 'bg-card border border-border text-text-primary rounded-tl-sm'
              }`}>
                {msg.role === 'agent' && (
                  <p className="text-xs text-emerald-400 font-mono mb-1">You</p>
                )}
                <p>{msg.content}</p>
                <p className="text-xs text-text-dim mt-1 text-right font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Conversations() {
  const [convos, setConvos]   = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch]   = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConvos()
    const interval = setInterval(() => fetchConvos(false), 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let result = convos
    if (statusFilter !== 'all') result = result.filter(c => c.status === statusFilter)
    if (search) result = result.filter(c =>
      (c.contacts?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.contacts?.phone_number || '').includes(search)
    )
    setFiltered(result)
  }, [search, statusFilter, convos])

  async function fetchConvos(showLoading = true) {
    if (showLoading) setLoading(true)
    const { data } = await getSupabase()
      .from('ad_conversations')
      .select('*, contacts(name, phone_number)')
      .order('updated_at', { ascending: false })
    if (data) { setConvos(data); setFiltered(data) }
    if (showLoading) setLoading(false)
  }

  async function openConvo(c) {
    const { data } = await getSupabase()
      .from('ad_conversations')
      .select('*, contacts(name, phone_number)')
      .eq('id', c.id)
      .single()
    setSelected(data)
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 md:p-8 overflow-auto">
        {/* Header */}
        <div className="mb-6 animate-fade-up">
          <h1 className="font-display text-2xl font-700 text-text-primary tracking-tight">Conversations</h1>
          <p className="text-text-secondary text-sm mt-1">All enquiries from your ads</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5 animate-fade-up stagger-1">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name or phone..."
              className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary placeholder-text-dim focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'scored'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-lg text-xs font-mono capitalize transition-colors ${
                  statusFilter === s
                    ? 'bg-accent/10 border border-accent/30 text-accent'
                    : 'bg-card border border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden animate-fade-up stagger-2">
          {loading ? (
            <div className="p-8 text-center text-text-dim text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <MessageSquare size={32} className="text-text-dim mx-auto mb-3" />
              <p className="text-text-secondary text-sm">No conversations found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {/* Table Header */}
              <div className="grid grid-cols-12 px-4 py-2.5 text-xs font-mono text-text-dim uppercase tracking-wider">
                <div className="col-span-5">Contact</div>
                <div className="col-span-4 hidden md:block">Messages</div>
                <div className="col-span-2 hidden md:block">Status</div>
                <div className="col-span-1" />
              </div>
              {filtered.map((c, i) => (
                <div
                  key={c.id}
                  onClick={() => openConvo(c)}
                  className="grid grid-cols-12 px-4 py-3.5 hover:bg-surface cursor-pointer transition-colors items-center group"
                >
                  <div className="col-span-11 md:col-span-5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-display font-600 text-text-secondary">
                        {(c.contacts?.name || c.contacts?.phone_number || '?')[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-text-primary font-medium">
                        {c.contacts?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-text-secondary font-mono">{c.contacts?.phone_number}</p>
                    </div>
                  </div>
                  <div className="col-span-4 hidden md:flex items-center gap-1.5 text-sm text-text-secondary">
                    <MessageSquare size={13} className="text-text-dim" />
                    {c.message_count}
                  </div>
                  <div className="col-span-2 hidden md:block">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${
                      c.status === 'scored'
                        ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400'
                        : 'bg-accent/10 border-accent/30 text-accent'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <div className="col-span-1 flex justify-end">
                    <ChevronRight size={15} className="text-text-dim group-hover:text-text-secondary transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Side panel */}
      {selected && <ChatPanel conversation={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
