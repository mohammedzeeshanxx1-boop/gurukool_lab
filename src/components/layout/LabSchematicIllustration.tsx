export function LabSchematicIllustration() {
  return (
    <div className="relative flex h-full min-h-[300px] w-full items-center justify-center rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 sm:p-8">
      <svg
        viewBox="0 0 480 340"
        className="w-full h-auto max-w-[460px]"
        role="img"
        aria-label="Geometric schematic of an optical prism, simple pendulum, and laboratory coordinate grid"
      >
        {/* Subtle coordinate grid */}
        <defs>
          <pattern
            id="lab-grid"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke="#E5E4E2"
              strokeWidth="0.8"
            />
          </pattern>
        </defs>
        <rect
          x="16"
          y="16"
          width="448"
          height="308"
          rx="12"
          fill="#FAF8F5"
          stroke="#E5E4E2"
          strokeWidth="1.2"
        />
        <rect
          x="28"
          y="28"
          width="424"
          height="284"
          rx="8"
          fill="url(#lab-grid)"
        />

        {/* Soft Lavender Optical Zone */}
        <circle
          cx="175"
          cy="168"
          r="76"
          fill="#E6E0F0"
          fillOpacity="0.65"
          stroke="#CFC4E2"
          strokeWidth="1"
        />

        {/* Optical Prism Triangle */}
        <polygon
          points="175,112 126,204 224,204"
          fill="#FFFFFF"
          fillOpacity="0.9"
          stroke="#6F4E37"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Incident & Refracted Ray Geometry */}
        <line
          x1="58"
          y1="176"
          x2="148"
          y2="162"
          stroke="#6F4E37"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="148"
          y1="162"
          x2="202"
          y2="164"
          stroke="#42335C"
          strokeWidth="1.75"
          strokeDasharray="4 3"
        />
        <line
          x1="202"
          y1="164"
          x2="280"
          y2="196"
          stroke="#6F4E37"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="202"
          y1="164"
          x2="282"
          y2="178"
          stroke="#42335C"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Simple Pendulum Frame (Right Quadrant) */}
        <line
          x1="312"
          y1="66"
          x2="412"
          y2="66"
          stroke="#6F4E37"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M 326 218 A 140 140 0 0 0 398 218"
          fill="none"
          stroke="#C7C4BE"
          strokeWidth="1.25"
          strokeDasharray="4 4"
        />
        <line
          x1="362"
          y1="66"
          x2="390"
          y2="206"
          stroke="#5C5149"
          strokeWidth="1.6"
        />
        <line
          x1="362"
          y1="66"
          x2="362"
          y2="218"
          stroke="#D4D1CB"
          strokeWidth="1.2"
          strokeDasharray="3 3"
        />
        <circle
          cx="390"
          cy="206"
          r="14"
          fill="#6F4E37"
          stroke="#FAF8F5"
          strokeWidth="2"
        />

        {/* Vernier / Measurement Baseline */}
        <line
          x1="56"
          y1="274"
          x2="424"
          y2="274"
          stroke="#6F4E37"
          strokeWidth="1.5"
        />
        {[56, 102, 148, 194, 240, 286, 332, 378, 424].map((x) => (
          <line
            key={x}
            x1={x}
            y1="266"
            x2={x}
            y2="274"
            stroke="#6F4E37"
            strokeWidth="1.25"
          />
        ))}

        {/* Clean Axis Labels */}
        <text
          x="56"
          y="58"
          fill="#5C5149"
          fontSize="11"
          fontFamily="IBM Plex Mono, monospace"
        >
          Optics &amp; Mechanics Reference
        </text>
        <text
          x="56"
          y="296"
          fill="#786D65"
          fontSize="10"
          fontFamily="IBM Plex Mono, monospace"
        >
          0.0
        </text>
        <text
          x="404"
          y="296"
          fill="#786D65"
          fontSize="10"
          fontFamily="IBM Plex Mono, monospace"
        >
          8.0
        </text>
      </svg>
    </div>
  );
}
