import { createTheme, em, MantineColorsTuple, rem } from '@mantine/core';

// Réplica de `kycTheme` de ct-kyc-fe: frontinoTheme (@conekta/frontino-ui 3.5.3, entrada v3) con `neutral`
// sobrescrito. frontino-ui vive en un registro privado (ver README), así que sus tokens se copian aquí.
// Se omiten los colores de charts/estado y los temas de Card, Progress, Loader y Popover: la demo no los usa.

// neutral[3] es el override de ct-kyc-fe (frontino trae #CBD5E1).
const neutral: MantineColorsTuple = [
  '#F8FAFC',
  '#F1F5F9',
  '#E2E8F0',
  '#F2F3FA',
  '#94A3B8',
  '#64748B',
  '#334155',
  '#1E293B',
  '#0F172A',
  '#020617',
];

const primary: MantineColorsTuple = [
  '#ECF5FF',
  '#DDECFF',
  '#C1DCFF',
  '#9CC3FF',
  '#75A0FF',
  '#547DFF',
  '#2C4CF5',
  '#2942D9',
  '#2439AF',
  '#171D4D',
];

export const theme = createTheme({
  primaryColor: 'primary',
  fontFamily: 'Inter',
  colors: { neutral, primary },
  breakpoints: {
    '2xs': em('384px'),
    xs: em('576px'),
    sm: em('768px'),
    md: em('992px'),
    lg: em('1200px'),
    xl: em('1408px'),
    '2xl': em('1616px'),
    '3xl': em('1824px'),
  },
  radius: { xs: rem('2px'), sm: rem('4px'), md: rem('8px'), lg: rem('16px'), xl: rem('32px'), '2xl': rem('800px') },
  spacing: {
    xs: rem('4px'),
    sm: rem('8px'),
    md: rem('12px'),
    lg: rem('16px'),
    xl: rem('20px'),
    '2xl': rem('24px'),
    '3xl': rem('32px'),
    '4xl': rem('40px'),
  },
  fontSizes: { xs: rem('10px'), sm: rem('12px'), md: rem('14px'), lg: rem('16px'), xl: rem('18px') },
  lineHeights: {
    xs: rem('12px'),
    sm: rem('16px'),
    md: rem('18px'),
    lg: rem('20px'),
    xl: rem('22px'),
    '2xl': rem('24px'),
  },
  headings: {
    fontFamily: 'Inter',
    fontWeight: 'bold',
    sizes: {
      h1: { fontSize: rem('48px'), lineHeight: rem('58px') },
      h2: { fontSize: rem('40px'), lineHeight: rem('48px') },
      h3: { fontSize: rem('32px'), lineHeight: rem('38px') },
      h4: { fontSize: rem('24px'), lineHeight: rem('28px') },
      h5: { fontSize: rem('16px'), lineHeight: rem('20px') },
      h6: { fontSize: rem('12px'), lineHeight: rem('16px') },
    },
  },
  shadows: {
    xs: '0px 1px 3px 0px #0000000D',
    sm: '0px 1px 2px 0px #0000001A',
    md: '0px 0px 4px 1px #0D151A26',
    lg: '1px 2px 4px 1px #00000026',
    xl: '1px 4px 4px 2px #00000026',
  },
  components: {
    Badge: { defaultProps: { size: 'xs', radius: 'xs', variant: 'light' } },
    ThemeIcon: { defaultProps: { color: 'neutral.5', variant: 'white', size: 'md' } },
  },
});
