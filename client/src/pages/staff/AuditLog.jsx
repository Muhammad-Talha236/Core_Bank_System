import { useEffect, useState } from 'react';
import api from '../../api/client';

const opMeta = {
  COMMIT: {
    color: 'text-ledger-green',
    bg: 'bg-ledger-green-100',
    border: 'border-ledger-green/20',
    icon: '✓',
    label: 'Committed',
  },
  ROLLBACK: {
    color: 'text-ledger-red',
    bg: 'bg-ledger-red-100',
    border: 'border-ledger-red/20',
    icon: '↺',
    label: 'Rollback',
  },
  INSERT: {
    color: 'text-brass-dark',
    bg: 'bg-brass-100',
    border: 'border-brass/20',
    icon: '+',
    label: 'Inserted',
  },
  UPDATE: {
    color: 'text-ink-700',
    bg: 'bg-ink-50',
    border: 'border-ink-200',
    icon: '✎',
    label: 'Updated',
  },
};

const ITEMS_PER_PAGE = 20;

function formatDateTime(value) {
  const date = new Date(value);

  return {
    date: date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    api
      .get('/audit')
      .then((res) => setLogs(res.data))
      .catch(() => setError('Could not load audit log.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === 'All'
      ? logs
      : logs.filter((l) => l.Operation === filter);

  /*
   * ============================================================
   * PAGINATION
   * ============================================================
   */

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedLogs = filtered.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const ops = ['All', ...new Set(logs.map((l) => l.Operation))];

  const committedCount = logs.filter(
    (l) => l.Operation === 'COMMIT'
  ).length;

  const rollbackCount = logs.filter(
    (l) => l.Operation === 'ROLLBACK'
  ).length;

  const modificationCount = logs.filter(
    (l) =>
      l.Operation === 'INSERT' ||
      l.Operation === 'UPDATE'
  ).length;

  /*
   * ============================================================
   * PAGINATION HELPERS
   * ============================================================
   */

  const goToPage = (page) => {
    setCurrentPage(
      Math.min(Math.max(page, 1), totalPages)
    );
  };

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1
      );
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [
        1,
        '...',
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      '...',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      totalPages,
    ];
  };

  return (
    <div className="min-h-full bg-[#f5f6f8]">
      <div className="max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">

        {/* =========================================================
            SECURITY HEADER
        ========================================================= */}

        <section className="relative overflow-hidden rounded-3xl bg-[#111827] text-white mb-6 sm:mb-7 shadow-[0_18px_45px_rgba(15,23,42,0.16)] animate-fade-up">

          <div
            className="absolute inset-0 opacity-[0.055]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
              backgroundSize: '34px 34px',
            }}
          />

          <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full border border-white/10" />

          <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full border border-brass/10" />

          <div className="relative p-5 sm:p-7 lg:p-9">

            <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-8">

              <div className="max-w-2xl">

                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-ledger-green shadow-[0_0_0_5px_rgba(34,197,94,0.1)]" />

                  <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">
                    System Oversight
                  </span>
                </div>

                <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] leading-none tracking-tight">
                  Audit Log
                </h1>

                <p className="text-white/50 text-sm sm:text-base mt-4 leading-relaxed max-w-xl">
                  A complete operational trail of recorded banking
                  activities. Review system changes, transactions and
                  administrative events.
                </p>

              </div>

              <div className="xl:min-w-[270px]">

                <div className="border border-white/10 rounded-2xl bg-white/[0.035] backdrop-blur-sm p-4">

                  <div className="flex items-center justify-between mb-3">

                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                      Activity Status
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-[10px] text-ledger-green">
                      <span className="w-1.5 h-1.5 rounded-full bg-ledger-green" />
                      Monitoring
                    </span>

                  </div>

                  <p className="font-display text-3xl">
                    {logs.length}
                  </p>

                  <p className="text-[11px] text-white/35 mt-1">
                    Total recorded operations
                  </p>

                </div>

              </div>

            </div>

          </div>
        </section>

        {/* =========================================================
            OPERATION SUMMARY
        ========================================================= */}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-paper-line border border-paper-line rounded-2xl overflow-hidden mb-7 animate-fade-up">

            {/* Committed */}

            <div className="bg-white p-5 sm:p-6">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-soft">
                    Committed
                  </p>

                  <p className="font-display text-2xl sm:text-3xl text-ink-900 mt-2">
                    {committedCount}
                  </p>

                </div>

                <div className="w-10 h-10 rounded-full bg-ledger-green-100 flex items-center justify-center text-ledger-green font-bold">
                  ✓
                </div>

              </div>

            </div>

            {/* Data Changes */}

            <div className="bg-white p-5 sm:p-6">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-soft">
                    Data Changes
                  </p>

                  <p className="font-display text-2xl sm:text-3xl text-ink-900 mt-2">
                    {modificationCount}
                  </p>

                </div>

                <div className="w-10 h-10 rounded-full bg-brass-100 flex items-center justify-center text-brass-dark font-bold">
                  +
                </div>

              </div>

            </div>

            {/* Rollbacks */}

            <div className="bg-white p-5 sm:p-6">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-soft">
                    Rollbacks
                  </p>

                  <p className="font-display text-2xl sm:text-3xl text-ink-900 mt-2">
                    {rollbackCount}
                  </p>

                </div>

                <div className="w-10 h-10 rounded-full bg-ledger-red-100 flex items-center justify-center text-ledger-red font-bold">
                  ↺
                </div>

              </div>

            </div>

          </div>
        )}

        {/* =========================================================
            FILTER BAR
        ========================================================= */}

        {!loading && !error && logs.length > 0 && (
          <div className="bg-white border border-paper-line rounded-2xl p-4 mb-5 shadow-[0_4px_18px_rgba(15,23,42,0.035)] animate-fade-up">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              <div>

                <p className="text-sm font-medium text-ink-900">
                  Activity Stream
                </p>

                <p className="text-xs text-slate-soft mt-0.5">
                  {filtered.length} recorded event
                  {filtered.length !== 1 ? 's' : ''}
                </p>

              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">

                {ops.map((op) => {

                  const meta = opMeta[op];

                  return (
                    <button
                      key={op}
                      onClick={() => {
                        setFilter(op);
                        setCurrentPage(1);
                      }}
                      className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[11px] font-medium transition-all ${
                        filter === op
                          ? 'bg-ink-900 text-white shadow-sm'
                          : 'text-slate-soft hover:bg-slate-50 hover:text-ink-900'
                      }`}
                    >

                      {meta && (
                        <span className="text-xs">
                          {meta.icon}
                        </span>
                      )}

                      {op}

                    </button>
                  );
                })}

              </div>

            </div>

          </div>
        )}

        {/* =========================================================
            LOADING
        ========================================================= */}

        {loading && (
          <div className="bg-white border border-paper-line rounded-2xl overflow-hidden animate-fade-up">

            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="p-5 border-b border-paper-line last:border-0 animate-pulse"
              >

                <div className="flex gap-4">

                  <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />

                  <div className="flex-1">

                    <div className="flex justify-between gap-4 mb-3">

                      <div className="h-4 w-48 bg-slate-100 rounded" />

                      <div className="h-3 w-28 bg-slate-100 rounded" />

                    </div>

                    <div className="h-3 w-3/4 bg-slate-100 rounded mb-2" />

                    <div className="h-3 w-24 bg-slate-100 rounded" />

                  </div>

                </div>

              </div>
            ))}

          </div>
        )}

        {/* =========================================================
            ERROR
        ========================================================= */}

        {error && (
          <div className="bg-white border border-ledger-red/20 rounded-2xl p-10 text-center">

            <div className="w-12 h-12 mx-auto rounded-full bg-ledger-red-100 flex items-center justify-center mb-4">

              <svg
                className="w-6 h-6 text-ledger-red"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3m0 4h.01M10.3 3.8L2.7 17a2 2 0 001.7 3h15.2a2 2 0 001.7-3L13.7 3.8a2 2 0 00-3.4 0z"
                />

              </svg>

            </div>

            <p className="text-sm font-medium text-ledger-red">
              {error}
            </p>

          </div>
        )}

        {/* =========================================================
            AUDIT TABLE
        ========================================================= */}

        {!loading && !error && (
          <>
            <div className="bg-white border border-paper-line rounded-2xl overflow-hidden shadow-[0_5px_22px_rgba(15,23,42,0.045)] animate-fade-up">

              {/* Desktop Table Header */}

              <div className="hidden md:grid grid-cols-[120px_minmax(180px,1fr)_minmax(250px,1.6fr)_150px] gap-4 px-5 lg:px-6 py-3 bg-[#fafafa] border-b border-paper-line">

                <span className="text-[9px] font-mono uppercase tracking-[0.16em] text-slate-soft">
                  Operation
                </span>

                <span className="text-[9px] font-mono uppercase tracking-[0.16em] text-slate-soft">
                  Resource
                </span>

                <span className="text-[9px] font-mono uppercase tracking-[0.16em] text-slate-soft">
                  Activity
                </span>

                <span className="text-[9px] font-mono uppercase tracking-[0.16em] text-slate-soft text-right">
                  Recorded
                </span>

              </div>

              {/* =====================================================
                  AUDIT ENTRIES
              ===================================================== */}

              <div>

                {paginatedLogs.map((log, i) => {

                  const meta =
                    opMeta[log.Operation] || {
                      color: 'text-slate-soft',
                      bg: 'bg-ink-50',
                      border: 'border-paper-line',
                      icon: '•',
                      label: log.Operation,
                    };

                  const datetime = formatDateTime(
                    log.CreatedAt
                  );

                  return (
                    <div
                      key={log.LogID}
                      className="group relative px-4 sm:px-5 lg:px-6 py-5 border-b border-paper-line last:border-0 hover:bg-[#fcfcfd] transition-colors duration-200 animate-fade-up"
                      style={{
                        animationDelay: `${Math.min(i, 10) * 35}ms`,
                      }}
                    >

                      {/* =================================================
                          DESKTOP ROW
                      ================================================= */}

                      <div className="hidden md:grid grid-cols-[120px_minmax(180px,1fr)_minmax(250px,1.6fr)_150px] gap-4 items-center">

                        {/* Operation */}

                        <div>

                          <span
                            className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border ${meta.bg} ${meta.color} ${meta.border}`}
                          >

                            <span className="text-xs">
                              {meta.icon}
                            </span>

                            {log.Operation}

                          </span>

                        </div>

                        {/* Resource */}

                        <div className="min-w-0">

                          <div className="flex items-center gap-2">

                            <span className="font-medium text-sm text-ink-900 truncate">
                              {log.TableAffected}
                            </span>

                            {log.RecordID != null && (
                              <span className="shrink-0 font-mono text-[10px] text-slate-soft bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                                #{log.RecordID}
                              </span>
                            )}

                          </div>

                          <p className="text-[11px] text-slate-soft mt-1">
                            Database resource
                          </p>

                        </div>

                        {/* Activity */}

                        <div className="min-w-0">

                          <p className="text-sm text-slate">
                            {log.Details ||
                              'No additional details recorded.'}
                          </p>

                          <p className="text-[10px] text-slate-faint mt-1.5">

                            Performed by{' '}

                            <span className="text-slate-soft font-medium">
                              {log.UserName}
                            </span>

                          </p>

                        </div>

                        {/* Date */}

                        <div className="text-right">

                          <p className="font-mono text-[11px] text-ink-900">
                            {datetime.date}
                          </p>

                          <p className="font-mono text-[10px] text-slate-soft mt-1">
                            {datetime.time}
                          </p>

                        </div>

                      </div>

                      {/* =================================================
                          MOBILE ROW
                      ================================================= */}

                      <div className="md:hidden">

                        <div className="flex items-start justify-between gap-3">

                          <div className="flex items-center gap-3 min-w-0">

                            <div
                              className={`w-10 h-10 rounded-xl ${meta.bg} ${meta.color} flex items-center justify-center font-bold shrink-0 border ${meta.border}`}
                            >
                              {meta.icon}
                            </div>

                            <div className="min-w-0">

                              <div className="flex items-center gap-2">

                                <span
                                  className={`text-[10px] font-bold ${meta.color}`}
                                >
                                  {log.Operation}
                                </span>

                                {log.RecordID != null && (
                                  <span className="font-mono text-[10px] text-slate-soft">
                                    #{log.RecordID}
                                  </span>
                                )}

                              </div>

                              <p className="font-medium text-sm text-ink-900 truncate mt-0.5">
                                {log.TableAffected}
                              </p>

                            </div>

                          </div>

                          <div className="text-right shrink-0">

                            <p className="font-mono text-[10px] text-ink-900">
                              {datetime.date}
                            </p>

                            <p className="font-mono text-[10px] text-slate-soft mt-0.5">
                              {datetime.time}
                            </p>

                          </div>

                        </div>

                        <div className="mt-4 ml-[52px]">

                          <p className="text-sm text-slate leading-relaxed">
                            {log.Details ||
                              'No additional details recorded.'}
                          </p>

                          <div className="flex items-center gap-2 mt-3">

                            <span className="text-[10px] text-slate-faint uppercase tracking-wide">
                              User
                            </span>

                            <span className="text-[11px] font-medium text-slate-soft">
                              {log.UserName}
                            </span>

                          </div>

                        </div>

                      </div>

                    </div>
                  );
                })}

                {/* =====================================================
                    EMPTY STATE
                ===================================================== */}

                {filtered.length === 0 && (
                  <div className="py-20 px-6 text-center">

                    <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center mb-4">

                      <svg
                        className="w-7 h-7 text-slate-soft"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                      >

                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12h6m-6 4h4m5-12H6a2 2 0 00-2 2v14l4-3h10a2 2 0 002-2V6a2 2 0 00-2-2z"
                        />

                      </svg>

                    </div>

                    <h3 className="font-display text-lg text-ink-900">
                      No audit entries
                    </h3>

                    <p className="text-sm text-slate-soft mt-1">
                      No operations match the selected filter.
                    </p>

                    {filter !== 'All' && (
                      <button
                        onClick={() => {
                          setFilter('All');
                          setCurrentPage(1);
                        }}
                        className="mt-5 text-sm font-medium text-ink-900 hover:text-brass transition-colors"
                      >
                        View all activity
                      </button>
                    )}

                  </div>
                )}

              </div>

            </div>

            {/* =========================================================
                PAGINATION
            ========================================================= */}

            {filtered.length > 0 && totalPages > 1 && (
              <div className="mt-4 bg-white border border-paper-line rounded-2xl px-4 py-3 sm:px-5">

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                  {/* Result Information */}

                  <p className="text-xs text-slate-soft text-center sm:text-left">

                    Showing{' '}

                    <span className="font-medium text-ink-900">
                      {startIndex + 1}
                    </span>

                    {' '}to{' '}

                    <span className="font-medium text-ink-900">
                      {Math.min(
                        startIndex + ITEMS_PER_PAGE,
                        filtered.length
                      )}
                    </span>

                    {' '}of{' '}

                    <span className="font-medium text-ink-900">
                      {filtered.length}
                    </span>

                    {' '}transactions

                  </p>

                  {/* Pagination Controls */}

                  <div className="flex items-center justify-center gap-1">

                    {/* Previous */}

                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() =>
                        goToPage(currentPage - 1)
                      }
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-paper-line text-slate-soft hover:bg-slate-50 hover:text-ink-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Previous page"
                    >
                      ←
                    </button>

                    {/* Page Numbers */}

                    {getPageNumbers().map((page, index) => {

                      if (page === '...') {
                        return (
                          <span
                            key={`ellipsis-${index}`}
                            className="w-8 text-center text-xs text-slate-soft"
                          >
                            …
                          </span>
                        );
                      }

                      return (
                        <button
                          key={page}
                          type="button"
                          onClick={() => goToPage(page)}
                          className={`w-9 h-9 rounded-lg text-xs font-medium transition-all ${
                            currentPage === page
                              ? 'bg-ink-900 text-white shadow-sm'
                              : 'text-slate-soft hover:bg-slate-50 hover:text-ink-900'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    {/* Next */}

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        goToPage(currentPage + 1)
                      }
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-paper-line text-slate-soft hover:bg-slate-50 hover:text-ink-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Next page"
                    >
                      →
                    </button>

                  </div>

                </div>

              </div>
            )}

          </>
        )}

        {/* =========================================================
            FOOTER NOTE
        ========================================================= */}

        {!loading && !error && logs.length > 0 && (
          <div className="flex items-center justify-center gap-2 mt-5 text-[10px] font-mono uppercase tracking-wider text-slate-faint">

            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z"
              />

            </svg>

            System audit trail • Most recent activity first

          </div>
        )}

      </div>
    </div>
  );
}