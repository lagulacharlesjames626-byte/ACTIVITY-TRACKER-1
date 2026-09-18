export const DEFAULT_STUDENTS_ROSTER: string[] = [
  'JAMORAWON',
  'RAMOS',
  'RASTRULLO',
  'RUSTIA',
  'SEVERINO',
  'TUOZO',
  'GODOY',
  'HERNANDEZ',
  'LAGULA',
  'ABANTO',
  'ALBANIEL',
  'AMOROSO',
  'BANATAO',
  'BLANCADA',
  'CAANDE',
  'CAGANG',
  'CAYETANO',
  'CONDES',
  'CRISOSTOMO',
  'DEMILLO',
  'DOMINO',
  'EQUIBAL',
  'FAMODULAN',
  'GONZALES',
  'GONZALEZ',
  'HAYAHAY',
  'IMPORTANTE',
  'INTANO',
  'JARA',
  'JIMENEZ',
  'LEORAG',
  'LORICA',
  'MADRIA',
  'MANGANTI',
  'MERANO',
  'MISSION',
  'NOGUERAS',
  'PASCUAL',
  'PEÑA',
  'POSTRERO',
  'SANTOS',
  'SEGARRA',
  'TALANQUINES',
  'TROPICALES',
  'VENTURA',
  'YAUDER',
  'NATOR',
  'GASINGAN',
];

export const ADMIN_SURNAMES: string[] = [
  'LAGULA',
  'CAANDE',
  'CAGANG',
  'MANGANTI',
  'TROPICALES',
  'YAUDER',
  'DEMILLO',
  'ABANTO',
];

export interface AuthResult {
  success: boolean;
  role?: 'student' | 'admin';
  surname?: string;
  error?: string;
}

/**
 * Validates Surname and Password according to class rules:
 * - Surname is in ALL CAPITAL LETTERS (e.g. LAGULA, RAMOS)
 * - Student Password is all small letter: <surname>hrm1a (e.g. lagulahrm1a)
 * - Admin Password is all small letter: <surname>hrm1-a (e.g. lagulahrm1-a)
 */
export function verifyCredentials(
  surnameInput: string,
  passwordInput: string,
  customRoster: string[] = DEFAULT_STUDENTS_ROSTER,
  customAdmins: string[] = ADMIN_SURNAMES
): AuthResult {
  const cleanSurname = surnameInput.trim().toUpperCase();
  const cleanPassword = passwordInput.trim().toLowerCase();

  if (!cleanSurname) {
    return { success: false, error: 'Please enter your Surname.' };
  }
  if (!cleanPassword) {
    return { success: false, error: 'Please enter your Password.' };
  }

  const surnameLower = cleanSurname.toLowerCase();
  // Support both accented (peñahrm1a) and non-accented (penahrm1a)
  const surnameLowerNoAccent = surnameLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const activeAdmins = (customAdmins && customAdmins.length > 0 ? customAdmins : ADMIN_SURNAMES).map((a) =>
    a.trim().toUpperCase()
  );
  const isAdminSurname = activeAdmins.includes(cleanSurname);

  // Check Admin Password first: <surname>hrm1-a
  const expectedAdminPass1 = `${surnameLower}hrm1-a`;
  const expectedAdminPass2 = `${surnameLowerNoAccent}hrm1-a`;

  if (isAdminSurname && (cleanPassword === expectedAdminPass1 || cleanPassword === expectedAdminPass2)) {
    return {
      success: true,
      role: 'admin',
      surname: cleanSurname,
    };
  }

  // Check Student Password: <surname>hrm1a
  const expectedStudentPass1 = `${surnameLower}hrm1a`;
  const expectedStudentPass2 = `${surnameLowerNoAccent}hrm1a`;

  const isMatchingStudentPass =
    cleanPassword === expectedStudentPass1 || cleanPassword === expectedStudentPass2;

  // Check if surname exists in either default roster, custom roster, or admin list
  const activeRosterUpper = (customRoster.length > 0 ? customRoster : DEFAULT_STUDENTS_ROSTER).map((s) =>
    s.trim().toUpperCase()
  );

  const isKnownSurname =
    activeRosterUpper.includes(cleanSurname) ||
    activeRosterUpper.some((s) => s.startsWith(cleanSurname)) ||
    activeAdmins.includes(cleanSurname);

  if (isMatchingStudentPass) {
    if (isKnownSurname) {
      return {
        success: true,
        role: 'student',
        surname: cleanSurname,
      };
    }
    // Even if student was registered outside roster, valid pattern passes
    return {
      success: true,
      role: 'student',
      surname: cleanSurname,
    };
  }

  // If wrong password
  if (isAdminSurname && cleanPassword.includes('hrm1')) {
    return {
      success: false,
      error: `Incorrect password for Admin ${cleanSurname}. Admin password is ${expectedAdminPass1} (all small letters).`,
    };
  }

  return {
    success: false,
    error: `Incorrect credentials. Student password format is ${expectedStudentPass1} (all small letters). For Admin, use ${expectedAdminPass1}.`,
  };
}
