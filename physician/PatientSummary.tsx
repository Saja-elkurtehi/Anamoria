import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function PatientSummary() {
  const { patient, timelineNodes } = useApp();

  const activeConditions = patient.conditions.filter((c) => c.status === 'ACTIVE' || c.status === 'MANAGED');
  const activeMeds = patient.medications.filter((m) => m.status === 'ACTIVE' || m.status === 'AS_NEEDED');
  const severeAllergies = patient.allergies.filter((a) => a.severity === 'SEVERE');
  const unverified = timelineNodes.filter(
    (n) => n.verificationStatus === 'NEEDS_REVIEW' || n.verificationStatus === 'PATIENT_REPORTED'
  );
  const lastUpdated = new Date(
    Math.max(...timelineNodes.map((n) => new Date(n.eventDate).getTime()))
  ).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="overflow-y-auto h-full scrollbar-thin divide-y divide-gray-100">

      {/* Patient header */}
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              LH
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{patient.name}</h2>
              <p className="text-xs text-gray-400">{patient.dateOfBirth} · {patient.gender} · {patient.bloodType}</p>
              <p className="text-xs text-gray-400">{patient.primaryPhysician}</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-gray-400">Last updated</p>
            <p className="text-xs font-medium text-gray-600">{lastUpdated}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { value: activeConditions.length, label: 'Conditions' },
            { value: activeMeds.length,       label: 'Medications' },
            { value: unverified.length,       label: 'Need review', warn: unverified.length > 0 },
          ].map(({ value, label, warn }) => (
            <div key={label} className={`rounded-lg border px-3 py-2.5 text-center ${warn ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-gray-50'}`}>
              <p className={`text-xl font-semibold ${warn ? 'text-amber-700' : 'text-gray-800'}`}>{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Severe allergies */}
      {severeAllergies.length > 0 && (
        <div className="px-5 py-4">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <h3 className="text-xs font-semibold text-red-600 uppercase tracking-wider">Severe Allergies</h3>
          </div>
          {severeAllergies.map((a, i) => (
            <div key={i} className="text-sm text-red-700 font-medium">
              {a.allergen} — <span className="font-normal text-red-600">{a.reaction}</span>
            </div>
          ))}
        </div>
      )}

      {/* Continuity summary */}
      <div className="px-5 py-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Continuity Summary</h3>
        <p className="text-sm text-gray-700 leading-relaxed">
          Layla Hassan, 28, has a history of asthma since 2018, managed with inhaled corticosteroids (Fluticasone) and a rescue bronchodilator (Salbutamol). Atopic dermatitis diagnosed in 2021, currently under dermatology care with Mometasone cream. Severe shellfish allergy with documented anaphylaxis in 2020 — EpiPen prescribed. Elevated total IgE and mild eosinophilia on 2024 labs. Two patient-reported symptoms added in late 2025–2026 (<em>exercise-induced dyspnoea, worsening hand eczema</em>) — <strong>not yet physician-verified</strong>. Strong maternal family history of atopic and autoimmune disease.
        </p>
      </div>

      {/* Active conditions */}
      <div className="px-5 py-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Active Conditions</h3>
        <div className="space-y-2">
          {patient.conditions.map((c, i) => (
            <div key={i} className="flex items-center gap-2.5">
              {c.verificationStatus === 'PHYSICIAN_VERIFIED' || c.verificationStatus === 'CONFIRMED_BY_EMR'
                ? <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                : <Clock className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />}
              <span className="text-sm text-gray-800 flex-1">{c.name}</span>
              {c.icdCode && <span className="text-xs text-gray-400 font-mono">{c.icdCode}</span>}
              <span className={`text-xs border rounded px-1.5 py-0.5 font-medium ${
                c.status === 'ACTIVE'   ? 'bg-red-50   text-red-600   border-red-200'  :
                c.status === 'MANAGED'  ? 'bg-teal-50  text-teal-700  border-teal-200' :
                                          'bg-gray-50  text-gray-400  border-gray-200'
              }`}>{c.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Medications */}
      <div className="px-5 py-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Current Medications</h3>
        <div className="space-y-2">
          {patient.medications.map((m, i) => (
            <div key={i} className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm text-gray-800">{m.name}</p>
                <p className="text-xs text-gray-400">{m.dose} · {m.frequency}</p>
              </div>
              <span className={`text-xs border rounded px-1.5 py-0.5 font-medium flex-shrink-0 ${
                m.status === 'ACTIVE'    ? 'bg-green-50 text-green-700 border-green-200' :
                m.status === 'AS_NEEDED' ? 'bg-blue-50  text-blue-700  border-blue-200'  :
                                           'bg-gray-50  text-gray-400  border-gray-200'
              }`}>{m.status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reminder */}
      <div className="px-5 py-4">
        <p className="text-xs text-gray-400 leading-relaxed">
          This platform combines patient-reported data, uploaded documents, and EMR records.
          Physician-verified entries are labelled. Do not use unverified items for clinical decisions without independent confirmation.
        </p>
      </div>
    </div>
  );
}
