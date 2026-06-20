import { useNavigate } from 'react-router-dom';
import { Activity, User, Stethoscope, ArrowRight, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function RoleSelection() {
  const { setRole } = useApp();
  const navigate = useNavigate();

  function choose(role: 'patient' | 'physician') {
    setRole(role);
    navigate(role === 'patient' ? '/patient' : '/physician');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-600 rounded-2xl shadow-lg mb-5">
          <Activity className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Anamoria</h1>
        <p className="text-gray-500 text-base">Medical memory, made visible.</p>
      </div>

      {/* Role cards */}
      <div className="flex flex-col sm:flex-row gap-5 w-full max-w-2xl">
        {/* Patient */}
        <button
          onClick={() => choose('patient')}
          className="group flex-1 bg-white border border-gray-200 rounded-2xl p-7 text-left hover:border-teal-300 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2"
        >
          <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-teal-100 transition-colors">
            <User className="w-5 h-5 text-teal-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1.5">Continue as Patient</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-5">
            Track symptoms, upload records, and view your medical timeline in one place.
          </p>
          <div className="flex items-center gap-1.5 text-teal-600 text-sm font-medium group-hover:gap-2.5 transition-all">
            Open patient portal <ArrowRight className="w-4 h-4" />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-medium mb-1.5">Demo account</p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs">LH</div>
              <span className="text-xs text-gray-600">Layla Hassan · Asthma, Eczema</span>
            </div>
          </div>
        </button>

        {/* Physician */}
        <button
          onClick={() => choose('physician')}
          className="group flex-1 bg-white border border-gray-200 rounded-2xl p-7 text-left hover:border-slate-400 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        >
          <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-slate-200 transition-colors">
            <Stethoscope className="w-5 h-5 text-slate-700" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1.5">Continue as Physician</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-5">
            Review patient timelines, verify information, and add visit context after appointments.
          </p>
          <div className="flex items-center gap-1.5 text-slate-700 text-sm font-medium group-hover:gap-2.5 transition-all">
            Open physician portal <ArrowRight className="w-4 h-4" />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-medium mb-1.5">Demo account</p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-xs">AK</div>
              <span className="text-xs text-gray-600">Dr. Amir Khan · Dermatology</span>
            </div>
          </div>
        </button>
      </div>

      {/* Trust note */}
      <div className="mt-10 flex items-center gap-2 text-xs text-gray-400">
        <ShieldCheck className="w-4 h-4 text-teal-400" />
        <span>No account needed · Demo data only · Nothing is stored externally</span>
      </div>
    </div>
  );
}
