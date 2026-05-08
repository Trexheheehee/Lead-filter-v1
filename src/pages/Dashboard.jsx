import { useEffect, useState } from 'react'
import { getSupabase } from '../lib/supabase'
import { Users, Flame, MessageSquare, Megaphone, Activity } from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid
} from 'recharts'
import ScoreBadge from '../components/ScoreBadge'

const COLORS = {
  hot: '#ef4444',
  warm: '#f59e0b',
  cold: '#3b82f6',
  not_a_lead: '#6b7280'
}

function StatCard({ title, value, icon: Icon, colorClass }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-muted transition-colors">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-text-secondary text-sm font-medium">{title}</p>
        <p className="text-text-primary text-2xl font-bold font-display tracking-tight">{value}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEnquiries: 0,
    hotLeads: 0,
    activeConversations: 0,
    campaignsSent: 0
  })
  const [scoreData, setScoreData] = useState([])
  const [trendData, setTrendData] = useState([])
  const [recentLeads, setRecentLeads] = useState([])
  const [recentCampaigns, setRecentCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(() => fetchDashboardData(false), 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchDashboardData(showLoading = true) {
    if (showLoading) setLoading(true)
    const supabase = getSupabase()

    try {
      // 1. Stats
      const [
        { count: contactsCount },
        { count: hotCount },
        { count: activeConvCount },
        { count: campaignsCount }
      ] = await Promise.all([
        supabase.from('contacts').select('*', { count: 'exact', head: true }),
        supabase.from('lead_scores').select('*', { count: 'exact', head: true }).eq('score', 'hot'),
        supabase.from('ad_conversations').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('campaigns').select('*', { count: 'exact', head: true })
      ])

      setStats({
        totalEnquiries: contactsCount || 0,
        hotLeads: hotCount || 0,
        activeConversations: activeConvCount || 0,
        campaignsSent: campaignsCount || 0
      })

      // 2. Score Breakdown
      const { data: scores } = await supabase.from('lead_scores').select('score')
      if (scores) {
        const counts = scores.reduce((acc, { score }) => {
          acc[score] = (acc[score] || 0) + 1
          return acc
        }, {})
        
        const formattedScores = Object.entries(counts).map(([name, value]) => ({
          name: name.replace('_', ' ').toUpperCase(),
          value,
          originalName: name
        }))
        setScoreData(formattedScores)
      }

      // 3. Trend Data (Daily enquiries last 7 days)
      const { data: contacts } = await supabase
        .from('contacts')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1000)
      
      if (contacts) {
        const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date()
          d.setDate(d.getDate() - i)
          return d.toISOString().split('T')[0]
        }).reverse()

        const trends = last7Days.map(date => ({
          date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          count: contacts.filter(c => c.created_at.startsWith(date)).length
        }))
        setTrendData(trends)
      }

      // 4. Recent Leads
      const { data: leads } = await supabase
        .from('lead_scores')
        .select('*, contacts(name, phone_number)')
        .order('scored_at', { ascending: false })
        .limit(5)
      if (leads) setRecentLeads(leads)

      // 5. Recent Campaigns
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, audience, status, created_at, sent')
        .order('created_at', { ascending: false })
        .limit(3)
      if (campaigns) setRecentCampaigns(campaigns)

    } catch (e) {
      console.error('Failed to fetch dashboard data', e)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Activity className="text-accent animate-spin" size={32} />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-up h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-text-primary tracking-tight">Dashboard</h1>
        <p className="text-text-secondary text-sm mt-1">Overview of your lead generation performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Enquiries" value={stats.totalEnquiries} icon={Users} colorClass="bg-blue-500/10 text-blue-500 border border-blue-500/20" />
        <StatCard title="Hot Leads" value={stats.hotLeads} icon={Flame} colorClass="bg-hot-bg text-hot border border-hot-border" />
        <StatCard title="Active Chats" value={stats.activeConversations} icon={MessageSquare} colorClass="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" />
        <StatCard title="Campaigns Sent" value={stats.campaignsSent} icon={Megaphone} colorClass="bg-accent/10 text-accent border border-accent/20" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Line Chart */}
        <div className="bg-card border border-border rounded-2xl p-5 lg:col-span-2 shadow-sm">
          <h2 className="text-text-primary font-medium mb-4">Enquiries (Last 7 Days)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" vertical={false} />
                <XAxis dataKey="date" stroke="#7a8fa8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#7a8fa8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#131929', borderColor: '#1e2d42', color: '#e8edf5', borderRadius: '8px' }}
                  itemStyle={{ color: '#8b5cf6' }}
                />
                <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#131929', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h2 className="text-text-primary font-medium mb-4">Lead Quality</h2>
          <div className="h-64 flex flex-col items-center justify-center">
            {scoreData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={scoreData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {scoreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.originalName] || COLORS.not_a_lead} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#131929', borderColor: '#1e2d42', color: '#e8edf5', borderRadius: '8px', border: '1px solid #1e2d42' }}
                    itemStyle={{ color: '#e8edf5' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-text-dim text-sm">No scores available</p>
            )}
          </div>
        </div>
      </div>

      {/* Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h2 className="text-text-primary font-medium mb-4">Recent Leads</h2>
          <div className="space-y-3">
            {recentLeads.length > 0 ? recentLeads.map(lead => (
              <div key={lead.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface hover:border-muted transition-colors">
                <div>
                  <p className="text-sm font-medium text-text-primary">{lead.contacts?.name || lead.contacts?.phone_number || 'Unknown'}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{new Date(lead.scored_at).toLocaleDateString()}</p>
                </div>
                <ScoreBadge score={lead.score} />
              </div>
            )) : (
              <p className="text-text-dim text-sm text-center py-4">No recent leads</p>
            )}
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h2 className="text-text-primary font-medium mb-4">Recent Campaigns</h2>
          <div className="space-y-3">
            {recentCampaigns.length > 0 ? recentCampaigns.map(campaign => (
              <div key={campaign.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface hover:border-muted transition-colors">
                <div>
                  <p className="text-sm font-medium text-text-primary truncate max-w-[150px]">
                    {campaign.audience || campaign.id.split('-')[0]}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">Audience: {campaign.audience}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    campaign.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                    campaign.status === 'sending' ? 'bg-accent/10 text-accent border border-accent/20' :
                    'bg-muted/50 text-text-secondary border border-border'
                  }`}>
                    {campaign.status}
                  </span>
                  <p className="text-xs text-text-dim mt-1.5">{campaign.sent || 0} sent</p>
                </div>
              </div>
            )) : (
              <p className="text-text-dim text-sm text-center py-4">No recent campaigns</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
