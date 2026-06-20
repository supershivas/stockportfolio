import { ExternalLink } from 'lucide-react'

interface Source { label: string; url: string; description?: string }

export default function Sources({ sources }: { sources: Source[] }) {
  return (
    <div className="mt-6 rounded-xl px-5 py-4" style={{ border: '1px solid var(--card-border)', background: 'var(--card-bg-2)' }}>
      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Sources</p>
      <div className="flex flex-wrap gap-4">
        {sources.map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" title={s.description}
            className="inline-flex items-center gap-1.5 text-xs hover:text-accent/80 transition-colors" style={{ color: 'var(--text-muted)' }}>
            <ExternalLink size={11} />
            {s.label}
          </a>
        ))}
      </div>
    </div>
  )
}
