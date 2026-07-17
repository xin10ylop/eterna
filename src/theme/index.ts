import { Platform } from 'react-native';

/**
 * Eterna design tokens.
 *
 * Porcelain-white ground with a warm accent. All colors flow through
 * `getTheme(accent)` so an accent change re-skins the whole app.
 */

export type AccentName = 'Terracotta' | 'Rosé' | 'Mauve' | 'Sage';

const ACCENTS: Record<AccentName, { accent: string; accentSoft: string; onAccent: string }> = {
  Terracotta: { accent: '#B4634A', accentSoft: '#F6EAE4', onAccent: '#FFFFFF' },
  'Rosé': { accent: '#C05F79', accentSoft: '#F8E9EE', onAccent: '#FFFFFF' },
  Mauve: { accent: '#8B6BA6', accentSoft: '#EFE9F5', onAccent: '#FFFFFF' },
  Sage: { accent: '#5F8352', accentSoft: '#E9F0E2', onAccent: '#FFFFFF' },
};

export function getTheme(accent: AccentName) {
  const a = ACCENTS[accent];
  return {
    // grounds
    bg: '#FFFFFF',
    surface: '#F6F6F8',
    surfaceAlt: '#FBFBFC',
    border: '#ECECEF',
    separator: '#E9E9EC',
    // ink
    text: '#1C1C1E',
    sub: '#6E6E73',
    muted: '#AEAEB4',
    faint: '#D9D9DE',
    // accent
    accent: a.accent,
    accentSoft: a.accentSoft,
    onAccent: a.onAccent,
    // semantics (kept separate from accent)
    attention: a.accent,
    positive: '#5E9C57',
    // chrome
    tabBg: 'rgba(255,255,255,0.96)',
    overlay: 'rgba(22,18,16,0.42)',
    shadow: 'rgba(30,30,40,0.14)',
  } as const;
}

export type Theme = ReturnType<typeof getTheme>;

export const type = {
  /** Brand serif for the wordmark and hero moments. */
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }) as string,
  largeTitle: { fontSize: 30, fontWeight: '700' as const, letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  headline: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  sub: { fontSize: 13, fontWeight: '400' as const },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
};

export const spacing = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 };
export const radii = { s: 8, m: 12, l: 16, xl: 24, pill: 100 };
