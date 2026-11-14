// Decorative vector artwork and line icons. Everything here is presentational:
// inline SVG, hidden from screen readers, no behaviour.
import type { CSSProperties, ReactNode } from "react";

const TEAL = "#009C96";
const GOLD = "#F6BE30";
const CORAL = "#EE634C";

interface ArtProps {
  className?: string;
  style?: CSSProperties;
}

/** The deck cover's corner motif: quarter circles meeting in a corner. */
export function CornerBlocks({ className, style, tone = "full" }: ArtProps & { tone?: "full" | "soft" }) {
  const o = tone === "soft" ? 0.55 : 1;
  return (
    <svg viewBox="0 0 200 200" className={className} style={style} aria-hidden="true" focusable="false">
      <path d="M200 0H80a120 120 0 0 0 120 120Z" fill={CORAL} opacity={o} />
      <path d="M80 0H20a60 60 0 0 0 60 60Z" fill={GOLD} opacity={o} />
      <path d="M200 120v60a60 60 0 0 1-60-60Z" fill={TEAL} opacity={o} />
      <circle cx="52" cy="108" r="9" fill={TEAL} opacity={o} />
      <circle cx="104" cy="160" r="5" fill={GOLD} opacity={o} />
    </svg>
  );
}

/** A quiet grid of dots used as background texture. */
export function DotGrid({ className, style, color = "currentColor" }: ArtProps & { color?: string }) {
  const dots: ReactNode[] = [];
  for (let y = 0; y < 6; y++)
    for (let x = 0; x < 6; x++) dots.push(<circle key={`${x}-${y}`} cx={8 + x * 20} cy={8 + y * 20} r="2.6" />);
  return (
    <svg viewBox="0 0 116 116" className={className} style={style} fill={color} aria-hidden="true" focusable="false">
      {dots}
    </svg>
  );
}

/** Two overlapping circles: the two sides, and the blind spot between them. */
export function TwoSides({ className, style }: ArtProps) {
  return (
    <svg viewBox="0 0 56 36" className={className} style={style} aria-hidden="true" focusable="false">
      <circle cx="18" cy="18" r="16" fill={TEAL} />
      <circle cx="38" cy="18" r="16" fill={CORAL} />
      <path d="M28 5.5a16 16 0 0 1 0 25 16 16 0 0 1 0-25Z" fill={GOLD} />
    </svg>
  );
}

/** Success mark: a ring that draws itself, then a tick. */
export function CheckRing({ className, style }: ArtProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} style={style} aria-hidden="true" focusable="false">
      <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(250,246,235,0.14)" strokeWidth="6" />
      <circle
        className="draw"
        cx="60"
        cy="60"
        r="52"
        fill="none"
        stroke={TEAL}
        strokeWidth="6"
        strokeLinecap="round"
        pathLength="1"
        transform="rotate(-90 60 60)"
      />
      <path
        className="draw draw-late"
        d="M38 62l15 15 30-33"
        fill="none"
        stroke={GOLD}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength="1"
      />
      <circle cx="14" cy="22" r="4" fill={CORAL} />
      <circle cx="108" cy="30" r="3" fill={GOLD} />
      <circle cx="104" cy="100" r="4.5" fill={TEAL} />
      <circle cx="18" cy="96" r="3" fill={GOLD} />
    </svg>
  );
}

function Icon({ children, className, style }: ArtProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      className={className}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const IconUser = (p: ArtProps) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Icon>
);
export const IconPhone = (p: ArtProps) => (
  <Icon {...p}>
    <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
    <path d="M11 18h2" />
  </Icon>
);
export const IconPeople = (p: ArtProps) => (
  <Icon {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
  </Icon>
);
export const IconBriefcase = (p: ArtProps) => (
  <Icon {...p}>
    <rect x="3" y="7" width="18" height="13" rx="2.5" />
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
  </Icon>
);
export const IconCheck = (p: ArtProps) => (
  <Icon {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icon>
);
export const IconArrowLeft = (p: ArtProps) => (
  <Icon {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Icon>
);
export const IconArrowRight = (p: ArtProps) => (
  <Icon {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);
export const IconChart = (p: ArtProps) => (
  <Icon {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Icon>
);
export const IconEyeOff = (p: ArtProps) => (
  <Icon {...p}>
    <path d="M3 3l18 18M10.6 6.2A9.7 9.7 0 0 1 12 6c5 0 8.5 4 9.5 6a12 12 0 0 1-2.6 3.3M6.3 7.7A12.300 12.300 0 0 0 2.500 12c1 2 4.500 6 9.500 6 1.300 0 2.500-.300 3.600-.700" />
    <path d="M9.900 9.900a3 3 0 0 0 4.200 4.200" />
  </Icon>
);
export const IconDownload = (p: ArtProps) => (
  <Icon {...p}>
    <path d="M12 4v11M7 11l5 5 5-5M4 20h16" />
  </Icon>
);
export const IconTrash = (p: ArtProps) => (
  <Icon {...p}>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5" />
  </Icon>
);
export const IconFlag = (p: ArtProps) => (
  <Icon {...p}>
    <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
  </Icon>
);
