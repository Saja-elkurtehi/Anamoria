import { useNavigate } from 'react-router-dom';
import {
  Users, AlertTriangle, FileText, Clock, CheckCircle, ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function PhysicianList() {
  const navigate = useNavigate();
  const { state } = useApp();
  const patients = state.patientList;

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-sm text-gray-400">Loading patients…</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">Patients</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {patients.length} patients · Sorted by most recent activity
        </p>
      </div>

      <div className="space-y-3">
        {patients.map(patient => {
          const hasNew = patient.newSymptomsSince > 0 || patient.newDocumentsSince > 0;
          const needsReview = patient.needsReviewCount > 0;

          return (
            <div
              key={patient.patientId}
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer group"
              onClick={() => navigate(`/physician/patients/${patient.patientId}`)}
            >
              <div className="flex items-center gap-5">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-base flex-shrink-0">
                  {patient.name.split(' ').map(n => n[0]).join('')}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{patient.name}</p>
                    <span className="text-sm text-gray-400">{patient.age} y/o</span>
                    {needsReview && (
                      <span className="flex items-center gap-1 text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" /> {patient.needsReviewCount} needs review
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <p className="text-sm text-gray-500">
                      {patient.conditions.join(', ')}
                    </p>
                    {patient.allergies.length > 0 && (
                      <span className="text-xs text-red-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {patient.allergies.join(', ')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Last visit: {patient.lastAppointment}
                    </span>
                    {patient.newSymptomsSince > 0 && (
                      <span className="text-amber-600 font-medium">
                        {patient.newSymptomsSince} new symptom{patient.newSymptomsSince > 1 ? 's' : ''}
                      </span>
                    )}
                    {patient.newDocumentsSince > 0 && (
                      <span className="text-blue-600 font-medium flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> {patient.newDocumentsSince} new doc{patient.newDocumentsSince > 1 ? 's' : ''}
                      </span>
                    )}
                    {!hasNew && patient.needsReviewCount === 0 && (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> No new updates
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" />
              </div>

              {/* "New since last visit" strip */}
              {hasNew && (
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="font-medium text-gray-600">Since last visit:</span>
                  {patient.newSymptomsSince > 0 && (
                    <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100">
                      {patient.newSymptomsSince} symptom{patient.newSymptomsSince > 1 ? 's' : ''}
                    </span>
                  )}
                  {patient.newDocumentsSince > 0 && (
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                      {patient.newDocumentsSince} document{patient.newDocumentsSince > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center gap-2 text-xs text-gray-400">
        <Users className="w-4 h-4" />
        <span>Only patients who have approved your access are shown.</span>
      </div>
    </div>
  );
}
