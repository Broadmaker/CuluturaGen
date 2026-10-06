// Inline SVG icon set for the app shell (sidebar, topbar, stat cards).
// Stroke icons, no dependencies — mirrors the NextAdmin-style icon sidebar
// while staying in the heritage theme (currentColor).
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24",
  "aria-hidden": true,
} as const;

function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg {...base} className="h-5 w-5 shrink-0">
      {children}
    </svg>
  );
}

export const NavIcons = {
  dashboard: (
    <Svg>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </Svg>
  ),
  projects: (
    <Svg>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    </Svg>
  ),
  culture: (
    <Svg>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4a1 1 0 0 0-1-1H6.5A2.5 2.5 0 0 0 4 5.5v14Z" />
      <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
      <path d="M9 7h7M9 11h5" />
    </Svg>
  ),
  studio: (
    <Svg>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
      <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
    </Svg>
  ),
  materials: (
    <Svg>
      <circle cx="9" cy="9" r="6" />
      <path d="M14.5 5.5a6 6 0 1 1-9 9" />
      <path d="M9 6.5v5l3.5 2" />
    </Svg>
  ),
  evaluations: (
    <Svg>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h3" />
      <path d="M14.5 15.5l1.5 1.5 3-3" />
    </Svg>
  ),
  reports: (
    <Svg>
      <path d="M6 2h9l5 5v15H6V2Z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h7M9 17h7" />
    </Svg>
  ),
  admin: (
    <Svg>
      <path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3Z" />
      <path d="M12 8v4M12 15.5v.5" />
    </Svg>
  ),
  search: (
    <Svg>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </Svg>
  ),
  bell: (
    <Svg>
      <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </Svg>
  ),
  plus: (
    <Svg>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  ),
  arrowRight: (
    <Svg>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  ),
} as const;

export type NavIconName = keyof typeof NavIcons;
