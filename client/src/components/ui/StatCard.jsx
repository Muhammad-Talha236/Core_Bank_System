// A single metric card used across dashboards. `accent` controls the thin
// top rule so different metric families (people, money, activity) stay
// visually distinguishable without needing a full color change.
export default function StatCard({ label, value, sublabel, accent = 'brass', icon }) {
  const accentColor = {
    brass: 'var(--color-brass)',
    green: 'var(--color-ledger-green)',
    navy: 'var(--color-ink-700)',
    red: 'var(--color-ledger-red)',
  }[accent] || 'var(--color-brass)';

  return (
    <div className="panel relative overflow-hidden p-6">
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: accentColor }} />
      <div className="flex items-start justify-between mb-3">
        <p className="eyebrow">{label}</p>
        {icon && <span className="text-lg leading-none opacity-70">{icon}</span>}
      </div>
      <p className="font-display text-3xl text-ink-900 leading-none">{value}</p>
      {sublabel && <p className="text-xs text-slate-soft mt-2">{sublabel}</p>}
    </div>
  );
}
