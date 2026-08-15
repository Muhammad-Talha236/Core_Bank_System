import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { IconAudit, IconShield, IconUsers, IconLayers, IconSeal } from '../../components/public/Icons';

const VALUES = [
  { icon: IconAudit, title: 'Precision', desc: 'A ledger that is off by even one rupee is a ledger that cannot be trusted. We treat accuracy as the baseline, not the goal.' },
  { icon: IconShield, title: 'Stewardship', desc: 'Every account is money someone worked for. We design as if it were our own — because to the customer, it is exactly that important.' },
  { icon: IconUsers, title: 'Access', desc: 'Banking should not require a branch visit for every small thing. What can be done safely online, should be.' },
  { icon: IconLayers, title: 'Restraint', desc: 'The right feature is the one that earns its place in the ledger. We would rather do fewer things and get them right.' },
];

const TIMELINE = [
  { year: '2021', title: 'Meridian is founded', desc: 'Opened as a single-branch operation built around one idea: modern banking software, run with old-fashioned bookkeeping discipline.' },
  { year: '2022', title: 'Core banking platform goes live', desc: 'Savings, Current, and Term Deposit products launch on a unified ledger — every entry double-checked, every large transfer reviewed twice.' },
  { year: '2023', title: 'Branch network expands', desc: 'New branches come online with branch-scoped staff access, so growth never comes at the cost of oversight.' },
  { year: '2024', title: 'Online banking opens to customers', desc: 'Self-service registration, OTP-secured sign-in, transfers, and bill payments — the ledger, now in your pocket.' },
];

export default function About() {
  return (
    <div className="bg-paper text-slate">
      <PublicNavbar />

      {/* ---------- Intro ---------- */}
      <section className="border-b border-paper-line relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 47px, #0B1F3A 47px, #0B1F3A 48px)',
          }}
        />
        <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-16">
          <p className="font-mono text-xs tracking-[0.3em] text-brass-dark uppercase mb-4">About Meridian</p>
          <h1 className="font-display text-5xl text-ink-900 mb-6 leading-tight">
            Banking should be as easy to trust as it is to use.
          </h1>
          <p className="text-slate-soft text-lg leading-relaxed max-w-2xl">
            Meridian Bank was built on the belief that the oldest trick in
            banking — the double-entry ledger — is still the best one. Every
            rupee that moves through Meridian is written down twice, checked
            by a second set of eyes when it matters, and never quietly
            edited afterward.
          </p>
        </div>
      </section>

      {/* ---------- Values ---------- */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-b border-paper-line">
        <h2 className="font-display text-3xl text-ink-900 mb-10">What we hold ourselves to.</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {VALUES.map((v) => (
            <div key={v.title} className="flex gap-5">
              <span className="text-brass-dark shrink-0 mt-1"><v.icon /></span>
              <div>
                <h3 className="font-display text-lg text-ink-900 mb-1.5">{v.title}</h3>
                <p className="text-sm text-slate-soft leading-relaxed">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Timeline ---------- */}
      <section className="max-w-4xl mx-auto px-6 py-20 border-b border-paper-line">
        <h2 className="font-display text-3xl text-ink-900 mb-12">How we got here.</h2>
        <div className="relative pl-8 border-l-2 border-paper-line space-y-12">
          {TIMELINE.map((t) => (
            <div key={t.year} className="relative">
              <span className="absolute -left-[41px] top-0.5 w-4 h-4 rounded-full bg-brass border-4 border-paper" />
              <p className="font-mono text-xs text-brass-dark uppercase tracking-widest mb-1.5">{t.year}</p>
              <h3 className="font-display text-xl text-ink-900 mb-2">{t.title}</h3>
              <p className="text-sm text-slate-soft leading-relaxed max-w-xl">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Closing statement ---------- */}
      <section className="bg-ink-900 text-paper">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <IconSeal className="text-brass mx-auto mb-6" />
          <p className="font-display text-2xl sm:text-3xl leading-snug mb-3">
            "Every entry recorded. Every balance accounted for."
          </p>
          <p className="text-paper/60 font-mono text-xs uppercase tracking-widest mb-10">
            Double-entry ledger, since day one.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/customer/register" className="bg-brass text-ink-900 font-medium px-6 py-3 rounded-sm hover:bg-brass-dark transition">
              Register for Online Banking
            </Link>
            <Link to="/features" className="border border-white/20 text-paper font-medium px-6 py-3 rounded-sm hover:border-white/50 transition">
              Explore Features
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}