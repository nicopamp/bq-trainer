"use client";

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 20, color = "currentColor", strokeWidth = 1.6 }: IconProps) {
  const s = {
    width: size, height: size,
    fill: "none", stroke: color,
    strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "play":
      return <svg viewBox="0 0 24 24" {...s}><path d="M7 5l12 7-12 7V5z" fill={color} stroke="none" /></svg>;
    case "pause":
      return <svg viewBox="0 0 24 24" {...s}><rect x="7" y="5" width="3.5" height="14" rx="0.6" fill={color} stroke="none" /><rect x="13.5" y="5" width="3.5" height="14" rx="0.6" fill={color} stroke="none" /></svg>;
    case "mic":
      return <svg viewBox="0 0 24 24" {...s}><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11v1a7 7 0 0 0 14 0v-1M12 19v3M9 22h6" /></svg>;
    case "mic-fill":
      return <svg viewBox="0 0 24 24" {...s}><rect x="9" y="3" width="6" height="12" rx="3" fill={color} /><path d="M5 11v1a7 7 0 0 0 14 0v-1M12 19v3M9 22h6" /></svg>;
    case "rewind":
      return <svg viewBox="0 0 24 24" {...s}><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" /></svg>;
    case "chevron-right":
      return <svg viewBox="0 0 24 24" {...s}><path d="M9 6l6 6-6 6" /></svg>;
    case "chevron-left":
      return <svg viewBox="0 0 24 24" {...s}><path d="M15 6l-6 6 6 6" /></svg>;
    case "chevron-down":
      return <svg viewBox="0 0 24 24" {...s}><path d="M6 9l6 6 6-6" /></svg>;
    case "close":
      return <svg viewBox="0 0 24 24" {...s}><path d="M6 6l12 12M18 6l-6 6-6 6" /></svg>;
    case "flame":
      return <svg viewBox="0 0 24 24" {...s}><path d="M12 2.5c2 3.5 5 5.5 5 9.5a5 5 0 1 1-10 0c0-2 1-3.5 2-5 0 2 1 3 2 3.5 0-3 .5-5 1-8z" fill={color} fillOpacity="0.18" /></svg>;
    case "spark":
      return <svg viewBox="0 0 24 24" {...s}><path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.5 5.5l4 4M14.5 14.5l4 4M18.5 5.5l-4 4M9.5 14.5l-4 4" /></svg>;
    case "book":
      return <svg viewBox="0 0 24 24" {...s}><path d="M4 5a2 2 0 0 1 2-2h13v17H6a2 2 0 0 0-2 2V5z" /><path d="M19 17H6a2 2 0 0 0-2 2" /></svg>;
    case "eye":
      return <svg viewBox="0 0 24 24" {...s}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>;
    case "eye-off":
      return <svg viewBox="0 0 24 24" {...s}><path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.5 5.5A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a17.3 17.3 0 0 1-3.5 4.4M6.2 6.2A17.5 17.5 0 0 0 2 12s3.5 7 10 7c1.3 0 2.4-.2 3.5-.5" /></svg>;
    case "shuffle":
      return <svg viewBox="0 0 24 24" {...s}><path d="M3 6h3l12 12h3M3 18h3l3-3M14 9l3-3h3M17 3l3 3-3 3M17 21l3-3-3-3" /></svg>;
    case "list":
      return <svg viewBox="0 0 24 24" {...s}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>;
    case "check":
      return <svg viewBox="0 0 24 24" {...s}><path d="M4 12l5 5 11-12" /></svg>;
    case "volume":
      return <svg viewBox="0 0 24 24" {...s}><path d="M3 10v4h4l5 4V6L7 10H3zM15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12" /></svg>;
    case "tune":
      return <svg viewBox="0 0 24 24" {...s}><path d="M4 6h12M20 6h.01M4 12h4M12 12h8.01M4 18h12M20 18h.01" /><circle cx="18" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></svg>;
    case "sparkles":
      return <svg viewBox="0 0 24 24" {...s}><path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3zM19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14zM5 14l.6 1.4L7 16l-1.4.6L5 18l-.6-1.4L3 16l1.4-.6L5 14z" fill={color} fillOpacity="0.2" /></svg>;
    case "waveform":
      return <svg viewBox="0 0 24 24" {...s}><path d="M2 12h2M6 8v8M10 4v16M14 7v10M18 10v4M22 12h.01" /></svg>;
    case "star":
      return <svg viewBox="0 0 24 24" {...s}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>;
    case "arrow-right":
      return <svg viewBox="0 0 24 24" {...s}><path d="M5 12h14M12 5l7 7-7 7" /></svg>;
    case "log-out":
      return <svg viewBox="0 0 24 24" {...s}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>;
    case "calendar":
      return <svg viewBox="0 0 24 24" {...s}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>;
    case "plus":
      return <svg viewBox="0 0 24 24" {...s}><path d="M12 5v14M5 12h14" /></svg>;
    case "trash":
      return <svg viewBox="0 0 24 24" {...s}><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
    case "trophy":
      return <svg viewBox="0 0 24 24" {...s}><path d="M6 9H4a2 2 0 0 1-2-2V5h4M18 9h2a2 2 0 0 0 2-2V5h-4M8 21h8M12 17v4M12 3v14M6 9a6 6 0 0 0 12 0V3H6v6z" /></svg>;
    case "chart":
      return <svg viewBox="0 0 24 24" {...s}><path d="M18 20V10M12 20V4M6 20v-6" /></svg>;
    case "target":
      return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;
    case "mail":
      return <svg viewBox="0 0 24 24" {...s}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>;
    default:
      return null;
  }
}
