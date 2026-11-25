import { NavLink, Outlet } from 'react-router-dom'
import { Activity, Archive, BookOpen, Compass, FlaskConical, Map, Plane, Radar, ScanSearch, Waves } from 'lucide-react'
import { useData } from '@/lib/data'
import { cn } from '@/lib/utils'

export const NAV = [
  { to: '/', label: 'Intelligence Overview', icon: Activity, phase: 1 },
  { to: '/explorer', label: 'Geospatial Explorer', icon: Map, phase: 1 },
  { to: '/flight-path', label: 'Flight Path Reconstruction', icon: Plane, phase: 3 },
  { to: '/drift', label: 'Ocean Drift Modelling', icon: Waves, phase: 3 },
  { to: '/coverage', label: 'Search Coverage Analysis', icon: ScanSearch, phase: 3 },
  { to: '/sonar', label: 'Sonar Intelligence', icon: Radar, phase: 4 },
  { to: '/hypotheses', label: 'Hypothesis Laboratory', icon: FlaskConical, phase: 4 },
  { to: '/evidence', label: 'Evidence Repository', icon: Archive, phase: 1 },
  { to: '/methodology', label: 'Research Methodology', icon: BookOpen, phase: 1 },
]

function Status({ label, value, tone }: { label: string; value: string; tone: 'ok' | 'warn' | 'muted' }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn('h-1.5 w-1.5 rounded-full', tone === 'ok' ? 'bg-verified' : tone === 'warn' ? 'bg-reconstructed' : 'bg-pending')} />
      <span className="label">{label}</span>
      <span className="mono text-[11px] text-slate-300">{value}</span>
    </div>
  )
}

export function Layout() {
  const { status, postgis, layers: LAYERS, datasets: DATASETS } = useData()
  const loadedLayers = LAYERS.filter((l) => l.data || l.tiles).length
  const ingested = DATASETS.filter((d) => d.ingestionStatus === 'ingested').length
  return (
    <div className="flex h-full">
      <aside className="flex w-60 shrink-0 flex-col border-r border-ink-700 bg-ink-900">
        <div className="border-b border-ink-700 px-4 py-4">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-signal" />
            <div className="leading-tight">
              <div className="text-[13px] font-semibold tracking-wide text-slate-100">MH370</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Open Evidence Lab</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV.map(({ to, label, icon: Icon, phase }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn('mx-2 flex items-center gap-2.5 rounded px-2.5 py-2 text-[12.5px]', isActive ? 'bg-ink-700 text-slate-100' : 'text-slate-400 hover:bg-ink-800 hover:text-slate-200')
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{label}</span>
              {phase > 1 && <span className="mono text-[9px] text-slate-600">P{phase}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-ink-700 p-3 text-[10px] leading-relaxed text-slate-500">
          Independent research initiative. Model outputs are never presented as established fact.
          <div className="mt-1 mono text-slate-600">v0.1.2 · Phase 1</div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-10 shrink-0 items-center gap-6 border-b border-ink-700 bg-ink-900 px-4">
          <Status label="Backend" value={status === 'postgres' ? `PostgreSQL · PostGIS ${postgis}` : status === 'connecting' ? 'Connecting…' : 'Seed data (API offline)'} tone={status === 'postgres' ? 'ok' : 'warn'} />
          <Status label="Datasets ingested" value={`${ingested}/${DATASETS.length}`} tone="muted" />
          <Status label="Map layers loaded" value={`${loadedLayers}/${LAYERS.length}`} tone="muted" />
          <Status label="AI models" value="None operational" tone="muted" />
        </header>
        <main className="min-h-0 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
