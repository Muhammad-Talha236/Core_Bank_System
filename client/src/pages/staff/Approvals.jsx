import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function Approvals() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioningId, setActioningId] = useState(null);
  const [rejectReason, setRejectReason] = useState({});

  async function loadPending() {
    try {
      const { data } = await api.get('/transactions/pending');
      setPending(data);
    } catch (err) {
      setError('Could not load pending transactions.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPending(); }, []);

  async function handleApprove(transId) {
    setActioningId(transId);
    try {
      await api.post(`/transactions/${transId}/approve`);
      loadPending();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not approve transaction.');
    } finally {
      setActioningId(null);
    }
  }

  async function handleReject(transId) {
    setActioningId(transId);
    try {
      await api.post(`/transactions/${transId}/reject`, { reason: rejectReason[transId] || '' });
      loadPending();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not reject transaction.');
    } finally {
      setActioningId(null);
    }
  }

  const typeMeta = {
    Deposit: { icon: '↓', color: 'text-ledger-green' },
    Withdrawal: { icon: '↑', color: 'text-ledger-red' },
    Transfer: { icon: '⇄', color: 'text-brass-dark' },
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8 animate-fade-up">
        <p className="eyebrow mb-1">Maker-Checker</p>
        <h1 className="font-display text-3xl text-ink-900">Pending Approvals</h1>
        <p className="text-slate-soft mt-1">
          Transactions above Rs 100,000 wait here until a second person approves them.
        </p>
      </div>

      {loading && <p className="text-slate-soft">Loading...</p>}
      {error && <p className="text-ledger-red">{error}</p>}

      {!loading && !error && pending.length === 0 && (
        <div className="panel p-14 text-center animate-fade-up">
          <div className="w-12 h-12 rounded-full bg-ledger-green-100 text-ledger-green flex items-center justify-center mx-auto mb-3 text-xl">✓</div>
          <p className="text-slate-soft">No transactions awaiting approval.</p>
        </div>
      )}

      <div className="space-y-4">
        {pending.map((txn, i) => {
          const meta = typeMeta[txn.Type] || { icon: '•', color: 'text-slate-soft' };
          return (
            <div
              key={txn.TransID}
              className="panel panel-hover p-5 animate-fade-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className={`w-11 h-11 rounded-lg bg-ink-50 flex items-center justify-center text-xl shrink-0 ${meta.color}`}>
                    {meta.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="pill pill-brass">{txn.Type}</span>
                      <span className="font-mono text-xs text-slate-soft">#{txn.TransID}</span>
                    </div>
                    <p className="font-display text-2xl text-ink-900">
                      Rs {parseFloat(txn.Amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-slate-soft mt-1">
                      {txn.FromAccount && <>From <span className="font-mono">{txn.FromAccount}</span> </>}
                      {txn.ToAccount && <>{txn.FromAccount ? '→ ' : 'To '}<span className="font-mono">{txn.ToAccount}</span></>}
                    </p>
                    <p className="text-xs text-slate-soft mt-1">
                      Initiated by <span className="font-medium text-slate">{txn.InitiatedByName}</span> on{' '}
                      {new Date(txn.DateTime).toLocaleString()}
                    </p>
                    {txn.Description && <p className="text-xs text-slate-soft mt-1 italic">{txn.Description}</p>}
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(txn.TransID)}
                    disabled={actioningId === txn.TransID}
                    className="btn bg-ledger-green text-white hover:opacity-90"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(txn.TransID)}
                    disabled={actioningId === txn.TransID}
                    className="btn btn-danger-outline"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}