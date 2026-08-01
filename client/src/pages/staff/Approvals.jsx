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

  return (
    <div className="p-8">
      <h1 className="font-display text-3xl text-ink-900 mb-1">Pending Approvals</h1>
      <p className="text-slate-soft mb-8">
        Transactions above Rs 100,000 wait here until a second person approves them.
      </p>

      {loading && <p className="text-slate-soft">Loading...</p>}
      {error && <p className="text-ledger-red">{error}</p>}

      {!loading && !error && pending.length === 0 && (
        <div className="bg-white border border-paper-line rounded-sm p-10 text-center">
          <p className="text-slate-soft">No transactions awaiting approval.</p>
        </div>
      )}

      <div className="space-y-4">
        {pending.map((txn) => (
          <div key={txn.TransID} className="bg-white border border-paper-line rounded-sm p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="stamp text-brass-dark">{txn.Type}</span>
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
                  Initiated by <span className="font-medium">{txn.InitiatedByName}</span> on{' '}
                  {new Date(txn.DateTime).toLocaleString()}
                </p>
                {txn.Description && <p className="text-xs text-slate-soft mt-1 italic">{txn.Description}</p>}
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => handleApprove(txn.TransID)}
                  disabled={actioningId === txn.TransID}
                  className="bg-ledger-green text-white text-sm font-medium px-4 py-2 rounded-sm hover:opacity-90 transition disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(txn.TransID)}
                  disabled={actioningId === txn.TransID}
                  className="border border-ledger-red text-ledger-red text-sm font-medium px-4 py-2 rounded-sm hover:bg-ledger-red/10 transition disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}