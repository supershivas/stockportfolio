import { ExternalLink } from 'lucide-react'

interface Source { label: string; url: string; description?: string }

export default function Sources({ sources }: { sources: Source[] }) {
  return (
    <div className="mt-6 rounded-xl border border-slate-700/50 bg-slate-900/40 px-5 py-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Sources</p>
      <div className="flex flex-wrap gap-4">
        {sources.map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" title={s.description}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 transition-colors">
            <ExternalLink size={11} />
            {s.label}
          </a>
        ))}
      </div>
    </div>
  )
}
