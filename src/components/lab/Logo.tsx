export function HeisenbergLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      {/* porkpie hat: flat-top crown + curved brim */}
      <path d="M21 9 L43 9 Q46 9 46.5 12 L47.5 17 L16.5 17 L17.5 12 Q18 9 21 9 Z" />
      <path d="M9 21 Q9 16 16 15.5 L48 15.5 Q55 16 55 21 Q55 25.5 48.5 24.5 L41 23.5 L23 23.5 L15.5 24.5 Q9 25.5 9 21 Z" />
      {/* aviator sunglasses */}
      <path d="M13.5 33 Q13.5 30.5 16 30.5 L27.5 30.5 Q30 30.5 30 33 L30 38.5 Q30 41.5 27 41.5 L18.5 41.8 Q14.5 42 13.8 38 Z" />
      <path d="M50.5 33 Q50.5 30.5 48 30.5 L36.5 30.5 Q34 30.5 34 33 L34 38.5 Q34 41.5 37 41.5 L45.5 41.8 Q49.5 42 50.2 38 Z" />
      <path d="M30 34.5 L34 34.5 L34 36.5 L30 36.5 Z" />
      {/* mustache: full handlebar, no pinch at the center */}
      <path d="M15 45.5 C15 43 18 42.5 21 43 C25.5 43.5 29 45 32 45 C35 45 38.5 43.5 43 43 C46 42.5 49 43 49 45.5 C49 48.5 45.5 50.5 41 50 C36.5 49.5 34 47.5 32 47.5 C30 47.5 27.5 49.5 23 50 C18.5 50.5 15 48.5 15 45.5 Z" />
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