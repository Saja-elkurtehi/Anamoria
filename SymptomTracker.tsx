import { MessageSquare, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const severityColors = {
  MILD: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  MODERATE: 'text-orange-700 bg-orange-50 border-orange-200',
  SEVERE: 'text-red-700 bg-red-50 border-red-200',
};

const verificationConfig = {
  PHYSICIAN_VERIFIED: { label: 'Physician verified', icon: CheckCircle, color: 'text-green-600' },
  CONFIRMED_BY_EMR: { label: 'EMR confirmed', icon: CheckCircle, color: 'text-blue-600' },
  NEEDS_REVIEW: { label: 'Needs review', icon: Clock, color: 'text-amber-500' },
  PATIENT_REPORTED: { label: 'Patient-reported', icon: Clock, color: 'text-gray-400' },
  FLAGGED: { label: 'Flagged', icon: AlertCircle, color: 'text-red-500' },
  CLARIFICATION_REQUESTED: { label: 'Clarification requested', icon: AlertCircle, color: 'text-sky-500' },
};

export default function SymptomTracker() {
  const { patient, setActivePatientTab } = useApp();

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full scrollbar-thin">

      {/* Empty or populated */}
      {patient.symptoms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-gray-300" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">No symptoms recorded yet</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              Use the Assistant to describe what you're experiencing and it will add symptoms to your record here.
            </p>
          </div>
          <button
            onClick={() => setActivePatientTab('assistant')}
            className="mt-2 px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors"
          >
            Open Assistant
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              {patient.symptoms.length} symptom{patient.symptoms.length !== 1 ? 's' : ''} on record
            </h3>
            <button
              onClick={() => setActivePatientTab('assistant')}
              className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-800 font-medium transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Add via Assistant
            </button>
          </div>

          <div className="space-y-2">
            {patient.symptoms.map((s) => {
              const verCfg = verificationConfig[s.verificationStatus] ?? verificationConfig['PATIENT_REPORTED'];
              const VerIcon = verCfg.icon;

              return (
                <div key={s.symptomId} className="bg-white border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900">{s.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${severityColors[s.severity]}`}>
                          {s.severity.toLowerCase()}
                        </span>
                        <span className={`text-xs rounded-full font-medium ${s.ongoing ? 'text-red-500' : 'text-gray-400'}`}>
                          {s.ongoing ? 'Ongoing' : 'Resolved'}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 mt-1">
                        Since {s.startDate}
                        {s.frequency && s.frequency !== 'As reported via assistant' && ` · ${s.frequency}`}
                      </p>

                      {s.notes && (
                        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{s.notes}</p>
                      )}

                      {s.triggers && (
                        <p className="text-xs text-gray-400 mt-1">
                          <span className="text-gray-500">Triggers:</span> {s.triggers}
                        </p>
                      )}
                    </div>

                    <div className={`flex items-center gap-1 text-xs font-medium flex-shrink-0 ${verCfg.color}`}>
                      <VerIcon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{verCfg.label}</span>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2.5 border-t border-gray-50 flex items-center gap-3 text-xs text-gray-400">
                    {s.doctorReviewed && <span className="text-green-600">Doctor reviewed</span>}
                    {s.hasDocuments && <span className="text-blue-500">Has documents</span>}
                    <span>Source: {s.verificationStatus === 'NEEDS_REVIEW' ? 'Reported via assistant' : 'Patient intake'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
