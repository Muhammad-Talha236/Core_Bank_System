import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/audit')
      .then((res) => setLogs(res.data))
      .catch(() => setError('Could not load audit log.'))
      .finally(() => setLoading(false));
  }, []);

  const operationColor = (op) => {
    if (op === 'COMMIT') return 'text-ledger-green';
    if (op === 'ROLLBACK') return 'text-ledger-red';
    return 'text-brass-dark';
  };

  return (
    <div className="p-8">
      <h1 className="font-display text-3xl text-ink-900 mb-1">Audit Log</h1>
      <p className="text-slate-soft mb-8">Every recorded operation, most recent first.</p>

      {loading && <p className="text-slate-soft">Loading...</p>}
      {error && <p className="text-ledger-red">{error}</p>}

      {!loading && !error && (
        <div className="bg-white border border-paper-line rounded-sm overflow-x-auto">
          <table className="w-full ledger-table min-w-[900px]">
            <thead>
              <tr className="bg-ink-900 text-paper text-left text-sm">
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Operation</th>
                <th className="px-5 py-3 font-medium">Table</th>
                <th className="px-5 py-3 font-medium">Record</th>
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Details</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.LogID} className="text-sm">
                  <td className="px-5 py-3 font-mono text-slate-soft">#{log.LogID}</td>
                  <td className="px-5 py-3">
                    <span className={`stamp ${operationColor(log.Operation)}`}>{log.Operation}</span>
                  </td>
                  <td className="px-5 py-3">{log.TableAffected}</td>
                  <td className="px-5 py-3 font-mono text-slate-soft">{log.RecordID ?? '—'}</td>
                  <td className="px-5 py-3">{log.UserName}</td>
                  <td className="px-5 py-3 text-slate-soft max-w-xs truncate" title={log.Details}>{log.Details || '—'}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-soft whitespace-nowrap">
                    {new Date(log.CreatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    <br />
                    <span className="text-[10px]">{new Date(log.CreatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && <p className="text-center text-slate-soft py-8">No audit entries yet.</p>}
        </div>
      )}
    </div>
  );
}