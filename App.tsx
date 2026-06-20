import { useState } from 'react';
import { Activity, LogOut, ChevronDown } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import PatientPortal from './components/patient/PatientPortal';
import PhysicianDashboard from './components/physician/PhysicianDashboard';
import SignInPage from './components/auth/SignInPage';
import type { AppMode } from './types';

function Header({ onSignOut }: { onSignOut: () => void }) {
  const { mode, patient } = useApp();
  const isPhysician = mode === 'physician';

  return (
    <header className="h-14 bg-white border-b border-gray-200 shadow-sm flex items-center px-5 gap-4 flex-shrink-0 z-20">
      {/* Logo */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center shadow-sm">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-gray-900 tracking-tight">Anamoria</span>
      </div>

      <div className="h-5 w-px bg-gray-200 mx-1" />

      {/* Role badge */}
      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
        isPhysician
          ? 'bg-slate-900 text-white'
          : 'bg-teal-600 text-white'
      }`}>
        {isPhysician ? 'Physician' : 'Patient Portal'}
      </span>

      {/* Source legend */}
      <div className="hidden lg:flex items-center gap-4 ml-4 text-xs text-gray-400">
        {[
          { dot: 'bg-blue-400',   label: 'EMR / Upload' },
          { dot: 'bg-green-500',  label: 'Verified' },
          { dot: 'bg-violet-500', label: 'Physician' },
          { dot: 'bg-amber-400',  label: 'Patient-Reported' },
        ].map(({ dot, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${dot}`} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Right: user */}
      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-2.5 border border-gray-200 rounded-xl px-3 py-1.5 bg-white hover:bg-gray-50 transition-colors">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
            isPhysician ? 'bg-slate-700' : 'bg-teal-600'
          }`}>
            {isPhysician ? 'AK' : patient.name.split(' ').map(n => n[0]).join('')}
          </div>
          <span className="text-sm font-medium text-gray-800 hidden sm:block">
            {isPhysician ? 'Dr. Aisha Khan' : patient.name}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </div>

        <button
          onClick={onSignOut}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors px-2.5 py-2 rounded-lg hover:bg-red-50"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-medium">Sign out</span>
        </button>
      </div>
    </header>
  );
}

function AppShell({ mode, onSignOut }: { mode: AppMode; onSignOut: () => void }) {
  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <Header onSignOut={onSignOut} />
      <main className="flex-1 min-h-0 overflow-hidden">
        {mode === 'patient' ? <PatientPortal /> : <PhysicianDashboard />}
      </main>
    </div>
  );
}

export default function App() {
  const [signedInAs, setSignedInAs] = useState<AppMode | null>(null);

  if (!signedInAs) {
    return <SignInPage onSignIn={setSignedInAs} />;
  }

  return (
    <AppProvider initialMode={signedInAs}>
      <AppShell mode={signedInAs} onSignOut={() => setSignedInAs(null)} />
    </AppProvider>
  );
}
