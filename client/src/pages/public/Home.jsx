import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { IconLayers, IconArrows, IconLock, IconAudit, IconChat, IconUsers, IconShield } from '../../components/public/Icons';

const HERO_STAMPS = ['OTP-Verified Sign-In', 'Maker-Checker Approval', 'Full Audit Trail'];

const STATS = [
  { value: 'Rs 4.8B+', label: 'Balances tracked' },
  { value: '128,000+', label: 'Ledger entries logged' },
  { value: '3', label: 'Account products' },
  { value: '24/7', label: 'Online access' },
];

const FEATURES = [
  { icon: IconLayers, title: 'Savings, Current & Term', desc: 'Open the right account for the goal — everyday spending, steady saving, or a fixed-term deposit with a locked-in rate.' },
  { icon: IconArrows, title: 'Transfers that check themselves', desc: 'Every transfer above Rs 100,000 waits for a second employee to review before it moves — no single person moves large sums alone.' },
  { icon: IconLock, title: 'OTP on every sign-in', desc: 'Online banking sessions are verified with a one-time code sent to your registered email, every time.' },
  { icon: IconAudit, title: 'A ledger that cannot be edited', desc: 'Deposits, withdrawals, approvals — every action is written to a permanent audit log the moment it happens.' },
  { icon: IconChat, title: 'A help desk that knows the bank', desc: 'Ask the built-in assistant how something works and get an answer sourced from our own policy guide.' },
  { icon: IconUsers, title: 'Branch-aware from the ground up', desc: 'Staff see the customers and accounts that belong to their branch — nothing more, nothing hidden.' },
];

export default function Home() {
  return (
    <div className="bg-paper text-slate">
      <PublicNavbar />

      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden border-b border-paper-line">
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 47px, #0B1F3A 47px, #0B1F3A 48px)',
          }}
        />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
          <div>
            <p className="font-mono text-xs tracking-[0.3em] text-brass-dark uppercase mb-5">Core Banking, Recorded Properly</p>
            <h1 className="font-display text-5xl sm:text-6xl text-ink-900 leading-[1.05] mb-6">
              Every entry
              <br />
              accounted for.
            </h1>
            <p className="text-slate-soft text-lg leading-relaxed max-w-md mb-8">
              Meridian keeps a complete, tamper-proof record of your money —
              savings, transfers, term deposits — reviewed the way real banks
              review it: by a second pair of eyes, every time.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <Link
                to="/customer/register"
                className="bg-ink-900 text-paper font-medium px-6 py-3 rounded-sm hover:bg-ink-800 transition shadow-sm"
              >
                Register for Online Banking
              </Link>
              <Link
                to="/customer/login"
                className="border border-ink-900/20 text-ink-900 font-medium px-6 py-3 rounded-sm hover:border-ink-900 transition"
              >
                Sign In
              </Link>
            </div>

            <div className="flex flex-wrap gap-2">
              {HERO_STAMPS.map((s) => (
                <span key={s} className="stamp text-ink-900">{s}</span>
              ))}
            </div>
          </div>

          {/* Hero visual: a stylised passbook / ledger extract */}
          <div className="relative">
            <div className="absolute -inset-4 bg-brass/10 rounded-sm rotate-2" />
            <div className="relative bg-white border border-paper-line rounded-sm shadow-xl p-6 rotate-[-1.5deg] hover:rotate-0 transition-transform duration-300">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-paper-line">
                <div>
                  <p className="font-display text-lg text-ink-900">Primary Savings</p>
                  <p className="font-mono text-xs text-slate-soft">#84213097</p>
                </div>
                <span className="stamp text-ledger-green text-[10px]">Active</span>
              </div>

              <p className="font-mono text-[11px] uppercase tracking-widest text-slate-soft mb-1">Current Balance</p>
              <p className="font-display text-4xl text-ink-900 mb-6">Rs 842,150.00</p>

              <div className="space-y-3">
                {[
                  { label: 'Salary Credit', type: 'CREDIT', amount: '150,000.00' },
                  { label: 'Utility Bill · KESCO', type: 'DEBIT', amount: '8,420.00' },
                  { label: 'Transfer to #71092284', type: 'DEBIT', amount: '25,000.00' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-sm border-b border-paper-line/70 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2.5">
                      <span className={`stamp text-[9px] ${row.type === 'CREDIT' ? 'text-ledger-green' : 'text-ledger-red'}`}>
                        {row.type}
                      </span>
                      <span className="text-slate">{row.label}</span>
                    </div>
                    <span className="font-mono text-slate-soft">Rs {row.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Stats / trust bar ---------- */}
      <section className="border-b border-paper-line bg-white">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center sm:text-left">
              <p className="font-display text-3xl text-ink-900">{s.value}</p>
              <p className="font-mono text-[11px] uppercase tracking-wide text-slate-soft mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Features preview ---------- */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="max-w-xl mb-14">
          <p className="font-mono text-xs tracking-[0.3em] text-brass-dark uppercase mb-3">What's inside</p>
          <h2 className="font-display text-4xl text-ink-900 mb-4">A ledger for modern banking.</h2>
          <p className="text-slate-soft leading-relaxed">
            Everything Meridian does traces back to a single principle:
            nothing moves without a record, and nothing large moves without
            a second signature.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-paper-line border border-paper-line rounded-sm overflow-hidden">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="bg-white p-7">
              <div className="flex items-center justify-between mb-5">
                <span className="text-brass-dark"><f.icon /></span>
                <span className="font-mono text-xs text-paper-line">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="font-display text-lg text-ink-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-soft leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <Link to="/features" className="text-sm font-medium text-brass-dark hover:underline">
            See every feature in detail →
          </Link>
        </div>
      </section>

      {/* ---------- Security band ---------- */}
      <section className="bg-ink-900 text-paper">
        <div className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-14 items-center">
          <div>
            <IconShield className="text-brass mb-6" width={40} height={40} />
            <h2 className="font-display text-3xl sm:text-4xl mb-4">Built like a ledger, secured like a vault.</h2>
            <p className="text-paper/70 leading-relaxed max-w-md">
              Security at Meridian isn't a feature bolted on afterward — it's
              the same discipline that built double-entry bookkeeping,
              applied to modern infrastructure.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { t: 'Rate-limited logins', d: 'Accounts lock automatically after five failed attempts, staff and customers alike.' },
              { t: 'Four-eyes approval', d: 'Large transactions sit in a review queue until a different employee signs off.' },
              { t: 'Two-factor by default', d: 'Every online banking session is confirmed with a one-time code by email.' },
              { t: 'Immutable audit log', d: 'Every operation is written once, timestamped, and never edited or deleted.' },
            ].map((item) => (
              <div key={item.t} className="border border-white/10 rounded-sm p-5 bg-white/5">
                <p className="font-medium text-paper mb-1.5">{item.t}</p>
                <p className="text-sm text-paper/60 leading-relaxed">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <p className="font-mono text-xs tracking-[0.3em] text-brass-dark uppercase mb-4">Get started</p>
        <h2 className="font-display text-4xl sm:text-5xl text-ink-900 mb-5">Open your ledger today.</h2>
        <p className="text-slate-soft max-w-md mx-auto mb-9 leading-relaxed">
          Already have an account at a Meridian branch? Register for online
          banking in under two minutes with your CNIC and account number.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/customer/register" className="bg-brass text-ink-900 font-medium px-7 py-3.5 rounded-sm hover:bg-brass-dark transition shadow-sm">
            Register for Online Banking
          </Link>
          <Link to="/about" className="border border-paper-line text-ink-900 font-medium px-7 py-3.5 rounded-sm hover:border-ink-900 transition">
            Learn About Meridian
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}