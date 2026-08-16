import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import {
  IconLayers,
  IconArrows,
  IconReceipt,
  IconLock,
  IconAudit,
  IconUsers,
  IconChat,
  IconClock,
  IconShield,
} from '../../components/public/Icons';

const GROUPS = [
  {
    label: 'Personal Banking',
    eyebrow: '01',
    items: [
      {
        icon: IconLayers,
        title: 'Savings Accounts',
        desc: 'Everyday saving with a standing profit rate. Choose from Regular, Digital, Premium, or Freelancer Savings — same account type, different profit rates for different habits.',
      },
      {
        icon: IconLayers,
        title: 'Current Accounts',
        desc: 'No profit, no friction — built for frequent transactions and everyday business use, with an overdraft cushion built in.',
      },
      {
        icon: IconLayers,
        title: 'Term Deposits',
        desc: 'Lock a fixed sum for 3, 6, 12, or 24 months at a higher rate. Close early if you need to, with a transparent, fixed penalty.',
      },
    ],
  },
  {
    label: 'Moving Money',
    eyebrow: '02',
    items: [
      {
        icon: IconArrows,
        title: 'Instant Transfers',
        desc: "Move money between your own accounts or to anyone else's, with real-time balance updates and a full ledger trail.",
      },
      {
        icon: IconReceipt,
        title: 'Utility Bill Payments',
        desc: 'Pay electricity, gas, water, mobile, and internet bills directly from your account with just a consumer number.',
      },
      {
        icon: IconShield,
        title: 'Maker-Checker on Large Sums',
        desc: 'Any staff-initiated transaction above Rs 100,000 is held for review — the person who starts it can never be the one who approves it.',
      },
    ],
  },
  {
    label: 'Access & Security',
    eyebrow: '03',
    items: [
      {
        icon: IconLock,
        title: 'OTP-Verified Sign-In',
        desc: 'Every online banking session is confirmed with a one-time code emailed to your registered address — no exceptions.',
      },
      {
        icon: IconUsers,
        title: 'Self-Service Registration',
        desc: 'Already bank with us in person? Register for online access yourself using your CNIC and account number, no branch visit required.',
      },
      {
        icon: IconAudit,
        title: 'Automatic Lockout Protection',
        desc: "Five failed sign-in attempts locks the account automatically — for staff and customers alike — until a SuperAdmin or branch confirms it's really you.",
      },
    ],
  },
  {
    label: 'Behind the Counter',
    eyebrow: '04',
    items: [
      {
        icon: IconUsers,
        title: 'Branch-Scoped Staff Tools',
        desc: 'Tellers and managers see the customers and accounts that belong to their own branch. SuperAdmin and Auditor roles see the full network.',
      },
      {
        icon: IconAudit,
        title: 'A Permanent Audit Log',
        desc: 'Deposits, withdrawals, approvals, employee changes — every meaningful action is recorded with who did it, when, and what happened. Nothing in it can be edited or deleted.',
      },
      {
        icon: IconChat,
        title: 'An AI Assistant That Knows the Bank',
        desc: "A built-in help desk trained on Meridian's own policy guide, so staff and customers get accurate answers instead of guesswork.",
      },
    ],
  },
];

export default function Features() {
  return (
    <div className="bg-paper text-slate min-h-screen">
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

        <div className="relative max-w-5xl mx-auto px-6 py-14 sm:py-16 lg:py-20 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="h-px w-8 bg-brass" />

            <p className="font-mono text-[10px] sm:text-xs tracking-[0.28em] text-brass-dark uppercase">
              Everything Inside Meridian
            </p>

            <span className="h-px w-8 bg-brass" />
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-ink-900 leading-tight mb-5">
            Banking built around
            <span className="text-brass-dark"> you.</span>
          </h1>

          <p className="text-slate-soft text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Explore the accounts, payment tools, security controls, and
            services that make Meridian a complete modern banking platform.
          </p>
        </div>
      </section>

      {/* ================= FEATURE GROUPS ================= */}
      {GROUPS.map((group, groupIndex) => (
        <section
          key={group.label}
          className={`max-w-6xl mx-auto px-6 py-16 sm:py-20 ${
            groupIndex !== GROUPS.length - 1
              ? 'border-b border-paper-line'
              : ''
          }`}
        >
          {/* Section heading */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-9">
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-brass-dark tracking-wider">
                {group.eyebrow}
              </span>

              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-soft mb-1">
                  Meridian Services
                </p>

                <h2 className="font-display text-2xl sm:text-3xl text-ink-900">
                  {group.label}
                </h2>
              </div>
            </div>

            <span className="hidden sm:block h-px flex-1 bg-paper-line ml-6 mb-2" />
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {group.items.map((item, itemIndex) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="group bg-white border border-paper-line rounded-sm p-6 sm:p-7 hover:border-ink-900/20 hover:shadow-md transition-all duration-200"
                >
                  {/* Top */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-10 h-10 rounded-sm bg-paper border border-paper-line flex items-center justify-center">
                      <span className="text-brass-dark">
                        <Icon />
                      </span>
                    </div>

                    <span className="font-mono text-[10px] text-slate-soft">
                      {group.eyebrow}.{String(itemIndex + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <h3 className="font-display text-lg text-ink-900 mb-2 group-hover:text-brass-dark transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-soft leading-relaxed">
                    {item.desc}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      ))}

      {/* ================= SECURITY / CTA ================= */}
      <section className="bg-ink-900 text-paper">
        <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-12 h-12 mx-auto rounded-sm bg-white/5 border border-white/10 flex items-center justify-center mb-6">
              <IconClock
                className="text-brass"
                width={28}
                height={28}
              />
            </div>

            <p className="font-mono text-[10px] tracking-[0.28em] text-brass uppercase mb-3">
              Always available
            </p>

            <h2 className="font-display text-3xl sm:text-4xl mb-4">
              Banking when you need it.
            </h2>

            <p className="text-paper/60 leading-relaxed max-w-lg mx-auto mb-8">
              Online banking runs around the clock. Manage your accounts,
              review transactions, and stay connected with Meridian wherever
              you are.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link
                to="/customer/register"
                className="bg-brass text-ink-900 font-medium px-6 py-3 rounded-sm hover:bg-brass-dark transition shadow-sm"
              >
                Register for Online Banking
              </Link>

              <Link
                to="/customer/login"
                className="border border-white/20 text-paper font-medium px-6 py-3 rounded-sm hover:border-white/50 transition"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}