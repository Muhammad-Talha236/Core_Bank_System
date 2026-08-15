import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { IconLayers, IconArrows, IconReceipt, IconLock, IconAudit, IconUsers, IconChat, IconClock, IconShield } from '../../components/public/Icons';

const GROUPS = [
  {
    label: 'Personal Banking',
    eyebrow: '01',
    items: [
      { icon: IconLayers, title: 'Savings Accounts', desc: 'Everyday saving with a standing profit rate. Choose from Regular, Digital, Premium, or Freelancer Savings — same account type, different profit rates for different habits.' },
      { icon: IconLayers, title: 'Current Accounts', desc: 'No profit, no friction — built for frequent transactions and everyday business use, with an overdraft cushion built in.' },
      { icon: IconLayers, title: 'Term Deposits', desc: 'Lock a fixed sum for 3, 6, 12, or 24 months at a higher rate. Close early if you need to, with a transparent, fixed penalty.' },
    ],
  },
  {
    label: 'Moving Money',
    eyebrow: '02',
    items: [
      { icon: IconArrows, title: 'Instant Transfers', desc: 'Move money between your own accounts or to anyone else\'s, with real-time balance updates and a full ledger trail.' },
      { icon: IconReceipt, title: 'Utility Bill Payments', desc: 'Pay electricity, gas, water, mobile, and internet bills directly from your account with just a consumer number.' },
      { icon: IconShield, title: 'Maker-Checker on Large Sums', desc: 'Any staff-initiated transaction above Rs 100,000 is held for review — the person who starts it can never be the one who approves it.' },
    ],
  },
  {
    label: 'Access & Security',
    eyebrow: '03',
    items: [
      { icon: IconLock, title: 'OTP-Verified Sign-In', desc: 'Every online banking session is confirmed with a one-time code emailed to your registered address — no exceptions.' },
      { icon: IconUsers, title: 'Self-Service Registration', desc: 'Already bank with us in person? Register for online access yourself using your CNIC and account number, no branch visit required.' },
      { icon: IconAudit, title: 'Automatic Lockout Protection', desc: 'Five failed sign-in attempts locks the account automatically — for staff and customers alike — until a SuperAdmin or branch confirms it\'s really you.' },
    ],
  },
  {
    label: 'Behind the Counter',
    eyebrow: '04',
    items: [
      { icon: IconUsers, title: 'Branch-Scoped Staff Tools', desc: 'Tellers and managers see the customers and accounts that belong to their own branch. SuperAdmin and Auditor roles see the full network.' },
      { icon: IconAudit, title: 'A Permanent Audit Log', desc: 'Deposits, withdrawals, approvals, employee changes — every meaningful action is recorded with who did it, when, and what happened. Nothing in it can be edited or deleted.' },
      { icon: IconChat, title: 'An AI Assistant That Knows the Bank', desc: 'A built-in help desk trained on Meridian\'s own policy guide, so staff and customers get accurate answers instead of guesswork.' },
    ],
  },
];

export default function Features() {
  return (
    <div className="bg-paper text-slate">
      <PublicNavbar />

      <section className="border-b border-paper-line">
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
          <p className="font-mono text-xs tracking-[0.3em] text-brass-dark uppercase mb-4">Everything Inside Meridian</p>
          <h1 className="font-display text-5xl text-ink-900 mb-5">Features, itemized.</h1>
          <p className="text-slate-soft text-lg leading-relaxed max-w-2xl mx-auto">
            Like any good ledger, nothing here is hidden. This is the complete
            list of what Meridian does for account holders and the staff who
            run the branches.
          </p>
        </div>
      </section>

      {GROUPS.map((group, gi) => (
        <section key={group.label} className={`max-w-6xl mx-auto px-6 py-16 ${gi !== GROUPS.length - 1 ? 'border-b border-paper-line' : ''}`}>
          <div className="flex items-baseline gap-4 mb-10">
            <span className="font-mono text-sm text-brass-dark">{group.eyebrow}</span>
            <h2 className="font-display text-2xl sm:text-3xl text-ink-900">{group.label}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {group.items.map((item) => (
              <div key={item.title} className="border-t-2 border-ink-900 pt-5">
                <span className="text-brass-dark inline-block mb-4"><item.icon /></span>
                <h3 className="font-display text-lg text-ink-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-soft leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="bg-ink-900 text-paper">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <IconClock className="text-brass mx-auto mb-6" width={36} height={36} />
          <h2 className="font-display text-3xl sm:text-4xl mb-4">Available whenever you need it.</h2>
          <p className="text-paper/70 leading-relaxed max-w-md mx-auto mb-9">
            Online banking runs around the clock. Branch services follow
            standard hours, but your ledger never sleeps.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/customer/register" className="bg-brass text-ink-900 font-medium px-6 py-3 rounded-sm hover:bg-brass-dark transition">
              Register for Online Banking
            </Link>
            <Link to="/customer/login" className="border border-white/20 text-paper font-medium px-6 py-3 rounded-sm hover:border-white/50 transition">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}