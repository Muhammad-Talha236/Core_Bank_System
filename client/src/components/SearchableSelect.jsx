import { useState, useRef, useEffect } from 'react';

// A searchable "combobox" - type to filter, click to select.
// options: [{ value, label, sublabel? }]
export default function SearchableSelect({ options, value, onChange, placeholder = 'Search...', disabled }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2 border border-paper-line rounded-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-brass disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {selected ? selected.label : <span className="text-slate-soft">{placeholder}</span>}
      </button>

      {open && !disabled && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-paper-line rounded-sm shadow-lg max-h-64 overflow-hidden flex flex-col">
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search..."
            className="px-3 py-2 border-b border-paper-line text-sm focus:outline-none"
          />
          <div className="overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-slate-soft">No matches</p>
            )}
            {filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setQuery('');
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-paper transition flex flex-col"
              >
                <span className="text-ink-900">{o.label}</span>
                {o.sublabel && <span className="text-xs text-slate-soft">{o.sublabel}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}