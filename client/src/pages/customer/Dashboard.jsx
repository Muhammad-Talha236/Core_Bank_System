import { useEffect, useState } from 'react';
import customerApi from '../../api/customerClient';
import { useCustomerAuth } from '../../context/CustomerAuthContext';

export default function CustomerDashboard() {
  const { customer, logout } = useCustomerAuth();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showTransfer, setShowTransfer] = useState(false);
  const [transferForm, setTransferForm] = useState({ toAccount: '', amount: '' });
  const [transferError, setTransferError] = useState('');
  const [transferResult, setTransferResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadAccounts() {
    try {
      const { data } = await customerApi.get('/customer-portal/accounts');
      setAccounts(data);
      if (data.length > 0 && !selectedAccount) {
        selectAccount(data[0]);
      }
    } finally {
      setLoading(false);
    }
  }

  async function selectAccount(account) {
    setSelectedAccount(account);
    const { data } = await customerApi.get(`/customer-portal/ledger/${account.AccountNo}`);
    setLedger(data);
  }

  useEffect(() => { loadAccounts(); }, []);

  async function handleTransfer(e) {
    e.preventDefault();
    setTransferError('');
    setTransferResult(null);
    setSubmitting(true);
    try {
      const { data } = await customerApi.post('/customer-portal/transfer', {
        fromAccount: selectedAccount.AccountNo,
        toAccount: transferForm.toAccount,
        amount: parseFloat(transferForm.amount)
      });
      setTransferResult(data);
      setTransferForm({ toAccount: '', amount: '' });
      loadAccounts();
      selectAccount(selectedAccount);
    } catch (err) {
      setTransferError(err.response?.data?.error || 'Transfer failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Topbar */}
      <header className="bg-ink-900 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="font-display text-xl text-paper">Meridian Bank</p>
          <p className="font-mono text-[10px] tracking-widest text-brass uppercase">Online Banking</p>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-paper text-sm">{customer.name}</p>
          <button onClick={logout} className="text-paper/60 text-sm hover:text-ledger-red transition">Sign out</button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {loading ? (
          <p className="text-slate-soft">Loading your accounts...</p>
        ) : (
          <>
            {/* Account cards */}
            <h2 className="font-display text-2xl text-ink-900 mb-4">My Accounts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {accounts.map((a) => (
                <button
                  key={a.AccountNo}
                  onClick={() => selectAccount(a)}
                  className={`text-left bg-white border rounded-sm p-5 transition ${
                    selectedAccount?.AccountNo === a.AccountNo
                      ? 'border-brass ring-1 ring-brass'
                      : 'border-paper-line hover:border-ink-700'
                  }`}
                >
                  <p className="font-mono text-xs text-slate-soft mb-1">#{a.AccountNo}</p>
                  <p className="font-display text-2xl text-ink-900 mb-1">
                    Rs {parseFloat(a.Balance).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-slate-soft">{a.Type}</p>
                </button>
              ))}
              {accounts.length === 0 && (
                <p className="text-slate-soft sm:col-span-2">No accounts found on your profile.</p>
              )}
            </div>

            {selectedAccount && (
              <>
                {/* Transfer */}
                <div className="bg-white border border-paper-line rounded-sm p-6 mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-lg text-ink-900">Send Money</h3>
                    <button
                      onClick={() => { setShowTransfer(!showTransfer); setTransferResult(null); setTransferError(''); }}
                      className="text-sm text-brass-dark font-medium hover:underline"
                    >
                      {showTransfer ? 'Cancel' : `Transfer from #${selectedAccount.AccountNo}`}
                    </button>
                  </div>

                  {showTransfer && (
                    <form onSubmit={handleTransfer} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">To Account</label>
                        <input
                          required
                          value={transferForm.toAccount}
                          onChange={(e) => setTransferForm({ ...transferForm, toAccount: e.target.value })}
                          placeholder="Recipient account number"
                          className="w-full px-3 py-2 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Amount (PKR)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          step="0.01"
                          value={transferForm.amount}
                          onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                          className="w-full px-3 py-2 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="bg-ink-900 text-paper font-medium px-5 py-2 rounded-sm hover:bg-ink-800 transition disabled:opacity-50 w-full"
                        >
                          {submitting ? 'Sending...' : 'Send'}
                        </button>
                      </div>

                      {transferError && (
                        <div className="sm:col-span-3 text-sm text-ledger-red bg-ledger-red/10 border border-ledger-red/30 rounded-sm px-3 py-2">
                          {transferError}
                        </div>
                      )}
                      {transferResult && (
                        <div className="sm:col-span-3 text-sm text-ledger-green bg-ledger-green/10 border border-ledger-green/30 rounded-sm px-3 py-2">
                          {transferResult.message} New balance: Rs {parseFloat(transferResult.newBalance).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </div>
                      )}
                    </form>
                  )}
                </div>

                {/* Ledger */}
                <h3 className="font-display text-lg text-ink-900 mb-3">
                  Transaction History — #{selectedAccount.AccountNo}
                </h3>
                <div className="bg-white border border-paper-line rounded-sm overflow-hidden">
                  <table className="w-full ledger-table">
                    <thead>
                      <tr className="bg-ink-900 text-paper text-left text-sm">
                        <th className="px-5 py-3 font-medium">Type</th>
                        <th className="px-5 py-3 font-medium">Amount</th>
                        <th className="px-5 py-3 font-medium">Balance After</th>
                        <th className="px-5 py-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map((entry) => (
                        <tr key={entry.EntryID} className="text-sm">
                          <td className="px-5 py-3">
                            <span className={`stamp ${entry.EntryType === 'CREDIT' ? 'text-ledger-green' : 'text-ledger-red'}`}>
                              {entry.EntryType}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-mono">
                            Rs {parseFloat(entry.Amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-5 py-3 font-mono text-slate-soft">
                            Rs {parseFloat(entry.BalanceAfter).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-5 py-3 font-mono text-xs text-slate-soft">
                            {new Date(entry.CreatedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {ledger.length === 0 && (
                    <p className="text-center text-slate-soft py-8">No transaction history yet.</p>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}