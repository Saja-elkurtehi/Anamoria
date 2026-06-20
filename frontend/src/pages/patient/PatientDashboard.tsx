import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, Pill, AlertTriangle, Users, Stethoscope, ChevronRight,
  Plus, Send, FileText, CheckCircle, Clock, Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { demoPatient, DEMO_PATIENT_ID } from '../../data/mockData';
import type { TimelineNode, ChatMessage } from '../../types';
import TimelineView from '../../components/timeline/TimelineView';

// ─── Add Symptom Form ─────────────────────────────────────────────────────────

interface SymptomFormState {
  name: string;
  startDate: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  frequency: string;
  triggers: string;
  notes: string;
  status: 'ONGOING' | 'RESOLVED' | 'INTERMITTENT' | 'UNKNOWN';
  doctorReviewed: boolean;
}

const defaultForm: SymptomFormState = {
  name: '',
  startDate: new Date().toISOString().split('T')[0],
  severity: 'MILD',
  frequency: '',
  triggers: '',
  notes: '',
  status: 'ONGOING',
  doctorReviewed: false,
};

function AddSymptomForm() {
  const { addTimelineNode } = useApp();
  const [form, setForm] = useState<SymptomFormState>(defaultForm);
  const [added, setAdded] = useState(false);

  function set(field: keyof SymptomFormState, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    const now = new Date().toISOString();
    const node: TimelineNode = {
      nodeId: `node-sym-${Date.now()}`,
      patientId: DEMO_PATIENT_ID,
      type: 'PATIENT_SYMPTOM',
      title: form.name.trim(),
      summary: `Patient-reported symptom. Severity: ${form.severity}. Status: ${form.status}.${form.triggers ? ` Triggers: ${form.triggers}.` : ''}`,
      eventDate: form.startDate,
      datePrecision: 'EXACT',
      sourceType: 'PATIENT_REPORTED',
      verificationStatus: 'NEEDS_REVIEW',
      confidenceLevel: 'LOW',
      contributorName: demoPatient.name,
      contributorRole: 'PATIENT',
      relatedDocumentIds: [],
      relatedNodeIds: [],
      tags: ['patient-reported', 'symptom'],
      details: {
        symptomName: form.name.trim(),
        onsetDate: form.startDate,
        severity: form.severity,
        frequency: form.frequency,
        duration: '',
        status: form.status,
        description: '',
        triggers: form.triggers,
        relievingFactors: '',
        associatedSymptoms: [],
        patientNotes: form.notes,
        doctorReviewed: form.doctorReviewed,
        clarificationNeeded: true,
      },
      physicianNotes: [],
      createdAt: now,
      updatedAt: now,
    };

    addTimelineNode(node);
    setForm(defaultForm);
    setAdded(true);
    setTimeout(() => setAdded(false), 4000);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Plus className="w-4 h-4 text-teal-600" />
        <h3 className="font-semibold text-gray-900 text-sm">Add symptom</h3>
      </div>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Symptom name *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. Shortness of breath after exercise"
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-300"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Start date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={e => set('startDate', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Severity</label>
            <select
              value={form.severity}
              onChange={e => set('severity', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
            >
              <option value="MILD">Mild</option>
              <option value="MODERATE">Moderate</option>
              <option value="SEVERE">Severe</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Frequency</label>
            <input
              type="text"
              value={form.frequency}
              onChange={e => set('frequency', e.target.value)}
              placeholder="e.g. Daily, twice a week"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select
              value={form.status}
              onChange={e => set('status', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
            >
              <option value="ONGOING">Ongoing</option>
              <option value="INTERMITTENT">Intermittent</option>
              <option value="RESOLVED">Resolved</option>
              <option value="UNKNOWN">Unknown</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Triggers</label>
          <input
            type="text"
            value={form.triggers}
            onChange={e => set('triggers', e.target.value)}
            placeholder="e.g. Exercise, cold air, stress"
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-300"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Any additional details…"
            rows={2}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-teal-300"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.doctorReviewed}
            onChange={e => set('doctorReviewed', e.target.checked)}
            className="rounded text-teal-600"
          />
          <span className="text-sm text-gray-600">A doctor has already reviewed this symptom</span>
        </label>

        {added && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <p className="text-sm text-green-700 font-medium">Symptom added to your timeline.</p>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-teal-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-teal-700 transition-colors"
        >
          Add to timeline
        </button>
      </form>
    </div>
  );
}

// ─── Mini chatbot ─────────────────────────────────────────────────────────────

const CANNED: Record<string, string[]> = {
  default: [
    "When did this symptom start?",
    "How often does it happen? (e.g., daily, twice a week)",
    "Has a doctor reviewed this before?",
    "Do you have any related documents, such as test results or a referral letter?",
  ],
  done: ["Got it — I've noted that. Is there anything else you'd like to add?"],
};

function MiniChatbot() {
  const { state, addChatMessage } = useApp();
  const [input, setInput] = useState('');
  const [step, setStep] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  function send() {
    if (!input.trim()) return;
    const now = new Date().toISOString();
    const userMsg: ChatMessage = {
      id: `cm-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: now,
    };
    addChatMessage(userMsg);
    setInput('');

    setTimeout(() => {
      const responses = CANNED.default;
      const reply: ChatMessage = {
        id: `cm-${Date.now() + 1}`,
        role: 'assistant',
        content: responses[step] ?? CANNED.done[0],
        timestamp: new Date().toISOString(),
      };
      addChatMessage(reply);
      setStep(s => s + 1);
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 600);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col h-[340px]">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-sm">Intake Assistant</h3>
        <p className="text-xs text-gray-400 mt-0.5">Organizes information only — does not diagnose or advise</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {state.chatMessages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-teal-600 text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-800 rounded-bl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="p-3 border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Type your response…"
          className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-300"
        />
        <button
          onClick={send}
          disabled={!input.trim()}
          className="bg-teal-600 text-white px-3.5 py-2 rounded-xl hover:bg-teal-700 disabled:opacity-40 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Patient Dashboard ────────────────────────────────────────────────────────

export default function PatientDashboard() {
  const { state } = useApp();
  const accessApproved = state.accessRequests.filter(r => r.status === 'APPROVED');
  const pendingAccess = state.accessRequests.filter(r => r.status === 'PENDING');
  const recentNodes = [...state.timelineNodes]
    .sort((a, b) => b.eventDate.localeCompare(a.eventDate))
    .slice(0, 4);
  const recentDocs = state.documents.slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Page title */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">My Health Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">Last updated {demoPatient.lastUpdated}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Health snapshot */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Heart className="w-4 h-4 text-teal-600" />
              <h2 className="font-semibold text-gray-900 text-sm">My health snapshot</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
              {/* Left panel */}
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Active conditions</p>
                  <div className="flex flex-wrap gap-2">
                    {demoPatient.conditions.map(c => (
                      <span key={c} className="bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium px-2.5 py-1 rounded-full">{c}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Allergies</p>
                  <div className="flex flex-wrap gap-2">
                    {demoPatient.allergies.map(a => (
                      <span key={a} className="flex items-center gap-1 bg-red-50 text-red-700 border border-red-100 text-xs font-medium px-2.5 py-1 rounded-full">
                        <AlertTriangle className="w-3 h-3" /> {a}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Medications</p>
                  <ul className="space-y-1.5">
                    {demoPatient.medications.map(m => (
                      <li key={m.name} className="flex items-center gap-2">
                        <Pill className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{m.name}</span>
                        <span className="text-xs text-gray-400">{m.dose}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              {/* Right panel */}
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Family history flags</p>
                  <ul className="space-y-2">
                    {demoPatient.familyHistory.map(f => (
                      <li key={f.relationship} className="flex items-start gap-2">
                        <Users className="w-3.5 h-3.5 text-gray-300 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-medium text-gray-600">{f.relationship}: </span>
                          <span className="text-xs text-gray-500">{f.conditions.join(', ')}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Care team</p>
                  <ul className="space-y-2">
                    {demoPatient.careTeam.map(d => (
                      <li key={d.name} className="flex items-center gap-2">
                        <Stethoscope className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-semibold text-gray-700">{d.name}</span>
                          <span className="text-xs text-gray-400"> · {d.specialty}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5 text-gray-300" />
                    <span>Last appointment: {demoPatient.lastAppointment}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Symptom + chatbot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <AddSymptomForm />
            <MiniChatbot />
          </div>

          {/* Timeline preview */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 text-sm">Recent timeline</h2>
              <Link
                to="/patient/timeline"
                className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
              >
                View full timeline <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="p-5">
              <TimelineView
                nodes={recentNodes}
                role="patient"
                availableFilters={['all']}
                compact={true}
              />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Access status */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">Physician access</h2>
            </div>
            <div className="p-5 space-y-3">
              {accessApproved.map(r => (
                <div key={r.requestId} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.physicianName}</p>
                    <p className="text-xs text-gray-500">{r.specialty} · Access approved</p>
                  </div>
                </div>
              ))}
              {pendingAccess.map(r => (
                <div key={r.requestId} className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.physicianName}</p>
                    <p className="text-xs text-amber-600 font-medium">Access request pending</p>
                    <Link to="/patient/access" className="text-xs text-teal-600 hover:underline">Review →</Link>
                  </div>
                </div>
              ))}
              {accessApproved.length === 0 && pendingAccess.length === 0 && (
                <p className="text-sm text-gray-400">No physician access requests.</p>
              )}
            </div>
          </div>

          {/* Recent documents */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 text-sm">Documents</h2>
              <Link
                to="/patient/documents"
                className="text-xs font-medium text-teal-600 hover:text-teal-700"
              >
                Manage →
              </Link>
            </div>
            <div className="p-5 space-y-3">
              {recentDocs.map(doc => (
                <div key={doc.documentId} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-800 truncate">{doc.fileName}</p>
                    <p className="text-xs text-gray-400">{doc.documentType}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                    doc.extractionStatus === 'EXTRACTED'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {doc.extractionStatus === 'EXTRACTED' ? 'Extracted' : doc.extractionStatus}
                  </span>
                </div>
              ))}
              <Link
                to="/patient/documents"
                className="flex items-center justify-center gap-2 w-full border border-dashed border-gray-200 rounded-xl py-2.5 text-xs text-gray-400 hover:border-teal-300 hover:text-teal-600 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Upload document
              </Link>
            </div>
          </div>

          {/* Safety note */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 leading-relaxed">
              Anamoria organizes your health information. It does not diagnose, treat, or replace your physician's advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
