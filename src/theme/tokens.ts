// Tokens de diseño de RiegoSmart IA — fuente de verdad: DESIGN.md.
// La configuración de Tailwind (tailwind.config.js) comparte estos valores.

export const colores = {
  surface: '#F6F8F5',
  surfaceDim: '#EBEFE9',
  surfaceBright: '#FFFFFF',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F1F4EE',
  surfaceContainer: '#E8ECE4',
  surfaceContainerHigh: '#E0E6DB',
  surfaceContainerHighest: '#D7DFD1',
  primary: '#2E7D32',
  primaryContainer: '#C8E6C9',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#1B5E20',
  secondary: '#1E88E5',
  secondaryContainer: '#BBDEFB',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#0D47A1',
  tertiary: '#FB8C00',
  tertiaryContainer: '#FFE0B2',
  onTertiary: '#FFFFFF',
  onTertiaryContainer: '#E65100',
  error: '#E53935',
  errorContainer: '#FFCDD2',
  onError: '#FFFFFF',
  onErrorContainer: '#B71C1C',
  outline: '#81C784',
  outlineVariant: '#E0E0E0',
  onSurface: '#1B1B1B',
  onSurfaceVariant: '#555555',
  inverseSurface: '#2d322b',
  inverseOnSurface: '#eef2e8',
  surfaceTint: '#1b6d24',
  inversePrimary: '#88d982',
  primaryFixed: '#a3f69c',
  primaryFixedDim: '#88d982',
  onPrimaryFixed: '#002204',
  onPrimaryFixedVariant: '#005312',
  background: '#f7fbf0',
  onBackground: '#181d17',
  surfaceVariant: '#e0e4da',
} as const;

export const tipografia = {
  familia: 'Inter_400Regular',
  pesos: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  escala: {
    displayLg: { fontSize: 48, lineHeight: 56, fontWeight: '700' as const },
    displayLgMobile: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
    headlineLg: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
    headlineLgMobile: { fontSize: 24, lineHeight: 32, fontWeight: '700' as const },
    headlineMd: { fontSize: 24, lineHeight: 32, fontWeight: '600' as const },
    headlineSm: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
    titleLg: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
    titleMd: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
    titleSm: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
    bodyLg: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
    bodyMd: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
    bodySm: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
    labelLg: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
    labelMd: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
    labelSm: { fontSize: 11, lineHeight: 14, fontWeight: '500' as const },
  },
} as const;

export const radios = {
  card: 16,
  button: 16,
  pill: 9999,
  sm: 4,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const espaciado = {
  gutter: 16,
  gutterMobile: 12,
  margin: 32,
  marginMobile: 16,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

/** Área táctil mínima accesible (iOS HIG / Material). */
export const areaTactilMinima = 44;
