import { FileOutput, CheckCircle, Calendar, User, Stethoscope, FileText } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface ReferralForm {
  recipient: string;
  specialty: string;
  reason: string;
  timelineFrom: string;
  timelineTo: string;
  includeFamilyHistory: boolean;
  includePhysicianNotes: boolean;
  includeDocuments: boolean;
  urgency: 'ROUTINE' | 'URGENT' | 'EMERGENT';
}

export default function ReferralPacket() {
  const { patient, timelineNodes } = useApp();
  const [form, setForm] = useState<ReferralForm>({
    recipient: '',
    specialty: 'Pulmonology',
    reason: 'Exercise-induced dyspnoea — possible exercise-induced bronchoconstriction or inadequately controlled asthma. Requires spirometry, bronchoprovocation testing, and specialist assessment.',
    timelineFrom: '2018-01-01',
    timelineTo: new Date().toISOString().split('T')[0],
    includeFamilyHistory: true,
    includePhysicianNotes: true,
    includeDocuments: true,
    urgency: 'ROUTINE',
  });
  const [generated, setGenerated] = useState(false);

  const includedNodes = timelineNodes.filter((n) => {
    const d = new Date(n.eventDate);
    return d >= new Date(form.timelineFrom) && d <= new Date(form.timelineTo);
  });

  function handleGenerate() {
    setGenerated(true);
  }

  const urgencyColors = {
    ROUTINE: 'bg-green-100 text-green-700',
    URGENT: 'bg-amber-100 text-amber-700',
    EMERGENT: 'bg-red-100 text-red-700',
  };

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full scrollbar-thin">
      <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
        <p className="text-xs text-purple-800">
          <strong>Referral Packet:</strong> Generate a structured referral summary for another clinician. Only information you select will be included. Physician-verified information is clearly labelled.
        </p>
      </div>

      {!generated ? (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Recipient physician / clinic</label>
            <input
              type="text"
              value={form.recipient}
              onChange={(e) => setForm({ ...form, recipient: e.target.value })}
              placeholder="e.g. Dr. Marco Vasquez, Toronto Lung & Respiratory Associates"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Specialty</label>
              <select
                value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                {['Pulmonology', 'Allergy & Immunology', 'Rheumatology', 'Gastroenterology', 'Neurology', 'Other'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Urgency</label>
              <select
                value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: e.target.value as ReferralForm['urgency'] })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent (within 2 weeks)</option>
                <option value="EMERGENT">Emergent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Reason for referral</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Timeline from</label>
              <input
                type="date"
                value={form.timelineFrom}
                onChange={(e) => setForm({ ...form, timelineFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Timeline to</label>
              <input
                type="date"
                value={form.timelineTo}
                onChange={(e) => setForm({ ...form, timelineTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">Includes {includedNodes.length} timeline events</p>

          <div className="space-y-2">
            {[
              { key: 'includeFamilyHistory', label: 'Include family history' },
              { key: 'includePhysicianNotes', label: 'Include physician notes' },
              { key: 'includeDocuments', label: 'Reference uploaded documents' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[key as keyof ReferralForm] as boolean}
                  onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-400"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors"
          >
            <FileOutput className="w-4 h-4" />
            Generate Referral Packet
          </button>
        </div>
      ) : (
        /* Generated referral preview */
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Referral packet generated</span>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden">
            {/* Referral header */}
            <div className="bg-slate-800 text-white px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Anamoria Referral Packet</p>
                  <h3 className="text-lg font-bold mt-0.5">Medical Referral Summary</h3>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Generated</p>
                  <p className="text-sm font-medium">{new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${urgencyColors[form.urgency]}`}>
                    {form.urgency}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* From / To */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Stethoscope className="w-3.5 h-3.5 text-purple-500" />
                    <span className="text-xs font-semibold text-gray-500">FROM</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Dr. Aisha Khan</p>
                  <p className="text-xs text-gray-500">Dermatology</p>
                  <p className="text-xs text-gray-400">Riverside Medical Centre</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-semibold text-gray-500">TO</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{form.recipient || form.specialty + ' Specialist'}</p>
                  <p className="text-xs text-gray-500">{form.specialty}</p>
                </div>
              </div>

              {/* Patient */}
              <div className="border border-gray-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">PATIENT</p>
                <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                <p className="text-xs text-gray-500">DOB: {patient.dateOfBirth} · {patient.gender} · Blood type: {patient.bloodType}</p>
              </div>

              {/* Reason */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">REASON FOR REFERRAL</p>
                <p className="text-sm text-gray-800 bg-blue-50 rounded-xl p-3 leading-relaxed">{form.reason}</p>
              </div>

              {/* Active conditions */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">ACTIVE CONDITIONS</p>
                <div className="flex flex-wrap gap-1.5">
                  {patient.conditions.map((c, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">{c.name}</span>
                  ))}
                </div>
              </div>

              {/* Current medications */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">CURRENT MEDICATIONS</p>
                <div className="space-y-1">
                  {patient.medications.filter(m => m.status !== 'DISCONTINUED').map((m, i) => (
                    <div key={i} className="text-xs text-gray-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                      {m.name} {m.dose} — {m.frequency}
                    </div>
                  ))}
                </div>
              </div>

              {/* Allergies */}
              <div className="bg-red-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-red-600 mb-1.5">⚠️ ALLERGIES</p>
                {patient.allergies.map((a, i) => (
                  <p key={i} className="text-xs text-red-700">{a.allergen} ({a.severity}) — {a.reaction}</p>
                ))}
              </div>

              {/* Timeline snapshot */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">
                  TIMELINE SNAPSHOT ({includedNodes.length} events)
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin">
                  {includedNodes.slice(-8).map((n) => (
                    <div key={n.nodeId} className="flex items-start gap-2 text-xs">
                      <span className="text-gray-400 flex-shrink-0 tabular-nums">{new Date(n.eventDate).getFullYear()}</span>
                      <span className="text-gray-700">{n.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Documents */}
              {form.includeDocuments && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">REFERENCED DOCUMENTS</p>
                  <div className="space-y-1">
                    {patient.uploadedDocuments.map((d) => (
                      <div key={d.docId} className="flex items-center gap-2 text-xs text-blue-600">
                        <FileText className="w-3 h-3" />
                        {d.fileName}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Physician notes count */}
              {form.includePhysicianNotes && (
                <div className="bg-purple-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-purple-700 mb-1">PHYSICIAN NOTES INCLUDED</p>
                  <p className="text-xs text-purple-600">
                    {timelineNodes.reduce((acc, n) => acc + n.physicianNotes.length, 0)} clinical note(s) from Dr. Aisha Khan (Dermatology)
                  </p>
                </div>
              )}

              {/* Disclaimer */}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-400 leading-relaxed">
                  This referral packet was generated by Anamoria and includes patient-reported, document-extracted, and physician-verified information. Source labels are attached to all timeline entries. This document does not replace a formal clinical referral letter.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setGenerated(false)}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Edit Referral
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 transition-colors"
            >
              <FileOutput className="w-4 h-4" />
              Export PDF (demo)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
