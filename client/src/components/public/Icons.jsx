// Small hand-drawn line icons used across the public (pre-login) pages.
// Kept as inline SVG (stroke = currentColor) so they inherit color from
// their parent and need no extra dependency.

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function IconLayers(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...base} {...props}>
      <path d="M12 3 2.5 8 12 13l9.5-5L12 3Z" />
      <path d="m2.5 13 9.5 5 9.5-5" />
      <path d="m2.5 17.5 9.5 5 9.5-5" />
    </svg>
  );
}

export function IconArrows(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...base} {...props}>
      <path d="M3 8h13" />
      <path d="m12.5 3.5 3.5 4.5-3.5 4.5" />
      <path d="M21 16H8" />
      <path d="m11.5 11.5-3.5 4.5 3.5 4.5" />
    </svg>
  );
}

export function IconReceipt(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...base} {...props}>
      <path d="M6 2.5h12v19l-2.2-1.5-2.2 1.5-2.1-1.5-2.1 1.5-2.2-1.5-2.2 1.5v-19Z" />
      <path d="M8.5 7.5h7M8.5 11h7M8.5 14.5h4.5" />
    </svg>
  );
}

export function IconLock(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...base} {...props}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="1.5" />
      <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
      <path d="M12 14.5v3" />
    </svg>
  );
}

export function IconAudit(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...base} {...props}>
      <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14.5 3v4.5H19" />
      <path d="M8 12h8M8 15.5h8M8 8.5h3" />
    </svg>
  );
}

export function IconUsers(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...base} {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="8.5" r="2.3" />
      <path d="M15.5 20a4.5 4.5 0 0 1 5.4-4.4" />
    </svg>
  );
}

export function IconChat(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...base} {...props}>
      <path d="M4 5.5h16v11H9.5L5 20v-3.5H4v-11Z" />
      <path d="M8 10h8M8 13h5" />
    </svg>
  );
}

export function IconClock(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...base} {...props}>
      <circle cx="12" cy="12.5" r="8.5" />
      <path d="M12 7.5v5l3.5 2" />
      <path d="M9 2h6" />
    </svg>
  );
}

export function IconShield(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...base} {...props}>
      <path d="M12 2.5 4.5 5.5v6c0 5 3.2 8.4 7.5 10 4.3-1.6 7.5-5 7.5-10v-6L12 2.5Z" />
      <path d="m8.5 12 2.3 2.3L15.5 9.5" />
    </svg>
  );
}

export function IconSeal(props) {
  // Signature wax-seal / ink-stamp mark used in the hero and footer
  return (
    <svg viewBox="0 0 48 48" width="44" height="44" {...base} strokeWidth="1.2" {...props}>
      <circle cx="24" cy="24" r="19" />
      <circle cx="24" cy="24" r="14" />
      <path d="M16 25.5 21.5 31 33 18" />
    </svg>
  );
}