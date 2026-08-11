import { useEffect } from 'react';

export default function Modal({ open, onClose, title, subtitle, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === 'Escape') onClose?.();
    }
    if (open) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-ink-900/55 backdrop-blur-[1px] flex items-center justify-center p-4 z-30"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className={`bg-white rounded-sm w-full ${maxWidth} shadow-2xl border border-paper-line`}>
        <div className="flex items-start justify-between px-6 py-5 border-b border-paper-line">
          <div>
            <h3 className="font-display text-xl text-ink-900">{title}</h3>
            {subtitle && <p className="text-sm text-slate-soft mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-slate-soft hover:text-ink-900 transition text-lg leading-none mt-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
