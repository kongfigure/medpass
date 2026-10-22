import { useMemo } from "react";
import type { BuddyConfig, Mood } from "../buddy";

/**
 * The buddy is drawn procedurally: a squashed ellipse whose edge is a ring of soft
 * scallops, which reads as fluff. Art can be swapped later by replacing the body path
 * and accessory shapes; the props (color, accessories, mood) stay the same.
 */
function fluffPath(cx: number, cy: number, rx: number, ry: number, bumps: number, puff: number): string {
  const point = (angle: number, scale: number) => {
    // Flatten the bottom a little so the blob sits on the ground.
    const sy = Math.sin(angle) > 0 ? 0.92 : 1;
    return [cx + Math.cos(angle) * rx * scale, cy + Math.sin(angle) * ry * sy * scale] as const;
  };
  const step = (Math.PI * 2) / bumps;
  const [sx, sy] = point(0, 1);
  let d = `M${sx.toFixed(2)} ${sy.toFixed(2)}`;
  for (let i = 0; i < bumps; i++) {
    const [cxp, cyp] = point(step * (i + 0.5), puff);
    const [ex, ey] = point(step * (i + 1), 1);
    d += ` Q${cxp.toFixed(2)} ${cyp.toFixed(2)} ${ex.toFixed(2)} ${ey.toFixed(2)}`;
  }
  return `${d}Z`;
}

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp((n >> 16) + amount);
  const g = clamp(((n >> 8) & 255) + amount);
  const b = clamp((n & 255) + amount);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

interface Props {
  config: BuddyConfig;
  mood?: Mood;
  size?: number;
}

export function Blob({ config, mood = "happy", size = 160 }: Props) {
  const body = useMemo(() => fluffPath(100, 108, 70, 62, 16, 1.13), []);
  const { color } = config;
  const has = (id: string) => config.accessories.includes(id);
  const ink = "#231F3D";
  const shadow = shade(color, -28);

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label={`${config.name}, your buddy, looking ${mood}`}
      className={`blob blob-${mood}`}
    >
      <ellipse cx="100" cy="176" rx="48" ry="7" fill={ink} opacity="0.12" />
      <path d={body} fill={shadow} transform="translate(0 4)" />
      <path d={body} fill={color} />
      <ellipse cx="78" cy="72" rx="20" ry="10" fill="#FFFFFF" opacity="0.28" transform="rotate(-18 78 72)" />

      {has("scarf") && (
        <g>
          <path d="M52 128q48 22 96 0l3 14q-51 24-102 0z" fill="#E4577A" />
          <path d="M128 136l8 30q4 6 11 2l-5-33z" fill="#C93E63" />
        </g>
      )}

      {/* Eyes */}
      {mood === "sleepy" ? (
        <g stroke={ink} strokeWidth="3.5" strokeLinecap="round" fill="none">
          <path d="M70 108q8 6 16 0" />
          <path d="M114 108q8 6 16 0" />
        </g>
      ) : (
        <g fill={ink}>
          <ellipse cx="78" cy="108" rx="6" ry="8" />
          <ellipse cx="122" cy="108" rx="6" ry="8" />
          <circle cx="80" cy="105" r="2.2" fill="#FFFFFF" />
          <circle cx="124" cy="105" r="2.2" fill="#FFFFFF" />
        </g>
      )}
      {mood === "concerned" && (
        <g stroke={ink} strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M68 92l18 -4" />
          <path d="M132 92l-18 -4" />
        </g>
      )}

      {/* Cheeks and mouth */}
      <ellipse cx="62" cy="124" rx="8" ry="5" fill="#FF8FB0" opacity="0.55" />
      <ellipse cx="138" cy="124" rx="8" ry="5" fill="#FF8FB0" opacity="0.55" />
      {mood === "happy" && (
        <path d="M91 124q9 9 18 0" stroke={ink} strokeWidth="3.5" strokeLinecap="round" fill="none" />
      )}
      {mood === "concerned" && (
        <path d="M92 130q8 -6 16 0" stroke={ink} strokeWidth="3.5" strokeLinecap="round" fill="none" />
      )}
      {mood === "sleepy" && <ellipse cx="100" cy="128" rx="4" ry="3" fill={ink} />}

      {has("glasses") && (
        <g stroke={ink} strokeWidth="3" fill="#FFFFFF" fillOpacity="0.25">
          <circle cx="78" cy="108" r="15" />
          <circle cx="122" cy="108" r="15" />
          <path d="M93 107q7 -4 14 0" fill="none" />
        </g>
      )}

      {has("bow") && (
        <g>
          <path d="M142 56l22 -12v28z" fill="#FF6F9C" />
          <path d="M142 56l-22 -12v28z" fill="#FF6F9C" />
          <circle cx="142" cy="56" r="7" fill="#E04A7C" />
        </g>
      )}

      {has("beanie") && (
        <g>
          <path d="M54 66q4 -42 46 -42t46 42q-46 -14 -92 0z" fill="#4C6FD9" />
          <rect x="52" y="62" width="96" height="14" rx="7" fill="#3A58B8" />
          <circle cx="100" cy="22" r="9" fill="#FFFFFF" />
        </g>
      )}

      {has("sprout") && !has("beanie") && (
        <g>
          <path d="M100 52v-14" stroke="#3E9B62" strokeWidth="4" strokeLinecap="round" />
          <path d="M100 40q-20 -2 -22 -20q20 -2 22 20z" fill="#5CC585" />
          <path d="M100 40q20 -2 22 -20q-20 -2 -22 20z" fill="#47AE72" />
        </g>
      )}
    </svg>
  );
}
