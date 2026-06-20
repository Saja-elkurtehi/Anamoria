import { NavLink, useNavigate } from 'react-router-dom';
import { Activity, RefreshCw, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { demoPatient } from '../../data/mockData';

const navItems = [
  { to: '/patient', label: 'Overview', end: true },
  { to: '/patient/timeline', label: 'Timeline' },
  { to: '/patient/documents', label: 'Documents' },
  { to: '/patient/access', label: 'Access' },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const { resetDemo, setRole } = useApp();
  const navigate = useNavigate();

  function handleSignOut() {
    setRole(null);
    navigate('/');
  }

  function handleReset() {
    if (window.confirm('Reset all demo data to initial state?')) {
      resetDemo();
      navigate('/');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center shadow-sm">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 tracking-tight text-sm">Anamoria</span>
          </div>

          <div className="h-5 w-px bg-gray-200" />

          {/* Patient badge */}
          <span className="text-xs font-semibold bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full border border-teal-100">
            Patient Portal
          </span>

          {/* Nav links */}
          <nav className="flex items-center gap-1 ml-2">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-3">
            {/* User chip */}
            <div className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-full bg-white">
              <div className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold">
                {demoPatient.name.split(' ').map(n => n[0]).join('')}
              </div>
              <span className="text-sm font-medium text-gray-700">{demoPatient.name}</span>
            </div>

            <button
              onClick={handleReset}
              title="Reset demo data"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="font-medium">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Safety footer */}
      <footer className="border-t border-gray-100 bg-white py-3 px-6 text-center">
        <p className="text-xs text-gray-400">
          Anamoria organizes medical information and does not provide diagnosis or treatment.
          Patient-reported information requires clinical verification.
        </p>
      </footer>
    </div>
  );
}
