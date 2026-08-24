/**
 * Aura color system.
 *
 * Hard constraint (product spec): users open this app mid-migraine, often
 * photophobic. Pure black surfaces, a single dim ember (red-orange) hue for
 * all emphasis, no white, no saturated accent colors, no animation anywhere
 * in the app. Every screen — not just Attack Mode — uses this palette so
 * switching tabs never introduces a brightness jump.
 */

export const colors = {
  // Surfaces — pure black only, two near-black steps for layering cards
  // without ever approaching gray/white.
  background: '#000000',
  surface: '#0a0704',
  surfaceRaised: '#120b06',
  border: '#2a180d',

  // Ember (dim red-orange) — the only hue in the app. Steps go from very
  // dim (secondary/disabled) to the brightest ember we allow (primary
  // emphasis), which is still far below full saturation/brightness.
  emberDim: '#4a2716',
  emberMuted: '#7a3d1f',
  ember: '#a8532b',
  emberBright: '#c46a37',

  // Text
  textPrimary: '#c46a37',
  textSecondary: '#7a4429',
  textDisabled: '#4a2716',

  // Semantic — kept inside the ember family. "Danger" (medication overuse,
  // safety warnings) is the brightest ember tone plus underline/weight,
  // never a new hue like red or yellow, so it doesn't add a bright flash.
  danger: '#c46a37',
  dangerSurface: '#1a0d05',
  success: '#8a6a3d', // deliberately desaturated — no green anywhere

  overlay: 'rgba(0,0,0,0.88)',
} as const;

export type AuraColors = typeof colors;
