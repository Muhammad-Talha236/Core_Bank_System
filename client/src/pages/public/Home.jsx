import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import {
  IconLayers,
  IconArrows,
  IconLock,
  IconAudit,
  IconChat,
  IconUsers,
  IconShield,
} from '../../components/public/Icons';

const HERO_STAMPS = [
  'OTP-Verified Sign-In',
  'Maker-Checker Approval',
  'Full Audit Trail',
];

const STATS = [
  { value: 'Rs 4.8B+', label: 'Balances tracked' },
  { value: '128,000+', label: 'Ledger entries logged' },
  { value: '3', label: 'Account products' },
  { value: '24/7', label: 'Online access' },
];

const FEATURES = [
  {
    icon: IconLayers,
    title: 'Savings, Current & Term',
    desc: 'Open the right account for everyday spending, saving, or fixed-term deposits.',
  },
  {
    icon: IconArrows,
    title: 'Smart Transfer Controls',
    desc: 'Large transfers require a second employee approval before funds move.',
  },
  {
    icon: IconLock,
    title: 'OTP on Every Sign-In',
    desc: 'Every online banking session is verified with a secure one-time code.',
  },
  {
    icon: IconAudit,
    title: 'Complete Audit Trail',
    desc: 'Every deposit, withdrawal and approval is recorded and traceable.',
  },
  {
    icon: IconChat,
    title: 'Banking Help Desk',
    desc: 'Get quick answers about Meridian services and banking policies.',
  },
  {
    icon: IconUsers,
    title: 'Branch-Aware Banking',
    desc: 'Staff access is controlled according to their branch and role.',
  },
];

const SECURITY_ITEMS = [
  {
    t: 'Rate-limited logins',
    d: 'Accounts are protected against repeated failed login attempts.',
  },
  {
    t: 'Four-eyes approval',
    d: 'Large transactions require approval from another employee.',
  },
  {
    t: 'Two-factor by default',
    d: 'Online sessions are confirmed using a one-time verification code.',
  },
  {
    t: 'Immutable audit log',
    d: 'Important operations are recorded with timestamps for accountability.',
  },
];

export default function Home() {
  return (
    <div className="bg-paper text-slate">
      <PublicNavbar />

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden border-b border-paper-line">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(#0B1F3A 1px, transparent 1px), linear-gradient(90deg, #0B1F3A 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6 py-14 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center">
            
            {/* Left */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="h-px w-8 bg-brass" />
                <p className="font-mono text-[10px] sm:text-xs tracking-[0.25em] text-brass-dark uppercase">
                  Modern Core Banking
                </p>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] text-ink-900 leading-[1.05] mb-5 max-w-xl">
                Banking built on
                <span className="text-brass-dark"> trust.</span>
              </h1>

              <p className="text-slate-soft text-base sm:text-lg leading-relaxed max-w-lg mb-7">
                Manage your money with secure accounts, transparent
                transactions, and banking controls designed around
                accountability.
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-7">
                <Link
                  to="/customer/register"
                  className="inline-flex justify-center items-center bg-ink-900 text-paper font-medium px-6 py-3 rounded-sm hover:bg-ink-800 transition shadow-sm"
                >
                  Register for Online Banking
                </Link>

                <Link
                  to="/customer/login"
                  className="inline-flex justify-center items-center border border-ink-900/20 text-ink-900 font-medium px-6 py-3 rounded-sm hover:border-ink-900 hover:bg-white transition"
                >
                  Sign In
                </Link>
              </div>

              {/* Trust stamps */}
              <div className="flex flex-wrap gap-2">
                {HERO_STAMPS.map((stamp) => (
                  <span
                    key={stamp}
                    className="stamp text-ink-900 text-[10px] sm:text-xs"
                  >
                    {stamp}
                  </span>
                ))}
              </div>
            </div>

            {/* Right - Banking Card */}
            <div className="relative max-w-md w-full mx-auto lg:ml-auto">
              {/* Decorative card */}
              <div className="absolute -top-4 -right-4 w-full h-full bg-brass/10 border border-brass/10 rounded-sm" />

              <div className="relative bg-white border border-paper-line rounded-sm shadow-lg overflow-hidden">
                {/* Card header */}
                <div className="px-5 sm:px-6 py-4 border-b border-paper-line flex items-center justify-between">
                  <div>
                    <p className="font-mono text-[9px] tracking-[0.2em] text-slate-soft uppercase">
                      Meridian Bank
                    </p>
                    <p className="font-display text-lg text-ink-900 mt-1">
                      Primary Savings
                    </p>
                  </div>

                  <span className="stamp text-ledger-green text-[9px]">
                    Active
                  </span>
                </div>

                {/* Balance */}
                <div className="px-5 sm:px-6 py-5">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-slate-soft">
                    Available Balance
                  </p>

                  <p className="font-display text-3xl sm:text-4xl text-ink-900 mt-1 mb-5">
                    Rs 842,150
                  </p>

                  {/* Mini stats */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-paper border border-paper-line p-3 rounded-sm">
                      <p className="font-mono text-[9px] uppercase tracking-wide text-slate-soft">
                        Account
                      </p>
                      <p className="font-mono text-xs text-ink-900 mt-1">
                        #84213097
                      </p>
                    </div>

                    <div className="bg-paper border border-paper-line p-3 rounded-sm">
                      <p className="font-mono text-[9px] uppercase tracking-wide text-slate-soft">
                        Status
                      </p>
                      <p className="text-xs text-ledger-green font-medium mt-1">
                        Verified
                      </p>
                    </div>
                  </div>

                  {/* Transactions */}
                  <div className="space-y-0">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-slate-soft mb-3">
                      Recent Activity
                    </p>

                    {[
                      {
                        label: 'Salary Credit',
                        type: 'CREDIT',
                        amount: '+ Rs 150,000',
                      },
                      {
                        label: 'Utility Payment',
                        type: 'DEBIT',
                        amount: '- Rs 8,420',
                      },
                      {
                        label: 'Online Transfer',
                        type: 'DEBIT',
                        amount: '- Rs 25,000',
                      },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between py-3 border-b border-paper-line/70 last:border-0"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-slate truncate">
                            {row.label}
                          </p>
                          <span
                            className={`font-mono text-[8px] ${
                              row.type === 'CREDIT'
                                ? 'text-ledger-green'
                                : 'text-ledger-red'
                            }`}
                          >
                            {row.type}
                          </span>
                        </div>

                        <span className="font-mono text-xs text-slate-soft ml-4 whitespace-nowrap">
                          {row.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom security strip */}
                <div className="px-5 sm:px-6 py-3 bg-ink-900 flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-paper/60">
                    Secure Online Banking
                  </span>

                  <span className="text-[10px] text-brass">
                    ● Protected
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="bg-white border-b border-paper-line">
        <div className="max-w-6xl mx-auto px-6 py-7 sm:py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-paper-line">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="px-4 sm:px-6 first:pl-0 last:pr-0"
              >
                <p className="font-display text-2xl sm:text-3xl text-ink-900">
                  {stat.value}
                </p>

                <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wide text-slate-soft mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="max-w-6xl mx-auto px-6 py-20 sm:py-24">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-10">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="h-px w-7 bg-brass" />

              <p className="font-mono text-[10px] tracking-[0.25em] text-brass-dark uppercase">
                Banking that works for you
              </p>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl text-ink-900 mb-3">
              Everything you need.
              <br />
              <span className="text-brass-dark">Nothing unnecessary.</span>
            </h2>

            <p className="text-slate-soft leading-relaxed">
              Simple banking tools backed by strong controls and complete
              transparency.
            </p>
          </div>

          <Link
            to="/features"
            className="text-sm font-medium text-brass-dark hover:text-ink-900 transition whitespace-nowrap"
          >
            Explore all features →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-paper-line border border-paper-line rounded-sm overflow-hidden">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="bg-white p-6 sm:p-7 hover:bg-paper transition"
              >
                <div className="flex items-center justify-between mb-5">
                  <span className="text-brass-dark">
                    <Icon />
                  </span>

                  <span className="font-mono text-[10px] text-slate-soft">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                <h3 className="font-display text-lg text-ink-900 mb-2">
                  {feature.title}
                </h3>

                <p className="text-sm text-slate-soft leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= SECURITY ================= */}
      <section className="bg-ink-900 text-paper">
        <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-16 items-center">
            <div>
              <IconShield
                className="text-brass mb-5"
                width={38}
                height={38}
              />

              <p className="font-mono text-[10px] tracking-[0.25em] text-brass uppercase mb-3">
                Security first
              </p>

              <h2 className="font-display text-3xl sm:text-4xl mb-4">
                Your money deserves
                <br />
                better protection.
              </h2>

              <p className="text-paper/60 leading-relaxed max-w-md">
                Meridian is designed around the same principle as a trusted
                financial ledger: every important action is verified,
                recorded, and accountable.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SECURITY_ITEMS.map((item, index) => (
                <div
                  key={item.t}
                  className="border border-white/10 bg-white/[0.04] rounded-sm p-5 hover:bg-white/[0.07] transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[9px] text-brass">
                      0{index + 1}
                    </span>

                    <span className="h-1.5 w-1.5 rounded-full bg-brass" />
                  </div>

                  <p className="font-medium text-paper mb-1.5">
                    {item.t}
                  </p>

                  <p className="text-sm text-paper/50 leading-relaxed">
                    {item.d}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 py-20 sm:py-24 text-center">
          <p className="font-mono text-[10px] tracking-[0.3em] text-brass-dark uppercase mb-4">
            Get started
          </p>

          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-ink-900 mb-4">
            Banking made simple.
          </h2>

          <p className="text-slate-soft max-w-lg mx-auto mb-8 leading-relaxed">
            Register for Meridian online banking and manage your accounts
            securely from wherever you are.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              to="/customer/register"
              className="bg-brass text-ink-900 font-medium px-7 py-3.5 rounded-sm hover:bg-brass-dark transition shadow-sm"
            >
              Register for Online Banking
            </Link>

            <Link
              to="/about"
              className="border border-paper-line text-ink-900 font-medium px-7 py-3.5 rounded-sm hover:border-ink-900 transition"
            >
              Learn About Meridian
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}