import { Link } from 'react-router-dom';
import { IconSeal } from './Icons';

export default function PublicFooter() {
  return (
    <footer className="bg-ink-900 text-paper/80 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 47px, #C9A227 47px, #C9A227 48px)',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 pb-12 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-paper mb-3">
              <IconSeal className="text-brass shrink-0" width={30} height={30} />
              <span className="font-display text-xl">Meridian Bank</span>
            </div>
            <p className="text-sm text-paper/60 leading-relaxed max-w-xs">
              Every entry recorded. Every balance accounted for. A core banking
              platform built on double-entry discipline.
            </p>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-brass mb-4">Banking</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/features" className="hover:text-paper transition">Savings Accounts</Link></li>
              <li><Link to="/features" className="hover:text-paper transition">Current Accounts</Link></li>
              <li><Link to="/features" className="hover:text-paper transition">Term Deposits</Link></li>
              <li><Link to="/features" className="hover:text-paper transition">Bill Payments</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-brass mb-4">Company</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/about" className="hover:text-paper transition">About Meridian</Link></li>
              <li><Link to="/features" className="hover:text-paper transition">Security &amp; Trust</Link></li>
              <li><Link to="/" className="hover:text-paper transition">Home</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-brass mb-4">Access</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/customer/login" className="hover:text-paper transition">Customer Sign In</Link></li>
              <li><Link to="/customer/register" className="hover:text-paper transition">Register Online</Link></li>
              <li><Link to="/login" className="hover:text-paper transition">Employee Portal</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-paper/50">
          <p>&copy; {new Date().getFullYear()} Meridian Bank. All rights reserved.</p>
          <p className="font-mono uppercase tracking-widest text-[10px]">Core Banking System</p>
        </div>
      </div>
    </footer>
  );
}