export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="DBS Esculpidas logo"
      role="img"
    >
      <circle cx="40" cy="40" r="38" fill="oklch(68% 0.14 345)" />
      <text
        x="40"
        y="46"
        textAnchor="middle"
        fontFamily="Playfair Display, Georgia, serif"
        fontWeight="600"
        fontSize="22"
        fill="white"
        letterSpacing="1"
      >
        DB
      </text>
      {/* Leaf branch decoration */}
      <path
        d="M22 28 Q26 22 32 24 Q28 28 24 32 Q20 34 22 28Z"
        fill="white"
        opacity="0.7"
      />
      <path
        d="M24 32 Q22 38 26 38"
        stroke="white"
        strokeWidth="0.8"
        opacity="0.6"
        fill="none"
      />
      <text
        x="40"
        y="62"
        textAnchor="middle"
        fontFamily="DM Sans, system-ui, sans-serif"
        fontWeight="400"
        fontSize="7"
        fill="white"
        letterSpacing="3"
        opacity="0.9"
      >
        STUDIO
      </text>
    </svg>
  );
}
