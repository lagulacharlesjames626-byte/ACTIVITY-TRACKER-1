export interface SubjectTheme {
  code: string;
  fullName: string;
  shortName: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentBg: string;
  dotColor: string;
  ringColor: string;
  cardBorder: string;
  cardBorderHover: string;
  cardBg: string; // Vibrant recognizable background for the module card!
  cardHeaderBg: string;
  primaryColorHex: string;
}

export const OFFICIAL_SUBJECTS: readonly string[] = [
  'BUMA 013 Good Governance and Social Responsibility',
  'CWTS 001 Civic Welfare Training Service 1',
  'GEED 001 Understanding the Self/Pag-unawa sa Sarili',
  'GEED 002 Readings in Philippine History/Mga Babasahin Hinggil sa Kasaysayan ng Pilipinas',
  'GEED 003 The Contemporary World/Ang Kasalukuyang Daigdig',
  'HRMA 101 Service Culture',
  'PATHFIT 1 Physical Activity Towards Health and Fitness 1',
] as const;

export const SUBJECT_THEMES: Record<string, SubjectTheme> = {
  BUMA_013: {
    code: 'BUMA 013',
    fullName: 'BUMA 013 Good Governance and Social Responsibility',
    shortName: 'Good Governance & Social Resp.',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-950',
    badgeBorder: 'border-blue-300',
    accentBg: 'bg-blue-100/70',
    dotColor: 'bg-blue-600',
    ringColor: 'ring-blue-400',
    cardBorder: 'border-blue-300',
    cardBorderHover: 'hover:border-blue-500',
    cardBg: 'bg-blue-50/90', // Recognizable Sky Blue tint
    cardHeaderBg: 'bg-blue-100/50',
    primaryColorHex: '#2563eb',
  },
  CWTS_001: {
    code: 'CWTS 001',
    fullName: 'CWTS 001 Civic Welfare Training Service 1',
    shortName: 'Civic Welfare Training 1',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-950',
    badgeBorder: 'border-teal-300',
    accentBg: 'bg-teal-100/70',
    dotColor: 'bg-teal-600',
    ringColor: 'ring-teal-400',
    cardBorder: 'border-teal-300',
    cardBorderHover: 'hover:border-teal-500',
    cardBg: 'bg-teal-50/90', // Recognizable Teal tint
    cardHeaderBg: 'bg-teal-100/50',
    primaryColorHex: '#0d9488',
  },
  GEED_001: {
    code: 'GEED 001',
    fullName: 'GEED 001 Understanding the Self/Pag-unawa sa Sarili',
    shortName: 'Understanding the Self',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-950',
    badgeBorder: 'border-purple-300',
    accentBg: 'bg-purple-100/70',
    dotColor: 'bg-purple-600',
    ringColor: 'ring-purple-400',
    cardBorder: 'border-purple-300',
    cardBorderHover: 'hover:border-purple-500',
    cardBg: 'bg-purple-50/90', // Recognizable Purple / Lavender tint
    cardHeaderBg: 'bg-purple-100/50',
    primaryColorHex: '#9333ea',
  },
  GEED_002: {
    code: 'GEED 002',
    fullName: 'GEED 002 Readings in Philippine History/Mga Babasahin Hinggil sa Kasaysayan ng Pilipinas',
    shortName: 'Readings in PH History',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-950',
    badgeBorder: 'border-amber-300',
    accentBg: 'bg-amber-100/70',
    dotColor: 'bg-amber-600',
    ringColor: 'ring-amber-400',
    cardBorder: 'border-amber-300',
    cardBorderHover: 'hover:border-amber-500',
    cardBg: 'bg-amber-50/90', // Recognizable Warm Amber Gold tint
    cardHeaderBg: 'bg-amber-100/50',
    primaryColorHex: '#d97706',
  },
  GEED_003: {
    code: 'GEED 003',
    fullName: 'GEED 003 The Contemporary World/Ang Kasalukuyang Daigdig',
    shortName: 'The Contemporary World',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-950',
    badgeBorder: 'border-rose-300',
    accentBg: 'bg-rose-100/70',
    dotColor: 'bg-rose-600',
    ringColor: 'ring-rose-400',
    cardBorder: 'border-rose-300',
    cardBorderHover: 'hover:border-rose-500',
    cardBg: 'bg-rose-50/90', // Recognizable Rose / Coral tint
    cardHeaderBg: 'bg-rose-100/50',
    primaryColorHex: '#e11d48',
  },
  HRMA_101: {
    code: 'HRMA 101',
    fullName: 'HRMA 101 Service Culture',
    shortName: 'Service Culture',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-950',
    badgeBorder: 'border-emerald-300',
    accentBg: 'bg-emerald-100/70',
    dotColor: 'bg-emerald-600',
    ringColor: 'ring-emerald-400',
    cardBorder: 'border-emerald-300',
    cardBorderHover: 'hover:border-emerald-500',
    cardBg: 'bg-emerald-50/90', // Recognizable Emerald Mint tint
    cardHeaderBg: 'bg-emerald-100/50',
    primaryColorHex: '#059669',
  },
  PATHFIT_1: {
    code: 'PATHFIT 1',
    fullName: 'PATHFIT 1 Physical Activity Towards Health and Fitness 1',
    shortName: 'Physical Activity & Fitness 1',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-950',
    badgeBorder: 'border-orange-300',
    accentBg: 'bg-orange-100/70',
    dotColor: 'bg-orange-600',
    ringColor: 'ring-orange-400',
    cardBorder: 'border-orange-300',
    cardBorderHover: 'hover:border-orange-500',
    cardBg: 'bg-orange-50/90', // Recognizable Warm Orange tint
    cardHeaderBg: 'bg-orange-100/50',
    primaryColorHex: '#ea580c',
  },
  DEFAULT: {
    code: 'SUBJ',
    fullName: 'General Subject',
    shortName: 'General Subject',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-950',
    badgeBorder: 'border-indigo-300',
    accentBg: 'bg-indigo-100/70',
    dotColor: 'bg-indigo-600',
    ringColor: 'ring-indigo-400',
    cardBorder: 'border-indigo-300',
    cardBorderHover: 'hover:border-indigo-500',
    cardBg: 'bg-indigo-50/90', // Recognizable Indigo tint
    cardHeaderBg: 'bg-indigo-100/50',
    primaryColorHex: '#4f46e5',
  },
};

/**
 * Returns color coding theme for any subject name (exact or partial keyword match).
 */
export function getSubjectTheme(subjectName?: string): SubjectTheme {
  if (!subjectName) return SUBJECT_THEMES.DEFAULT;

  const clean = subjectName.trim().toUpperCase();

  if (clean.includes('BUMA') || clean.includes('GOOD GOVERNANCE') || clean.includes('SOCIAL RESPONSIBILITY')) {
    return SUBJECT_THEMES.BUMA_013;
  }
  if (clean.includes('CWTS') || clean.includes('CIVIC WELFARE') || clean.includes('TRAINING SERVICE')) {
    return SUBJECT_THEMES.CWTS_001;
  }
  if (clean.includes('GEED 001') || clean.includes('UNDERSTANDING THE SELF') || clean.includes('PAG-UNAWA SA SARILI') || clean.includes('PAG-UNAWA')) {
    return SUBJECT_THEMES.GEED_001;
  }
  if (clean.includes('GEED 002') || clean.includes('PHILIPPINE HISTORY') || clean.includes('KASAYSAYAN') || clean.includes('PILIPINAS')) {
    return SUBJECT_THEMES.GEED_002;
  }
  if (clean.includes('GEED 003') || clean.includes('CONTEMPORARY WORLD') || clean.includes('KASALUKUYANG DAIGDIG') || clean.includes('DAIGDIG')) {
    return SUBJECT_THEMES.GEED_003;
  }
  if (clean.includes('HRMA') || clean.includes('SERVICE CULTURE')) {
    return SUBJECT_THEMES.HRMA_101;
  }
  if (clean.includes('PATHFIT') || clean.includes('HEALTH AND FITNESS') || clean.includes('PHYSICAL ACTIVITY')) {
    return SUBJECT_THEMES.PATHFIT_1;
  }

  return SUBJECT_THEMES.DEFAULT;
}
