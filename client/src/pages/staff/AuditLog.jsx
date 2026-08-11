import { useEffect, useState } from 'react';
import api from '../../api/client';

const opMeta = {
  COMMIT: { color: 'text-ledger-green', bg: 'bg-ledger-green-100', icon: '✓' },
  ROLLBACK: { color: 'text-ledger-red', bg: 'bg-ledger-red-100', icon: '↺' },
  INSERT: { color: 'text-brass-dark', bg: 'bg-brass-100', icon: '+' },
  UPDATE: { color: 'text-ink-700', bg: 'bg-ink-50', icon: '✎' },
};

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    api.get('/audit').then((res) => setLogs(res.data)).catch(() => setError('Could not load audit log.')).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'All' ? logs : logs.filter((l) => l.Operation === filter);
  const ops = ['All', ...new Set(logs.map((l) => l.Operation))];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8 animate-fade-up">
        <p className="eyebrow mb-1">Oversight</p>
        <h1 className="font-display text-3xl text-ink-900">Audit Log</h1>
        <p className="text-slate-soft mt-1">Every recorded operation, most recent first.</p>
      </div>

      {!loading && !error && logs.length > 0 && (
        <div className="flex gap-2 mb-6 animate-fade-up flex-wrap">
          {ops.map((op) => (
            <button key={op} onClick={() => setFilter(op)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === op ? 'bg-ink-900 text-paper' : 'bg-white border border-paper-line text-slate-soft hover:border-ink-700'
              }`}>{op}</button>
          ))}
        </div>
      )}

      {loading && <p className="text-slate-soft">Loading...</p>}
      {error && <p className="text-ledger-red">{error}</p>}

      {!loading && !error && (
        <div className="relative pl-6">
          <div className="absolute left-[9px] top-2 bottom-2 w-px bg-paper-line" />
          <div className="space-y-4">
            {filtered.map((log, i) => {
              const meta = opMeta[log.Operation] || { color: 'text-slate-soft', bg: 'bg-ink-50', icon: '•' };
              return (
                <div key={log.LogID} className="relative animate-fade-up" style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}>
                  <div className={`absolute -left-6 top-4 w-[18px] h-[18px] rounded-full ${meta.bg} ${meta.color} flex items-center justify-center text-[10px] font-bold border-2 border-paper`}>
                    {meta.icon}
                  </div>
                  <div className="panel panel-hover p-4 ml-2">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`pill ${meta.bg} ${meta.color}`}>{log.Operation}</span>
                        <span className="text-sm font-medium text-ink-900">{log.TableAffected}</span>
                        {log.RecordID != null && <span className="font-mono text-xs text-slate-soft">#{log.RecordID}</span>}
                      </div>
                      <span className="font-mono text-[11px] text-slate-soft whitespace-nowrap">
                        {new Date(log.CreatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
                        {new Date(log.CreatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-soft">{log.Details || '—'}</p>
                    <p className="text-xs text-slate-faint mt-1">by {log.UserName}</p>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <p className="text-center text-slate-soft py-16 panel ml-2">No audit entries yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}