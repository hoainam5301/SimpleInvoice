/**
 * Single source of truth for the app's palette. Screens/components never
 * hard-code hex values — they import from here, so a rebrand (or a future
 * dark mode) touches exactly one file.
 *
 * Direction (per the "SimpleInvoice Redesign" handoff): warm & modern —
 * cream canvas, orange→pink accent gradient, pill shapes, soft shadows.
 * OKLCH values from the design tokens are approximated to hex for RN.
 */
export const colors = {
  // Brand — the accent is a GRADIENT (orange → pink); `gradient` feeds
  // react-native-linear-gradient, `primary` is the solid fallback/accent.
  gradient: ['#FB923C', '#EC4899'] as [string, string],
  primary: '#EC4899',
  accentText: '#E0446B',

  // Surfaces
  background: '#FFF7ED',
  surface: '#FFFFFF',
  border: '#E8E2DA',
  divider: '#ECE7DF',

  // Text (warm near-blacks / warm grays)
  ink: '#332B24',
  muted: '#7E7266',
  placeholder: '#9C9083',
  onPrimary: '#FFFFFF',

  // Badge ("101 DIGITAL", logout button, avatar background)
  badgeBackground: '#F7E8D6',
  badgeText: '#A84A44',

  // Semantic
  danger: '#C03A52',
  dangerSoft: '#FDE7EA',
  shadow: '#4A3B2E',
} as const;

/** Per-status pill colors, keyed by the domain's InvoiceStatus union. */
export const statusColors = {
  Due: { text: '#A3652A', background: '#FCEED3' },
  Overdue: { text: '#C63B54', background: '#FBE3E4' },
  Paid: { text: '#2E7D4F', background: '#D7F2DF' },
} as const;
