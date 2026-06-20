import { Search, ChevronRight, AlertTriangle, Clock, Activity, Users } from 'lucide-react';
import { useState } from 'react';

export interface PatientStub {
  id: string;
  name: string;
  dob: string;
  age: number;
  mrn: string;
  conditions: string[];
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  lastVisit: string;
  unverifiedCount: number;
  hasFullRecord: boolean;
  initials: string;
}

export const mockPatientList: PatientStub[] = [
  {
    id: 'layla-hassan',
    name: 'Layla Hassan',
    dob: 'March 12, 1998',
    age: 28,
    mrn: 'MRN-2024-001',
    conditions: ['Asthma', 'Atopic Dermatitis', 'Shellfish Allergy'],
    riskLevel: 'medium',
    lastVisit: 'June 2, 2026',
    unverifiedCount: 4,
    hasFullRecord: true,
    initials: 'LH',
  },
  {
    id: 'amira-osei',
    name: 'Amira Osei',
    dob: 'February 14, 1957',
    age: 67,
    mrn: 'MRN-2024-003',
    conditions: ['COPD', 'Heart Failure', 'Atrial Fibrillation'],
    riskLevel: 'critical',
    lastVisit: 'June 10, 2026',
    unverifiedCount: 7,
    hasFullRecord: false,
    initials: 'AO',
  },
  {
    id: 'marcus-chen',
    name: 'Marcus Chen',
    dob: 'August 3, 1979',
    age: 45,
    mrn: 'MRN-2024-002',
    conditions: ['Hypertension', 'Type 2 Diabetes', 'Obesity'],
    riskLevel: 'high',
    lastVisit: 'May 28, 2026',
    unverifiedCount: 2,
    hasFullRecord: false,
    initials: 'MC',
  },
  {
    id: 'sarah-obrien',
    name: "Sarah O'Brien",
    dob: 'November 27, 1993',
    age: 32,
    mrn: 'MRN-2024-004',
    conditions: ['Lupus (SLE)', 'Chronic Fatigue Syndrome', 'Raynaud\'s Phenomenon'],
    riskLevel: 'medium',
    lastVisit: 'April 15, 2026',
    unverifiedCount: 5,
    hasFullRecord: false,
    initials: 'SO',
  },
];

const riskConfig = {
  critical: { label: 'Critical', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  high:     { label: 'High',     bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-400' },
  medium:   { label: 'Medium',   bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400' },
  low:      { label: 'Low',      bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-400' },
};

const avatarColors = ['bg-slate-600', 'bg-teal-600', 'bg-violet-600', 'bg-rose-600'];

interface Props {
  onSelectPatient: (id: string) => void;
}

export default function PhysicianPatientList({ onSelectPatient }: Props) {
  const [query, setQuery] = useState('');

  const filtered = mockPatientList.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.mrn.toLowerCase().includes(query.toLowerCase()) ||
    p.conditions.some((c) => c.toLowerCase().includes(query.toLowerCase()))
  );

  const criticalCount = mockPatientList.filter((p) => p.riskLevel === 'critical' || p.riskLevel === 'high').length;
  const pendingReview = mockPatientList.reduce((acc, p) => acc + p.unverifiedCount, 0);

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">My Patients</h1>
            <p className="text-sm text-gray-400 mt-0.5">Riverside Medical Centre · Dr. Aisha Khan, Dermatology</p>
          </div>
          <div className="flex items-center gap-3">
            <Stat icon={Users} value={mockPatientList.length} label="Total" color="text-gray-600" />
            <Stat icon={AlertTriangle} value={criticalCount} label="High risk" color="text-orange-500" />
            <Stat icon={Clock} value={pendingReview} label="Pending review" color="text-amber-500" />
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, MRN, or condition…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 transition-colors"
          />
        </div>
      </div>

      {/* Patient list */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-2">
          {filtered.map((patient, i) => {
            const risk = riskConfig[patient.riskLevel];
            return (
              <button
                key={patient.id}
                onClick={() => onSelectPatient(patient.id)}
                className="w-full text-left bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-px transition-all duration-150 p-4"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                    {patient.initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{patient.name}</span>
                      <span className="text-xs text-gray-400">{patient.mrn}</span>
                      {!patient.hasFullRecord && (
                        <span className="text-xs text-gray-300 italic">Demo data limited</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">DOB {patient.dob} · Age {patient.age}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {patient.conditions.map((c) => (
                        <span key={c} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5">{c}</span>
                      ))}
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${risk.bg} ${risk.text} ${risk.border}`}>
                      {risk.label} risk
                    </span>
                    {patient.unverifiedCount > 0 && (
                      <span className="text-xs text-amber-600 font-medium">{patient.unverifiedCount} unverified</span>
                    )}
                    <span className="text-xs text-gray-400">Last visit {patient.lastVisit}</span>
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </div>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-sm text-gray-400">No patients found matching "{query}"</div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, value, label, color }: { icon: typeof Activity; value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 min-w-[70px]">
      <Icon className={`w-3.5 h-3.5 mb-1 ${color}`} />
      <span className="text-base font-bold text-gray-800">{value}</span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}
