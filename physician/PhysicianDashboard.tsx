import { useState } from 'react';
import { LayoutDashboard, Clock, AlertCircle, GitBranch, FileOutput, Lock, ChevronLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import PatientSummary from './PatientSummary';
import MissingInfoPanel from './MissingInfoPanel';
import FamilyTree from './FamilyTree';
import ReferralPacket from './ReferralPacket';
import PhysicianPatientList from './PhysicianPatientList';
import type { PatientStub } from './PhysicianPatientList';
import { mockPatientList } from './PhysicianPatientList';
import Timeline from '../shared/Timeline';
import NodeDetailPanel from '../shared/NodeDetailPanel';
import { mockPhysician } from '../../data/mockData';

const tabs = [
  { id: 'summary',  label: 'Summary',      icon: LayoutDashboard },
  { id: 'timeline', label: 'Timeline',     icon: Clock           },
  { id: 'missing',  label: 'Missing Info', icon: AlertCircle     },
  { id: 'family',   label: 'Family Tree',  icon: GitBranch       },
  { id: 'referral', label: 'Referral',     icon: FileOutput      },
];

export default function PhysicianDashboard() {
  const { activePhysicianTab, setActivePhysicianTab, selectedNodeId, patient, missingInfo } = useApp();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const approved = patient.accessRequests.find(
    (r) => r.physicianId === mockPhysician.physicianId && r.status === 'APPROVED'
  );
  const openMissing = missingInfo.filter((m) => m.status !== 'RESOLVED').length;

  // No patient selected — show patient list
  if (!selectedPatientId) {
    return <PhysicianPatientList onSelectPatient={setSelectedPatientId} />;
  }

  const selectedPatient = mockPatientList.find((p) => p.id === selectedPatientId) as PatientStub;

  // Non-Layla patient — stub view
  if (!selectedPatient.hasFullRecord) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex items-center gap-3">
          <button
            onClick={() => setSelectedPatientId(null)}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Patients
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <span className="font-semibold text-gray-900">{selectedPatient.name}</span>
          <span className="text-xs text-gray-400">{selectedPatient.mrn}</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-10 gap-4">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
            <Lock className="w-6 h-6 text-gray-300" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-700">Full record not available in demo</h2>
            <p className="text-sm text-gray-400 mt-2 max-w-sm leading-relaxed">
              Only Layla Hassan has full mock data in this prototype. In production, each patient's complete Anamoria record would appear here.
            </p>
          </div>
          <button
            onClick={() => setSelectedPatientId('layla-hassan')}
            className="mt-2 px-4 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-700 transition-colors"
          >
            View Layla Hassan's record instead
          </button>
        </div>
      </div>
    );
  }

  // Full record — Layla's dashboard
  if (!approved) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex items-center gap-3">
          <button
            onClick={() => setSelectedPatientId(null)}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Patients
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <span className="font-semibold text-gray-900">{patient.name}</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-10 gap-4">
          <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center">
            <Lock className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-700">Access pending</h2>
            <p className="text-sm text-gray-400 mt-2 max-w-sm leading-relaxed">
              Dr. Aisha Khan's request is waiting for Layla Hassan to approve it. Sign in as the patient and approve access under the Access tab.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Patient breadcrumb + tabs */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-5 py-3 flex items-center gap-3 border-b border-gray-100">
          <button
            onClick={() => setSelectedPatientId(null)}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Patients
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <span className="font-semibold text-gray-900 text-sm">{patient.name}</span>
          <span className="text-xs text-gray-400">{patient.dateOfBirth} · {patient.bloodType}</span>
          <span className="ml-auto text-xs text-gray-400 italic">Physician-verified items are labelled. Treat unverified data with clinical caution.</span>
        </div>

        <div className="px-5 flex gap-0 overflow-x-auto scrollbar-thin">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActivePhysicianTab(id)}
              className={`relative flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 border-b-2 ${
                activePhysicianTab === id
                  ? 'border-slate-800 text-slate-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {id === 'missing' && openMissing > 0 && (
                <span className="px-1.5 py-0.5 bg-amber-400 text-white text-xs rounded-full font-bold leading-none">
                  {openMissing}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {activePhysicianTab === 'timeline' ? (
          <>
            <div className={`${selectedNodeId ? 'w-[58%]' : 'w-full'} h-full overflow-hidden flex flex-col transition-all`}>
              <Timeline showFilters={true} />
            </div>
            {selectedNodeId && (
              <div className="w-[42%] h-full overflow-hidden border-l border-gray-200">
                <NodeDetailPanel />
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 min-w-0 h-full overflow-hidden bg-white">
            {activePhysicianTab === 'summary'  && <PatientSummary />}
            {activePhysicianTab === 'missing'  && <MissingInfoPanel />}
            {activePhysicianTab === 'family'   && <FamilyTree />}
            {activePhysicianTab === 'referral' && <ReferralPacket />}
          </div>
        )}
      </div>
    </div>
  );
}
