/**
 * Shared colour palette for printable documents (Facture, Devis, Bon de
 * Commande, Bon de Livraison, Avoir).
 *
 * Design goals
 * ─────────────────────────────────────────────────────────────────────
 * The previous PDFs were pure black-on-white with harsh `#000` borders
 * everywhere. That reads as a 1990s scan rather than a modern document.
 * This palette keeps the same neutral feel — the document is still
 * readable when printed in greyscale — but replaces:
 *
 *   • pure `#000` borders   → soft slate `#CBD5E1` / `#E2E8F0`
 *   • pure `#000` headings  → slate-900 `#0F172A`
 *   • muted `#475569` body  → slate-500/600 with better print contrast
 *
 * A single brand accent (`accent`) is introduced for:
 *   • the underline below the items table header
 *   • the bottom border of the meta/info row
 *   • the highlight of the "Total TTC" line in the totals stack
 *
 * The accent is deep teal (#0F766E) which is the printable cousin of
 * the ParaGestion emerald primary — desaturated enough to look formal
 * in B&W previews, saturated enough to be visible on screen.
 *
 * KEEP THIS PALETTE STABLE — every document file imports from here, so
 * any tweak propagates atomically. If you need a different visual for
 * one specific document, override locally at the call-site instead of
 * forking the palette.
 */
export const DOC_COLORS = {
  /** Primary brand accent — bold invoice red used by the title pill,
   *  the items table header bar, the TOTAL TTC highlight row, and the
   *  thin separator rule above the FACTURÉ À box. */
  accent:        '#E63946',
  /** Faint pink wash for soft accents (currently unused — reserved for
   *  any subtle "callout" cells that need a tinted background). */
  accentSoft:    '#FEE2E2',
  /** Darker red used for hover-equivalent strong borders or when the
   *  primary accent needs to be intensified for contrast. */
  accentStrong:  '#B91C1C',

  /** Document headings (FACTURE, DEVIS, etc.). Softer than pure black. */
  title:         '#0F172A',
  /** Body copy + table cell content. */
  text:          '#1E293B',
  /** Secondary / supplementary text (subtitles, footer, dates). */
  muted:         '#475569',
  /** Tertiary text (page numbers, legal mentions). */
  subtle:        '#64748B',

  /** Strong border — table column dividers, info boxes, totals stack. */
  border:        '#CBD5E1',
  /** Light border — single-row separators inside tables. */
  borderSoft:    '#E2E8F0',
  /** Zebra / alternating row tint (so faint it survives photocopy). */
  rowAlt:        '#F8FAFC',

  /** Watermark text colour (very low opacity). */
  watermark:     'rgba(15, 23, 42, 0.045)',
} as const

export type DocColor = keyof typeof DOC_COLORS
