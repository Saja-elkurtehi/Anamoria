import { useState } from 'react';
import { Activity, ArrowRight, Lock, Mail } from 'lucide-react';
import type { AppMode } from '../../types';

const MOCK_CREDENTIALS = {
  patient: { email: 'layla.hassan@email.com', password: 'demo1234' },
  physician: { email: 'aisha.khan@riverside.ca', password: 'demo1234' },
};

interface SignInPageProps {
  onSignIn: (mode: AppMode) => void;
}

export default function SignInPage({ onSignIn }: SignInPageProps) {
  const [role, setRole] = useState<AppMode | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function selectRole(r: AppMode) {
    setRole(r);
    setEmail(MOCK_CREDENTIALS[r].email);
    setPassword(MOCK_CREDENTIALS[r].password);
    setError('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    setError('');
    setLoading(true);

    setTimeout(() => {
      const creds = MOCK_CREDENTIALS[role];
      if (email === creds.email && password === creds.password) {
        onSignIn(role);
      } else {
        setError('Incorrect email or password.');
        setLoading(false);
      }
    }, 600);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center px-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900 tracking-tight">Anamoria</span>
          <span className="text-gray-300 text-sm">·</span>
          <span className="text-gray-400 text-sm">Medical Continuity Platform</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {!role ? (
            /* Role picker */
            <div>
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-semibold text-gray-900">Sign in to Anamoria</h1>
                <p className="mt-2 text-sm text-gray-500">Choose how you're accessing the platform.</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => selectRole('patient')}
                  className="w-full flex items-center gap-4 px-5 py-4 bg-white border border-gray-200 rounded-xl hover:border-teal-400 hover:bg-teal-50 transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-teal-50 group-hover:bg-teal-100 border border-teal-200 flex items-center justify-center flex-shrink-0 transition-colors">
                    <svg className="w-5 h-5 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Patient</p>
                    <p className="text-xs text-gray-400 mt-0.5">View and manage your health record</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-teal-500 transition-colors" />
                </button>

                <button
                  onClick={() => selectRole('physician')}
                  className="w-full flex items-center gap-4 px-5 py-4 bg-white border border-gray-200 rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-50 group-hover:bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 transition-colors">
                    <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Physician</p>
                    <p className="text-xs text-gray-400 mt-0.5">Review patient timelines and add clinical notes</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-slate-500 transition-colors" />
                </button>
              </div>

              <p className="mt-6 text-center text-xs text-gray-400">
                This is a demo. No real health data is stored.
              </p>
            </div>
          ) : (
            /* Sign in form */
            <div>
              <button
                onClick={() => setRole(null)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-6 transition-colors"
              >
                <ArrowRight className="w-3 h-3 rotate-180" />
                Back
              </button>

              <div className="mb-6">
                <div className={`inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full mb-3 ${
                  role === 'patient' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-slate-50 text-slate-700 border border-slate-200'
                }`}>
                  {role === 'patient' ? 'Patient Portal' : 'Physician Dashboard'}
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Sign in</h1>
                <p className="mt-1 text-sm text-gray-400">
                  {role === 'patient'
                    ? 'Signing in as Layla Hassan'
                    : 'Signing in as Dr. Aisha Khan'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 bg-white"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-600">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors flex items-center justify-center gap-2 ${
                    role === 'patient'
                      ? 'bg-teal-600 hover:bg-teal-700'
                      : 'bg-slate-700 hover:bg-slate-800'
                  } disabled:opacity-60`}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Sign in <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>

              <p className="mt-5 text-center text-xs text-gray-400">
                Demo credentials pre-filled. Just press sign in.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
