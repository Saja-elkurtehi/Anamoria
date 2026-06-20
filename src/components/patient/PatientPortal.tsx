import { Clock, User, Activity, Upload, MessageSquare, Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import PatientProfile from './PatientProfile';
import DocumentUpload from './DocumentUpload';
import IntakeChatbot from './IntakeChatbot';
import SymptomTracker from './SymptomTracker';
import PhysicianAccessRequest from './PhysicianAccessRequest';
import Timeline from '../shared/Timeline';
import NodeDetailPanel from '../shared/NodeDetailPanel';

const tabs = [
  { id: 'timeline',  label: 'Timeline',   icon: Clock         },
  { id: 'profile',   label: 'Profile',    icon: User          },
  { id: 'symptoms',  label: 'Symptoms',   icon: Activity      },
  { id: 'upload',    label: 'Records',    icon: Upload        },
  { id: 'assistant', label: 'Assistant',  icon: MessageSquare },
  { id: 'access',    label: 'Access',     icon: Shield        },
];

export default function PatientPortal() {
  const { activePatientTab, setActivePatientTab, selectedNodeId, patient } = useApp();
  const pendingCount = patient.accessRequests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Tab navigation */}
      <div className="bg-white border-b border-gray-200 px-5 shadow-sm">
        <div className="flex gap-0 overflow-x-auto scrollbar-thin">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActivePatientTab(id)}
              className={`relative flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 border-b-2 ${
                activePatientTab === id
                  ? 'border-teal-500 text-teal-700'
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {id === 'access' && pendingCount > 0 && (
                <span className="w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {activePatientTab === 'timeline' ? (
          <>
            <div className={`${selectedNodeId ? 'w-[58%]' : 'w-full'} h-full overflow-hidden flex flex-col transition-all`}>
              <Timeline showFilters={false} />
            </div>
            {selectedNodeId && (
              <div className="w-[42%] h-full overflow-hidden border-l border-gray-200">
                <NodeDetailPanel />
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 min-w-0 h-full overflow-hidden">
            {activePatientTab === 'profile'   && <PatientProfile />}
            {activePatientTab === 'symptoms'  && <SymptomTracker />}
            {activePatientTab === 'upload'    && <DocumentUpload />}
            {activePatientTab === 'assistant' && <IntakeChatbot />}
            {activePatientTab === 'access'    && <PhysicianAccessRequest />}
          </div>
        )}
      </div>
    </div>
  );
}
