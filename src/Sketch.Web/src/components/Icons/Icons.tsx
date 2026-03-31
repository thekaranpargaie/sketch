/** Shared SVG icon set — no external dependency required. */

interface IconProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

export function EntityIcon({ size = 14, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <rect x="1.5" y="2.5" width="11" height="9" rx="1.5" />
      <line x1="1.5" y1="5.5" x2="12.5" y2="5.5" />
      <line x1="5" y1="5.5" x2="5" y2="11.5" />
    </svg>
  );
}

export function ProtocolIcon({ size = 14, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" style={style}>
      <circle cx="2.5" cy="7" r="1.5" />
      <circle cx="11.5" cy="3" r="1.5" />
      <circle cx="11.5" cy="11" r="1.5" />
      <line x1="4" y1="7" x2="10" y2="3.7" />
      <line x1="4" y1="7" x2="10" y2="10.3" />
    </svg>
  );
}

export function StorageIcon({ size = 14, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" style={style}>
      <ellipse cx="7" cy="3.5" rx="4.5" ry="1.5" />
      <path d="M2.5 3.5v7c0 .83 2.015 1.5 4.5 1.5s4.5-.67 4.5-1.5v-7" />
      <ellipse cx="7" cy="7.5" rx="4.5" ry="1.5" />
    </svg>
  );
}

export function IdentityIcon({ size = 14, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M7 1.5L12 4v3.5c0 2.8-2.3 4.7-5 5.5-2.7-.8-5-2.7-5-5.5V4z" />
      <circle cx="7" cy="6" r="1.5" fill={color} stroke="none" />
      <path d="M4.5 10c.4-1 1.3-1.5 2.5-1.5s2.1.5 2.5 1.5" />
    </svg>
  );
}

export function PencilIcon({ size = 16, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M11.5 1.5l3 3-9 9-4 1 1-4z" />
      <line x1="9" y1="3.5" x2="12.5" y2="7" />
    </svg>
  );
}

export function BoxPlusIcon({ size = 14, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <rect x="1.5" y="1.5" width="8" height="8" rx="1" />
      <line x1="11" y1="9" x2="11" y2="13" />
      <line x1="9" y1="11" x2="13" y2="11" />
    </svg>
  );
}

export function UploadIcon({ size = 14, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M2.5 9.5v1.5a1 1 0 001 1h7a1 1 0 001-1V9.5" />
      <polyline points="4.5,4.5 7,2 9.5,4.5" />
      <line x1="7" y1="2" x2="7" y2="9" />
    </svg>
  );
}

export function DownloadIcon({ size = 14, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M2.5 9.5v1.5a1 1 0 001 1h7a1 1 0 001-1V9.5" />
      <polyline points="4.5,6 7,9 9.5,6" />
      <line x1="7" y1="9" x2="7" y2="2" />
    </svg>
  );
}

export function TrashIcon({ size = 14, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="2,3.5 12,3.5" />
      <path d="M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1" />
      <path d="M3.5 3.5l.7 8a.5.5 0 00.5.5h4.6a.5.5 0 00.5-.5l.7-8" />
    </svg>
  );
}

export function ZapIcon({ size = 14, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="8,1.5 3,7.5 7.5,7.5 6,12.5 11,6.5 6.5,6.5 8,1.5" />
    </svg>
  );
}

export function InfoIcon({ size = 14, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" style={style}>
      <circle cx="7" cy="7" r="5.5" />
      <line x1="7" y1="6" x2="7" y2="10" />
      <circle cx="7" cy="4" r="0.5" fill={color} stroke="none" />
    </svg>
  );
}
