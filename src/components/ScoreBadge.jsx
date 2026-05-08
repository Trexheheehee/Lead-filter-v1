const config = {
  hot:         { label: 'Hot',        classes: 'bg-hot-bg border-hot-border text-hot',    dot: 'bg-hot' },
  warm:        { label: 'Warm',       classes: 'bg-warm-bg border-warm-border text-warm',  dot: 'bg-warm' },
  cold:        { label: 'Cold',       classes: 'bg-cold-bg border-cold-border text-cold',  dot: 'bg-cold' },
  not_a_lead:  { label: 'Not a Lead', classes: 'bg-ghost-bg border-ghost-border text-ghost', dot: 'bg-ghost' },
}

export default function ScoreBadge({ score, size = 'sm' }) {
  const c = config[score] || config.not_a_lead
  const textSize = size === 'lg' ? 'text-sm px-3 py-1' : 'text-xs px-2 py-0.5'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-mono font-medium ${c.classes} ${textSize}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}
