import React, { useState } from 'react';
import {
  LogIn,
  User,
  Shield,
  GraduationCap,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  KeyRound,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { DEFAULT_STUDENTS_ROSTER, ADMIN_SURNAMES, verifyCredentials } from '../utils/rosterData';

interface LoginScreenProps {
  onLogin: (name: string, role?: 'student' | 'admin') => void;
  onAdminLogin: (password: string) => Promise<boolean>;
  roster: string[];
  admins?: string[];
  onRegisterStudent: (name: string) => Promise<boolean>;
  courseName?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onAdminLogin,
  roster = [],
  admins = ADMIN_SURNAMES,
  onRegisterStudent,
  courseName = 'BSBA-HRM Class 1-A',
}) => {
  const [surname, setSurname] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHelperModal, setShowHelperModal] = useState(false);

  const activeAdmins = (admins && admins.length > 0 ? admins : ADMIN_SURNAMES).map((a) =>
    a.trim().toUpperCase()
  );

  // Backup Student Sign-up Modal
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [signUpSurname, setSignUpSurname] = useState('');
  const [signUpError, setSignUpError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Active roster list (merge server roster with default 48 students)
  const activeRoster = React.useMemo(() => {
    const set = new Set<string>();
    (roster.length > 0 ? roster : DEFAULT_STUDENTS_ROSTER).forEach((s) => {
      const clean = s.trim().toUpperCase();
      if (clean) set.add(clean);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [roster]);

  // Clean surname for placeholder/hint
  const cleanSurname = surname.trim().toUpperCase();
  const lowerSurname = cleanSurname.toLowerCase();
  const isAdmin = activeAdmins.includes(cleanSurname);

  // Handle Login Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!cleanSurname) {
      setErrorMessage('Please enter your Surname (e.g. LAGULA)');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Try server verification first
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surname: cleanSurname,
          password: password.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const role: 'student' | 'admin' = data.role === 'admin' ? 'admin' : 'student';
          try {
            localStorage.setItem('bsba_student_session', cleanSurname);
            localStorage.setItem('bsba_user_role', role);
          } catch {}
          onLogin(cleanSurname, role);
          return;
        }
      }

      // 2. Client-side deterministic verification fallback
      const localResult = verifyCredentials(cleanSurname, password, activeRoster, activeAdmins);
      if (localResult.success) {
        const role = localResult.role || 'student';
        try {
          localStorage.setItem('bsba_student_session', cleanSurname);
          localStorage.setItem('bsba_user_role', role);
        } catch {}
        onLogin(cleanSurname, role);
        return;
      } else {
        setErrorMessage(localResult.error || 'Invalid credentials.');
      }
    } catch (err) {
      // Offline fallback
      const localResult = verifyCredentials(cleanSurname, password, activeRoster, activeAdmins);
      if (localResult.success) {
        const role = localResult.role || 'student';
        try {
          localStorage.setItem('bsba_student_session', cleanSurname);
          localStorage.setItem('bsba_user_role', role);
        } catch {}
        onLogin(cleanSurname, role);
        return;
      } else {
        setErrorMessage(localResult.error || 'Failed to authenticate. Please check spelling.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sign up new student to roster
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sName = signUpSurname.trim().toUpperCase();

    if (!sName) {
      setSignUpError('Please enter your Surname');
      return;
    }

    setIsRegistering(true);
    setSignUpError('');

    const success = await onRegisterStudent(sName);
    setIsRegistering(false);

    if (success) {
      setIsSignUpOpen(false);
      setSurname(sName);
      setPassword(`${sName.toLowerCase()}hrm1a`);
    } else {
      setSignUpError('Could not register surname. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-8 text-slate-800">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-900/50 mb-3">
            <GraduationCap className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {courseName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
            Class Activity Checklist & Module Tracker
          </p>
        </div>

        {/* Login Form Box */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8">
          <div className="mb-5 text-center">
            <h2 className="text-lg font-black text-slate-900">
              Sign In to Your Account
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your <strong>Surname</strong> and <strong>Password</strong> to access your modules.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field 1: SURNAME (Replaces Email) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Surname (Last Name) *
              </label>

              {/* Quick Dropdown Picker for 48 Students (Optional helper) */}
              <div className="mb-2">
                <select
                  value={cleanSurname}
                  onChange={(e) => {
                    const picked = e.target.value;
                    setSurname(picked);
                    setErrorMessage('');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="">-- Or tap to select from student list --</option>
                  {activeRoster.map((name) => (
                    <option key={name} value={name}>
                      {name} {activeAdmins.includes(name) ? '(Admin)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. LAGULA"
                  value={surname}
                  onChange={(e) => {
                    // Normalize automatically to all uppercase
                    setSurname(e.target.value.toUpperCase());
                    setErrorMessage('');
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-black tracking-wide uppercase text-slate-900 placeholder:normal-case placeholder:font-normal focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Field 2: PASSWORD */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password *
                </label>
                <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  all small letters
                </span>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={
                    cleanSurname
                      ? isAdmin
                        ? `e.g. ${lowerSurname}hrm1-a (Admin) or ${lowerSurname}hrm1a`
                        : `e.g. ${lowerSurname}hrm1a`
                      : 'e.g. lagulahrm1a'
                  }
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value.toLowerCase());
                    setErrorMessage('');
                  }}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Dynamic Hint Helper */}
              {cleanSurname && (
                <div className="mt-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                  <span>
                    Student Password:{' '}
                    <strong className="text-indigo-700 font-mono">
                      {lowerSurname}hrm1a
                    </strong>
                  </span>
                  {isAdmin && (
                    <span className="text-amber-800 font-bold ml-2">
                      Admin:{' '}
                      <strong className="text-amber-700 font-mono">
                        {lowerSurname}hrm1-a
                      </strong>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Error Display */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 transition-all shadow-md shadow-indigo-200 cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
              <LogIn className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* Password Format Guide Box */}
          <div className="mt-5 p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 space-y-1.5">
            <div className="flex items-center gap-1.5 font-black text-indigo-900">
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              <span>Password Format Guide</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              • <strong>Students:</strong> Surname in all small letters + course &amp; class:
              <span className="block font-mono font-bold text-indigo-800 mt-0.5">
                example: lagulahrm1a (surname is LAGULA)
              </span>
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              • <strong>Admins:</strong> Surname in all small letters + course &amp; class with hyphen:
              <span className="block font-mono font-bold text-amber-800 mt-0.5">
                example: lagulahrm1-a (surname is LAGULA)
              </span>
            </p>
          </div>

          {/* Bottom Actions: View Admin List & Sign Up Backup */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setShowHelperModal(true)}
              className="text-slate-500 hover:text-indigo-600 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span>List of Admins</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSignUpOpen(true);
                setSignUpError('');
              }}
              className="text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1 cursor-pointer hover:underline"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Name</span>
            </button>
          </div>
        </div>
      </div>

      {/* ADMINS LIST MODAL */}
      {showHelperModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Admin List</h3>
                  <p className="text-[10px] text-slate-500">BSBA-HRM Class 1-A</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelperModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-black"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              The following {activeAdmins.length} surnames have administrator rights. Their password format is{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-amber-800">
                [surname]hrm1-a
              </code>
              :
            </p>

            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {activeAdmins.map((adminName) => (
                <button
                  key={adminName}
                  type="button"
                  onClick={() => {
                    setSurname(adminName);
                    setPassword(`${adminName.toLowerCase()}hrm1-a`);
                    setShowHelperModal(false);
                  }}
                  className="p-2 rounded-xl bg-amber-50/70 hover:bg-amber-100 border border-amber-200 text-left cursor-pointer transition-colors"
                >
                  <span className="font-black text-xs text-amber-900 block">{adminName}</span>
                  <span className="font-mono text-[10px] text-amber-700 block">
                    {adminName.toLowerCase()}hrm1-a
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowHelperModal(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* BACKUP SIGN UP MODAL */}
      {isSignUpOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Register Surname</h3>
                <p className="text-[11px] text-slate-500">Add yourself to {courseName}</p>
              </div>
            </div>

            <form onSubmit={handleSignUpSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Surname (Last Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DELA CRUZ"
                  value={signUpSurname}
                  onChange={(e) => setSignUpSurname(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold uppercase text-slate-900 focus:bg-white"
                />
              </div>

              {signUpError && (
                <p className="text-xs font-bold text-rose-600">{signUpError}</p>
              )}

              <p className="text-[11px] text-slate-500">
                Your login password will automatically be:{' '}
                <strong className="font-mono text-indigo-700">
                  {signUpSurname ? signUpSurname.toLowerCase() : '[surname]'}hrm1a
                </strong>
              </p>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSignUpOpen(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs cursor-pointer min-h-[38px]"
                >
                  {isRegistering ? 'Registering...' : 'Register & Log In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
