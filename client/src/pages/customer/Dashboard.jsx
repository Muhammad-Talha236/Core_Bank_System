import { useEffect, useState } from 'react';
import customerApi from '../../api/customerClient';

export default function CustomerDashboard() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  async function loadAccounts() {
    try {
      const { data } = await customerApi.get('/customer-portal/accounts');

      setAccounts(data);

      if (data.length > 0 && !selectedAccount) {
        selectAccount(data[0]);
      }
    } catch {
      // Keep existing UI stable if the request fails.
    } finally {
      setLoading(false);
    }
  }

  async function selectAccount(account) {
    setSelectedAccount(account);
    setLedgerLoading(true);

    try {
      const { data } = await customerApi.get(
        `/customer-portal/ledger/${account.AccountNo}`
      );

      setLedger(data);
    } catch {
      setLedger([]);
    } finally {
      setLedgerLoading(false);
    }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  const totalBalance = accounts.reduce(
    (sum, account) => sum + parseFloat(account.Balance || 0),
    0
  );

  const activeAccounts = accounts.filter(
    (account) => account.Status === 'Active'
  ).length;

  const totalCredits = ledger
    .filter((entry) => entry.EntryType === 'CREDIT')
    .reduce((sum, entry) => sum + parseFloat(entry.Amount || 0), 0);

  const totalDebits = ledger
    .filter((entry) => entry.EntryType !== 'CREDIT')
    .reduce((sum, entry) => sum + parseFloat(entry.Amount || 0), 0);

  const formatCurrency = (value) =>
    `Rs ${Number(value || 0).toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="max-w-[1380px] mx-auto space-y-10 pb-10">

      {/* =========================================================
          PAGE HEADER
      ========================================================= */}
      <header className="animate-fade-up">
        <div className="flex items-center gap-3 mb-3">
          <span className="h-px w-9 bg-brass" />
          <p className="eyebrow">Personal Banking</p>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl text-ink-900 tracking-tight">
              Your Financial Overview
            </h1>

            <p className="text-slate-soft mt-2 max-w-xl">
              A clear view of your accounts, available funds and recent
              financial activity.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-soft">
            <span className="w-2 h-2 rounded-full bg-ledger-green" />
            Banking services active
          </div>
        </div>
      </header>


      {/* =========================================================
          HERO BALANCE
      ========================================================= */}
      {loading ? (
        <div className="panel p-8 animate-pulse">
          <div className="h-3 w-32 bg-paper rounded mb-5" />
          <div className="h-10 w-64 bg-paper rounded mb-4" />
          <div className="h-3 w-80 bg-paper rounded" />
        </div>
      ) : (
        <section
          className="
            relative overflow-hidden
            bg-ink-900 text-paper
            rounded-xl
            border border-ink-800
            shadow-elevated
            animate-fade-up
          "
        >
          {/* Decorative geometry */}
          <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full border border-brass/15" />
          <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full border border-brass/10" />
          <div className="absolute right-10 bottom-[-80px] w-44 h-44 rounded-full bg-brass/5 blur-3xl" />

          <div className="relative p-7 sm:p-9 lg:p-10">

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-brass" />
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper/55">
                    Total Portfolio Balance
                  </p>
                </div>

                <p className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight">
                  {formatCurrency(totalBalance)}
                </p>

                <p className="text-sm text-paper/45 mt-3">
                  Combined balance across all your registered accounts
                </p>
              </div>


              {/* Portfolio meta */}
              <div className="grid grid-cols-2 border border-white/10 rounded-lg overflow-hidden min-w-[280px]">

                <div className="px-5 py-4 border-r border-white/10">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-paper/40">
                    Accounts
                  </p>

                  <p className="font-display text-2xl mt-1">
                    {accounts.length}
                  </p>

                  <p className="text-[11px] text-paper/40 mt-0.5">
                    Registered
                  </p>
                </div>

                <div className="px-5 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-paper/40">
                    Active
                  </p>

                  <p className="font-display text-2xl mt-1 text-brass">
                    {activeAccounts}
                  </p>

                  <p className="text-[11px] text-paper/40 mt-0.5">
                    In good standing
                  </p>
                </div>

              </div>

            </div>
          </div>

          {/* Bottom accent */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-brass/60 to-transparent" />
        </section>
      )}


      {/* =========================================================
          ACCOUNT SECTION
      ========================================================= */}
      {!loading && (
        <section className="animate-fade-up" style={{ animationDelay: '100ms' }}>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">

            <div>
              <p className="eyebrow mb-1">Accounts</p>

              <h2 className="font-display text-2xl sm:text-3xl text-ink-900">
                Your Accounts
              </h2>
            </div>

            <p className="text-xs text-slate-soft font-mono">
              Select an account to view its activity
            </p>

          </div>


          {accounts.length === 0 ? (
            <div className="panel p-12 text-center">
              <div className="w-12 h-12 mx-auto rounded-full border border-paper-line flex items-center justify-center mb-4">
                <span className="font-display text-xl text-slate-soft">—</span>
              </div>

              <p className="font-display text-xl text-ink-900">
                No accounts available
              </p>

              <p className="text-sm text-slate-soft mt-1">
                No active accounts were found on your profile.
              </p>
            </div>
          ) : (

            <div className="border-y border-paper-line">

              {accounts.map((account, index) => {

                const isSelected =
                  selectedAccount?.AccountNo === account.AccountNo;

                return (
                  <button
                    key={account.AccountNo}
                    onClick={() => selectAccount(account)}
                    className={`
                      group w-full text-left
                      flex flex-col md:flex-row
                      md:items-center
                      gap-5 md:gap-8
                      py-5 px-3
                      border-b last:border-b-0 border-paper-line
                      transition-all duration-300
                      animate-fade-up
                      ${isSelected
                        ? 'bg-white'
                        : 'hover:bg-white/60'
                      }
                    `}
                    style={{
                      animationDelay: `${120 + index * 70}ms`,
                    }}
                  >

                    {/* Account identity */}
                    <div className="flex items-center gap-4 md:w-[34%]">

                      <div
                        className={`
                          w-11 h-11 rounded-lg
                          flex items-center justify-center
                          border
                          transition-all duration-300
                          ${isSelected
                            ? 'bg-ink-900 border-ink-900 text-brass'
                            : 'bg-paper border-paper-line text-slate-soft group-hover:border-brass/50'
                          }
                        `}
                      >
                        <span className="font-display text-lg">
                          {account.Type?.charAt(0) || 'A'}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-display text-lg text-ink-900">
                            {account.Type} Account
                          </p>

                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-brass" />
                          )}
                        </div>

                        <p className="font-mono text-[11px] text-slate-soft mt-0.5">
                          #{account.AccountNo}
                        </p>
                      </div>

                    </div>


                    {/* Balance */}
                    <div className="md:flex-1">

                      <p className="font-mono text-[10px] uppercase tracking-wider text-slate-soft mb-1">
                        Available Balance
                      </p>

                      <p className="font-display text-xl text-ink-900">
                        {formatCurrency(account.Balance)}
                      </p>

                    </div>


                    {/* Status */}
                    <div className="md:w-32">

                      <p className="font-mono text-[10px] uppercase tracking-wider text-slate-soft mb-1">
                        Status
                      </p>

                      <div className="flex items-center gap-2">
                        <span
                          className={`
                            w-1.5 h-1.5 rounded-full
                            ${account.Status === 'Active'
                              ? 'bg-ledger-green'
                              : 'bg-ledger-red'
                            }
                          `}
                        />

                        <span className="text-xs font-medium text-ink-800">
                          {account.Status}
                        </span>
                      </div>

                    </div>


                    {/* Arrow */}
                    <div className="hidden md:flex w-8 justify-end">

                      <span
                        className={`
                          text-lg transition-all duration-300
                          ${isSelected
                            ? 'text-brass translate-x-1'
                            : 'text-slate-soft group-hover:text-ink-900 group-hover:translate-x-1'
                          }
                        `}
                      >
                        →
                      </span>

                    </div>

                  </button>
                );
              })}

            </div>
          )}

        </section>
      )}


      {/* =========================================================
          LEDGER
      ========================================================= */}
      {selectedAccount && (

        <section
          key={selectedAccount.AccountNo}
          className="animate-scale-in"
        >

          {/* Ledger heading */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-5">

            <div>
              <div className="flex items-center gap-3 mb-2">
                <p className="eyebrow">Account Activity</p>
                <span className="font-mono text-[10px] text-brass-dark">
                  #{selectedAccount.AccountNo}
                </span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl text-ink-900">
                Passbook Ledger
              </h2>

              <p className="text-sm text-slate-soft mt-1">
                Recent entries and running account balance.
              </p>
            </div>


            {/* Ledger summary */}
            <div className="flex gap-6">

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-slate-soft">
                  Credits
                </p>

                <p className="font-display text-lg text-ledger-green">
                  {formatCurrency(totalCredits)}
                </p>
              </div>

              <div className="w-px bg-paper-line" />

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-slate-soft">
                  Debits
                </p>

                <p className="font-display text-lg text-ledger-red">
                  {formatCurrency(totalDebits)}
                </p>
              </div>

            </div>

          </div>


          {/* Ledger container */}
          <div className="panel overflow-hidden">

            <div className="px-5 sm:px-6 py-4 border-b border-paper-line flex items-center justify-between">

              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-ledger-green" />

                <span className="text-xs font-medium text-ink-800">
                  Double-entry verified
                </span>
              </div>

              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-soft">
                {ledger.length} entries
              </span>

            </div>


            {ledgerLoading ? (

              <div className="py-16 flex justify-center">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-brass animate-pulse" />
                  <span className="text-xs font-mono text-slate-soft">
                    Loading ledger...
                  </span>
                </div>
              </div>

            ) : ledger.length === 0 ? (

              <div className="py-16 text-center">

                <p className="font-display text-xl text-ink-900">
                  No activity yet
                </p>

                <p className="text-sm text-slate-soft mt-1">
                  Transactions for this account will appear here.
                </p>

              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full ledger-table text-left text-sm min-w-[720px]">

                  <thead>
                    <tr className="bg-ink-900 text-paper">

                      <th className="px-5 py-3.5 font-medium">
                        Entry
                      </th>

                      <th className="px-5 py-3.5 font-medium">
                        Amount
                      </th>

                      <th className="px-5 py-3.5 font-medium">
                        Balance After
                      </th>

                      <th className="px-5 py-3.5 font-medium">
                        Timestamp
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {ledger.map((entry) => {

                      const isCredit = entry.EntryType === 'CREDIT';

                      return (
                        <tr
                          key={entry.EntryID}
                          className="group transition-colors hover:bg-paper"
                        >

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <span
                                className={`
                                  w-7 h-7 rounded-full
                                  flex items-center justify-center
                                  text-xs font-mono
                                  ${isCredit
                                    ? 'bg-ledger-green-100 text-ledger-green'
                                    : 'bg-ledger-red-100 text-ledger-red'
                                  }
                                `}
                              >
                                {isCredit ? '↑' : '↓'}
                              </span>

                              <div>
                                <p className="font-medium text-ink-900">
                                  {entry.EntryType}
                                </p>

                                <p className="text-[10px] font-mono text-slate-soft uppercase">
                                  Ledger Entry
                                </p>
                              </div>

                            </div>

                          </td>


                          <td
                            className={`
                              px-5 py-4 font-mono font-medium
                              ${isCredit
                                ? 'text-ledger-green'
                                : 'text-ledger-red'
                              }
                            `}
                          >
                            {isCredit ? '+' : '-'}
                            {formatCurrency(entry.Amount)}
                          </td>


                          <td className="px-5 py-4 font-mono text-ink-800">
                            {formatCurrency(entry.BalanceAfter)}
                          </td>


                          <td className="px-5 py-4">

                            <p className="font-mono text-xs text-slate-soft">
                              {new Date(entry.CreatedAt).toLocaleDateString(
                                'en-PK',
                                {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                }
                              )}
                            </p>

                            <p className="font-mono text-[10px] text-slate-soft/70 mt-0.5">
                              {new Date(entry.CreatedAt).toLocaleTimeString(
                                'en-PK',
                                {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )}
                            </p>

                          </td>

                        </tr>
                      );
                    })}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </section>
      )}

    </div>
  );
}