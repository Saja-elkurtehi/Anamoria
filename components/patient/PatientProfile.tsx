import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function PatientProfile() {
  const { patient } = useApp();

  const verIcon = (status: string) =>
    status === 'PHYSICIAN_VERIFIED' || status === 'CONFIRMED_BY_EMR'
      ? <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
      : <Clock className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />;

  return (
    <div className="overflow-y-auto h-full scrollbar-thin divide-y divide-gray-100">

      {/* Demographics */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            LH
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{patient.name}</h2>
            <p className="text-xs text-gray-400">{patient.dateOfBirth} · {patient.gender} · {patient.bloodType}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <Row label="Primary physician" value={patient.primaryPhysician} />
          <Row label="Phone" value={patient.phone} />
          <Row label="Email" value={patient.email} />
          <Row label="Blood type" value={patient.bloodType} />
        </div>
      </div>

      {/* Allergies */}
      <Section title="Allergies & Adverse Reactions" warning>
        {patient.allergies.map((a, i) => (
          <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
            <span className={`text-xs font-medium px-2 py-0.5 rounded border flex-shrink-0 mt-0.5 ${
              a.severity === 'SEVERE' ? 'bg-red-50 text-red-700 border-red-200' :
              a.severity === 'MODERATE' ? 'bg-orange-50 text-orange-700 border-orange-200' :
              'bg-yellow-50 text-yellow-700 border-yellow-200'
            }`}>{a.severity}</span>
            <div>
              <p className="text-sm font-medium text-gray-900">{a.allergen}</p>
              <p className="text-xs text-gray-500">{a.reaction}</p>
              <p className="text-xs text-gray-400 mt-0.5">{a.confirmedBy}</p>
            </div>
          </div>
        ))}
      </Section>

      {/* Conditions */}
      <Section title="Conditions">
        {patient.conditions.map((c, i) => (
          <div key={i} className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0">
            {verIcon(c.verificationStatus)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-900">{c.name}</span>
                {c.icdCode && <span className="text-xs text-gray-400 font-mono">{c.icdCode}</span>}
                <span className={`text-xs border rounded px-1.5 py-0.5 font-medium ${
                  c.status === 'ACTIVE' ? 'bg-red-50 text-red-600 border-red-200' :
                  c.status === 'MANAGED' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                  'bg-gray-50 text-gray-500 border-gray-200'
                }`}>{c.status}</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Diagnosed {c.diagnosedDate} · {c.diagnosedBy}</p>
            </div>
          </div>
        ))}
      </Section>

      {/* Medications */}
      <Section title="Medications">
        {patient.medications.map((m, i) => (
          <div key={i} className="py-2 border-b border-gray-50 last:border-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-gray-900">{m.name}</p>
                <p className="text-xs text-gray-500">{m.dose} · {m.frequency}</p>
                <p className="text-xs text-gray-400">By {m.prescribedBy} · Since {m.startDate}</p>
              </div>
              <span className={`text-xs border rounded px-1.5 py-0.5 font-medium flex-shrink-0 ${
                m.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' :
                m.status === 'AS_NEEDED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                'bg-gray-50 text-gray-400 border-gray-200'
              }`}>{m.status.replace('_', ' ')}</span>
            </div>
          </div>
        ))}
      </Section>

      {/* Surgeries */}
      <Section title="Surgeries & Procedures">
        {patient.surgeries.map((s, i) => (
          <div key={i} className="py-2 border-b border-gray-50 last:border-0">
            <p className="text-sm font-medium text-gray-900">{s.procedure}</p>
            <p className="text-xs text-gray-500">{s.date} · {s.hospital}</p>
            {s.surgeon && <p className="text-xs text-gray-400">Surgeon: {s.surgeon}</p>}
            <p className="text-xs text-gray-500 mt-0.5">Outcome: {s.outcome}</p>
          </div>
        ))}
      </Section>

      {/* Hospital visits */}
      <Section title="Hospital & Urgent Care Visits">
        {patient.hospitalVisits.map((v, i) => (
          <div key={i} className="py-2 border-b border-gray-50 last:border-0">
            <p className="text-xs text-gray-400 mb-0.5">{v.date}</p>
            <p className="text-sm font-medium text-gray-900">{v.reason}</p>
            <p className="text-xs text-gray-500">{v.facility}</p>
            <p className="text-xs text-gray-500 mt-0.5">{v.outcome}</p>
          </div>
        ))}
      </Section>

      {/* Tests & Labs */}
      <Section title="Tests & Labs">
        {patient.testsLabs.map((t, i) => (
          <div key={i} className={`py-2 border-b border-gray-50 last:border-0 ${t.flagged ? 'rounded' : ''}`}>
            <div className="flex items-start gap-2">
              {t.flagged && <AlertTriangle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" />}
              <div>
                <p className="text-sm font-medium text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-400">{t.date} · {t.facility}</p>
                <p className="text-xs text-gray-600 mt-0.5">{t.result}</p>
              </div>
            </div>
          </div>
        ))}
      </Section>

      {/* Imaging */}
      <Section title="Imaging">
        {patient.imaging.map((img, i) => (
          <div key={i} className="py-2 border-b border-gray-50 last:border-0">
            <p className="text-sm font-medium text-gray-900">{img.type}</p>
            <p className="text-xs text-gray-400">{img.date} · {img.facility}</p>
            <p className="text-xs text-gray-600 mt-0.5">{img.findings}</p>
          </div>
        ))}
      </Section>

      {/* Family history */}
      <Section title="Family History">
        {patient.familyHistory.map((r) => (
          <div key={r.relationshipId} className="py-2 border-b border-gray-50 last:border-0">
            <div className="flex items-start gap-2">
              <span className="text-xs text-teal-700 font-medium bg-teal-50 border border-teal-200 px-2 py-0.5 rounded flex-shrink-0">
                {r.relationship}
              </span>
              <div>
                {r.name && <span className="text-sm text-gray-700">{r.name}</span>}
                {r.age && <span className="text-xs text-gray-400 ml-1">age {r.age}</span>}
                {r.conditions.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {r.conditions.map((c, ci) => (
                      <span key={ci} className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">{c}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </Section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm text-gray-700 truncate">{value}</p>
    </div>
  );
}

function Section({ title, warning, children }: { title: string; warning?: boolean; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-2 mb-2">
        {warning && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${warning ? 'text-red-600' : 'text-gray-400'}`}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}
