"use client";

const COLORS = [
  { bg: "#6366f1", visor: "#818cf8", suit: "#4f46e5" }, // indigo
  { bg: "#ec4899", visor: "#f472b6", suit: "#db2777" }, // pink
  { bg: "#f59e0b", visor: "#fbbf24", suit: "#d97706" }, // amber
  { bg: "#10b981", visor: "#34d399", suit: "#059669" }, // emerald
  { bg: "#3b82f6", visor: "#60a5fa", suit: "#2563eb" }, // blue
  { bg: "#8b5cf6", visor: "#a78bfa", suit: "#7c3aed" }, // violet
  { bg: "#ef4444", visor: "#f87171", suit: "#dc2626" }, // red
  { bg: "#14b8a6", visor: "#2dd4bf", suit: "#0d9488" }, // teal
  { bg: "#f97316", visor: "#fb923c", suit: "#ea580c" }, // orange
  { bg: "#06b6d4", visor: "#22d3ee", suit: "#0891b2" }, // cyan
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

interface AstronautAvatarProps {
  seed: string; // username or userId
  size?: number;
  className?: string;
}

export function AstronautAvatar({ seed, size = 32, className }: AstronautAvatarProps) {
  const colorIdx = hashString(seed) % COLORS.length;
  const c = COLORS[colorIdx];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle */}
      <circle cx="32" cy="32" r="32" fill={c.bg} />

      {/* Body / suit */}
      <ellipse cx="32" cy="56" rx="16" ry="12" fill={c.suit} />

      {/* Helmet */}
      <circle cx="32" cy="26" r="16" fill="white" opacity="0.95" />

      {/* Visor */}
      <ellipse cx="32" cy="27" rx="11" ry="10" fill={c.visor} opacity="0.85" />

      {/* Visor shine */}
      <ellipse cx="27" cy="24" rx="4" ry="3" fill="white" opacity="0.3" />

      {/* Helmet outline */}
      <circle cx="32" cy="26" r="16" stroke={c.suit} strokeWidth="1.5" fill="none" />

      {/* Antenna */}
      <line x1="32" y1="10" x2="32" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="32" cy="4" r="2" fill={c.visor} />

      {/* Backpack hint */}
      <rect x="44" y="30" width="5" height="10" rx="2" fill={c.suit} opacity="0.7" />
    </svg>
  );
}
