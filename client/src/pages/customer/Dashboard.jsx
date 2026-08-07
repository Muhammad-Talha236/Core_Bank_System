import { useEffect, useState } from 'react';
import customerApi from '../../api/customerClient';
import { useCustomerAuth } from '../../context/CustomerAuthContext';

export default function CustomerDashboard() {
  const { customer } = useCustomerAuth();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadAccounts();
  }, []);

  const totalBalance = accounts.reduce((sum, a) => sum + parseFloat(a.Balance || 0), 0);

  return (
    <div className="space-y-8">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="font-mono text-sm text-slate-soft animate-pulse">Loading financial portfolios...</p>
        </div>
      ) : (
        <>
          {/* Wealth Summary Banner */}
          <div className="bg-ink-900 text-paper rounded-sm p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-brass/30 shadow-sm">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-brass mb-1">Total Net Portfolio Balance</p>
              <p className="font-display text-4xl text-paper">
                Rs {totalBalance.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-sm text-right">
              <p className="font-mono text-[11px] text-paper/60 uppercase">Active Accounts</p>
              <p className="font-display text-xl text-paper">{accounts.length} Registered</p>
            </div>
          </div>

          <div>
            <h3 className="font-display text-2xl text-ink-900 mb-4">Your Accounts</h3>
            
            {/* Account Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {accounts.map((a) => {
                const isSelected = selectedAccount?.AccountNo === a.AccountNo;
                return (
                  <button
                    key={a.AccountNo}
                    onClick={() => selectAccount(a)}
                    className={`text-left bg-white border rounded-sm p-5 transition-all duration-200 relative overflow-hidden ${
                      isSelected 
                        ? 'border-brass ring-2 ring-brass/20 shadow-md translate-y-[-2px]' 
                        : 'border-paper-line hover:border-ink-700 shadow-sm hover:shadow'
                    }`}
                  >
                    {isSelected && <div className="absolute top-0 left-0 w-1.5 h-full bg-brass" />}
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-mono text-xs text-slate-soft bg-paper px-2 py-0.5 rounded border border-paper-line">
                        #{a.AccountNo}
                      </span>
                      <span className={`stamp text-[10px] ${a.Status === 'Active' ? 'text-ledger-green' : 'text-ledger-red'}`}>
                        {a.Status}
                      </span>
                    </div>
                    <p className="font-display text-2xl text-ink-900 mb-1">
                      Rs {parseFloat(a.Balance).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs font-mono uppercase tracking-wider text-slate-soft">{a.Type} Account</p>
                  </button>
                );
              })}
              {accounts.length === 0 && (
                <p className="text-slate-soft sm:col-span-3 bg-white border border-paper-line p-8 text-center rounded-sm">
                  No active accounts found on your profile.
                </p>
              )}
            </div>

            {selectedAccount && (
              <div className="bg-white border border-paper-line rounded-sm shadow-sm overflow-hidden p-8">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-display text-lg text-ink-900">
                    Passbook Ledger &mdash; <span className="font-mono text-brass-dark">#{selectedAccount.AccountNo}</span>
                  </h4>
                  <span className="text-xs font-mono text-slate-soft">Double-entry verified</span>
                </div>

                <div className="border border-paper-line rounded-sm overflow-hidden bg-white">
                  <table className="w-full ledger-table text-left text-sm">
                    <thead>
                      <tr className="bg-ink-900 text-paper">
                        <th className="px-5 py-3 font-medium">Entry Type</th>
                        <th className="px-5 py-3 font-medium">Amount</th>
                        <th className="px-5 py-3 font-medium">Balance After</th>
                        <th className="px-5 py-3 font-medium">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map((entry) => (
                        <tr key={entry.EntryID} className="border-b border-paper-line">
                          <td className="px-5 py-3">
                            <span className={`stamp text-xs ${entry.EntryType === 'CREDIT' ? 'text-ledger-green' : 'text-ledger-red'}`}>
                              {entry.EntryType}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-mono font-medium">
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
                    <p className="text-center text-slate-soft py-10 text-sm">No transaction ledger entries recorded for this account yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}