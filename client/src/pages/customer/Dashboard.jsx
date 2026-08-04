import { useEffect, useState } from 'react';
import customerApi from '../../api/customerClient';
import { useCustomerAuth } from '../../context/CustomerAuthContext';

export default function CustomerDashboard() {
  const { customer, logout } = useCustomerAuth();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history'); // history | transfer | billpay | password

  // Transfer state
  const [transferForm, setTransferForm] = useState({ toAccount: '', amount: '' });
  const [transferError, setTransferError] = useState('');
  const [transferResult, setTransferResult] = useState(null);

  // Bill payment state
  const [billers, setBillers] = useState([]);
  const [billForm, setBillForm] = useState({ billerId: '', consumerNumber: '', amount: '' });
  const [billError, setBillError] = useState('');
  const [billResult, setBillResult] = useState(null);
  const [billHistory, setBillHistory] = useState([]);

  // Change password state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

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

  useEffect(() => {
    loadAccounts();
    customerApi.get('/customer-portal/billers').then((res) => setBillers(res.data)).catch(() => {});
    loadBillHistory();
  }, []);

  async function loadBillHistory() {
    try {
      const { data } = await customerApi.get('/customer-portal/bill-payments');
      setBillHistory(data);
    } catch (err) { /* ignore */ }
  }

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

  async function handleBillPay(e) {
    e.preventDefault();
    setBillError('');
    setBillResult(null);
    setSubmitting(true);
    try {
      const { data } = await customerApi.post('/customer-portal/bill-payment', {
        fromAccount: selectedAccount.AccountNo,
        billerId: billForm.billerId,
        consumerNumber: billForm.consumerNumber,
        amount: parseFloat(billForm.amount)
      });
      setBillResult(data);
      setBillForm({ billerId: '', consumerNumber: '', amount: '' });
      loadAccounts();
      selectAccount(selectedAccount);
      loadBillHistory();
    } catch (err) {
      setBillError(err.response?.data?.error || 'Payment failed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      await customerApi.put('/customer-auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      });
      setPwSuccess(true);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwError(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setSubmitting(false);
    }
  }

  const TABS = [
    { key: 'history', label: 'Transaction History' },
    { key: 'transfer', label: 'Send Money' },
    { key: 'billpay', label: 'Pay Bills' },
    { key: 'password', label: 'Change Password' },
  ];

  return (
    <div className="min-h-screen bg-paper">
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
            <h2 className="font-display text-2xl text-ink-900 mb-4">My Accounts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {accounts.map((a) => (
                <button
                  key={a.AccountNo}
                  onClick={() => selectAccount(a)}
                  className={`text-left bg-white border rounded-sm p-5 transition ${
                    selectedAccount?.AccountNo === a.AccountNo ? 'border-brass ring-1 ring-brass' : 'border-paper-line hover:border-ink-700'
                  }`}
                >
                  <p className="font-mono text-xs text-slate-soft mb-1">#{a.AccountNo}</p>
                  <p className="font-display text-2xl text-ink-900 mb-1">
                    Rs {parseFloat(a.Balance).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-slate-soft">{a.Type}</p>
                </button>
              ))}
              {accounts.length === 0 && <p className="text-slate-soft sm:col-span-2">No accounts found on your profile.</p>}
            </div>

            {selectedAccount && (
              <>
                <div className="flex gap-1 mb-6 border-b border-paper-line overflow-x-auto">
                  {TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                        activeTab === tab.key ? 'border-brass text-ink-900' : 'border-transparent text-slate-soft hover:text-ink-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {activeTab === 'transfer' && (
                  <form onSubmit={handleTransfer} className="bg-white border border-paper-line rounded-sm p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <p className="sm:col-span-3 text-sm text-slate-soft -mt-2 mb-1">
                      Transferring from <span className="font-mono text-ink-900">#{selectedAccount.AccountNo}</span>
                    </p>
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">To Account</label>
                      <input
                        required
                        value={transferForm.toAccount}
                        onChange={(e) => setTransferForm({ ...transferForm, toAccount: e.target.value })}
                        className="w-full px-3 py-2 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Amount (PKR)</label>
                      <input
                        type="number" required min="1" step="0.01"
                        value={transferForm.amount}
                        onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                        className="w-full px-3 py-2 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass"
                      />
                    </div>
                    <div className="flex items-end">
                      <button type="submit" disabled={submitting} className="bg-ink-900 text-paper font-medium px-5 py-2 rounded-sm hover:bg-ink-800 transition disabled:opacity-50 w-full">
                        {submitting ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                    {transferError && <div className="sm:col-span-3 text-sm text-ledger-red bg-ledger-red/10 border border-ledger-red/30 rounded-sm px-3 py-2">{transferError}</div>}
                    {transferResult && (
                      <div className="sm:col-span-3 text-sm text-ledger-green bg-ledger-green/10 border border-ledger-green/30 rounded-sm px-3 py-2">
                        {transferResult.message} New balance: Rs {parseFloat(transferResult.newBalance).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </div>
                    )}
                  </form>
                )}

                {activeTab === 'billpay' && (
                  <div className="mb-8">
                    <form onSubmit={handleBillPay} className="bg-white border border-paper-line rounded-sm p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <p className="sm:col-span-3 text-sm text-slate-soft -mt-2 mb-1">
                        Paying from <span className="font-mono text-ink-900">#{selectedAccount.AccountNo}</span>
                      </p>
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Biller</label>
                        <select
                          required
                          value={billForm.billerId}
                          onChange={(e) => setBillForm({ ...billForm, billerId: e.target.value })}
                          className="w-full px-3 py-2 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass"
                        >
                          <option value="">Select biller</option>
                          {billers.map((b) => (
                            <option key={b.BillerID} value={b.BillerID}>{b.BillerName} ({b.BillerType})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Consumer Number</label>
                        <input
                          required
                          value={billForm.consumerNumber}
                          onChange={(e) => setBillForm({ ...billForm, consumerNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Amount (PKR)</label>
                        <input
                          type="number" required min="1" step="0.01"
                          value={billForm.amount}
                          onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })}
                          className="w-full px-3 py-2 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <button type="submit" disabled={submitting} className="bg-brass text-ink-900 font-medium px-5 py-2 rounded-sm hover:bg-brass-dark transition disabled:opacity-50">
                          {submitting ? 'Paying...' : 'Pay Bill'}
                        </button>
                      </div>
                      {billError && <div className="sm:col-span-3 text-sm text-ledger-red bg-ledger-red/10 border border-ledger-red/30 rounded-sm px-3 py-2">{billError}</div>}
                      {billResult && <div className="sm:col-span-3 text-sm text-ledger-green bg-ledger-green/10 border border-ledger-green/30 rounded-sm px-3 py-2">{billResult.message}</div>}
                    </form>

                    <h3 className="font-display text-lg text-ink-900 mb-3">Payment History</h3>
                    <div className="bg-white border border-paper-line rounded-sm overflow-hidden">
                      <table className="w-full ledger-table">
                        <thead>
                          <tr className="bg-ink-900 text-paper text-left text-sm">
                            <th className="px-5 py-3 font-medium">Biller</th>
                            <th className="px-5 py-3 font-medium">Consumer #</th>
                            <th className="px-5 py-3 font-medium">Amount</th>
                            <th className="px-5 py-3 font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {billHistory.map((b) => (
                            <tr key={b.BillPaymentID} className="text-sm">
                              <td className="px-5 py-3 text-ink-900">{b.BillerName}</td>
                              <td className="px-5 py-3 font-mono text-slate-soft">{b.ConsumerNumber}</td>
                              <td className="px-5 py-3 font-mono">Rs {parseFloat(b.Amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
                              <td className="px-5 py-3 font-mono text-xs text-slate-soft">{new Date(b.PaidAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {billHistory.length === 0 && <p className="text-center text-slate-soft py-8">No bill payments yet.</p>}
                    </div>
                  </div>
                )}

                {activeTab === 'password' && (
                  <form onSubmit={handleChangePassword} className="bg-white border border-paper-line rounded-sm p-6 space-y-4 max-w-md mb-8">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Current Password</label>
                      <input
                        type="password" required
                        value={pwForm.currentPassword}
                        onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">New Password</label>
                      <input
                        type="password" required minLength={8}
                        value={pwForm.newPassword}
                        onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Confirm New Password</label>
                      <input
                        type="password" required
                        value={pwForm.confirmPassword}
                        onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass"
                      />
                    </div>
                    {pwError && <div className="text-sm text-ledger-red bg-ledger-red/10 border border-ledger-red/30 rounded-sm px-3 py-2">{pwError}</div>}
                    {pwSuccess && <div className="text-sm text-ledger-green bg-ledger-green/10 border border-ledger-green/30 rounded-sm px-3 py-2">Password changed successfully.</div>}
                    <button type="submit" disabled={submitting} className="bg-ink-900 text-paper font-medium px-5 py-2.5 rounded-sm hover:bg-ink-800 transition disabled:opacity-50">
                      {submitting ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                )}

                {activeTab === 'history' && (
                  <>
                    <h3 className="font-display text-lg text-ink-900 mb-3">Transaction History — #{selectedAccount.AccountNo}</h3>
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
                                <span className={`stamp ${entry.EntryType === 'CREDIT' ? 'text-ledger-green' : 'text-ledger-red'}`}>{entry.EntryType}</span>
                              </td>
                              <td className="px-5 py-3 font-mono">Rs {parseFloat(entry.Amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
                              <td className="px-5 py-3 font-mono text-slate-soft">Rs {parseFloat(entry.BalanceAfter).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
                              <td className="px-5 py-3 font-mono text-xs text-slate-soft">{new Date(entry.CreatedAt).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {ledger.length === 0 && <p className="text-center text-slate-soft py-8">No transaction history yet.</p>}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}