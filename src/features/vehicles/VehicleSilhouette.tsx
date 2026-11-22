/** Silhouette générique de véhicule (vue de profil), sans marque ni modèle réel. */
export function VehicleSilhouette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 120" className={className} role="img" aria-hidden>
      <defs>
        <linearGradient id="vs-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#56645d" />
          <stop offset="1" stopColor="#2a322e" />
        </linearGradient>
        <linearGradient id="vs-glass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#151816" />
          <stop offset="1" stopColor="#1f2622" />
        </linearGradient>
        <radialGradient id="vs-shadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="160" cy="104" rx="140" ry="9" fill="url(#vs-shadow)" />
      {/* Carrosserie */}
      <path
        d="M22 84c-4 0-6-3-6-7v-9c0-6 3-10 9-12l34-10c10-3 18-8 27-14l20-13c8-5 17-8 27-8h62c13 0 24 4 34 11l26 18c4 3 9 5 14 6l20 4c8 2 13 8 13 16v11c0 4-3 7-7 7H22Z"
        fill="url(#vs-body)"
        stroke="#48E5AD"
        strokeOpacity="0.18"
      />
      {/* Vitrages */}
      <path d="M98 41l16-11c7-4 14-6 22-6h22l-3 25H98c-3 0-3-5 0-8Z" fill="url(#vs-glass)" />
      <path d="M165 24h21c9 0 17 3 24 8l17 13c2 2 1 4-2 4h-63l3-25Z" fill="url(#vs-glass)" />
      {/* Ligne de caisse et poignées */}
      <path d="M40 62h250" stroke="#48E5AD" strokeOpacity="0.35" strokeWidth="1.2" />
      <rect x="138" y="55" width="14" height="2.5" rx="1.2" fill="#9AA59F" fillOpacity="0.5" />
      <rect x="205" y="55" width="14" height="2.5" rx="1.2" fill="#9AA59F" fillOpacity="0.5" />
      {/* Feux */}
      <path d="M286 58h12c2 0 3 2 2 4l-2 3h-12Z" fill="#48E5AD" fillOpacity="0.85" />
      <path d="M18 60h10v6H17c-1 0-2-1-1-2l2-4Z" fill="#c74b4b" fillOpacity="0.8" />
      {/* Roues */}
      {[78, 244].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="84" r="22" fill="#101211" />
          <circle cx={cx} cy="84" r="15" fill="#1b211e" stroke="#303934" strokeWidth="2" />
          <circle cx={cx} cy="84" r="5" fill="#48E5AD" fillOpacity="0.8" />
        </g>
      ))}
    </svg>
  );
}
