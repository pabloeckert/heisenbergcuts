export function HeisenbergLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* hat */}
      <path d="M8 30 L12 18 L52 18 L56 30 Z" fill="#111" stroke="currentColor" strokeWidth="2" />
      <rect x="6" y="28" width="52" height="6" fill="#111" stroke="currentColor" strokeWidth="2" />
      {/* head */}
      <ellipse cx="32" cy="44" rx="14" ry="10" fill="#1a1a1a" stroke="currentColor" strokeWidth="2" />
      {/* glasses */}
      <rect x="20" y="40" width="10" height="6" rx="1" fill="#000" stroke="currentColor" strokeWidth="1.5" />
      <rect x="34" y="40" width="10" height="6" rx="1" fill="#000" stroke="currentColor" strokeWidth="1.5" />
      <line x1="30" y1="43" x2="34" y2="43" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function FlaskIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 3h6M10 3v6L5 19a2 2 0 0 0 1.7 3h10.6A2 2 0 0 0 19 19l-5-10V3" />
      <circle cx="11" cy="16" r="0.9" fill="currentColor" />
      <circle cx="14" cy="18" r="0.6" fill="currentColor" />
    </svg>
  );
}