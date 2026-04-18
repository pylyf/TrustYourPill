export const fonts = {
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semiBold: 'Geist_600SemiBold',
} as const;

export const colors = {
  accent: '#006BFF',
  success: '#26B81E',
  successGlow: '#52FF4A',
  warning: '#D9823A',
  danger: '#D04646',
  white: '#FFFFFF',
  heroGray: '#EAEAEA',
  cardGray: '#EFEFEF',
  dark: '#111111',
  meta: 'rgba(0,0,0,0.55)',
  metaStrong: 'rgba(0,0,0,0.7)',
} as const;

export const gradients = {
  adherence: ['#F4D6E4', '#D9C8EF'],
  paracetamol: ['#E8F4FA', '#CFE5F2'],
  ibuprofen: ['#E2DBF6', '#C9BFEE'],
  streak: ['#D9EFDC', '#BFE3C8'],
  nextDose: ['#FCE2CF', '#F6C9A8'],
  warmPeach: ['#FCE2CF', '#F6C9A8'],
  sage: ['#D9EFDC', '#BFE3C8'],
  softPurple: ['#E2DBF6', '#C9BFEE'],
  lightBlue: ['#E8F4FA', '#CFE5F2'],
  pinkPurple: ['#F4D6E4', '#D9C8EF'],
  warningChip: ['#FDE2CF', '#F6B68C'],
  dangerChip: ['#FCD6D6', '#F2A9A9'],
  mutedChip: ['#EEEEEE', '#DEDEDE'],
} as const;

export type GradientKey = keyof typeof gradients;

export const pillGradientCycle: GradientKey[] = [
  'lightBlue',
  'softPurple',
  'sage',
  'warmPeach',
  'pinkPurple',
];
