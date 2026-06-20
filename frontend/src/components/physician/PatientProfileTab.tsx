import {
  User, Heart, Pill, AlertTriangle, Users,
  Phone, Mail, Activity, Shield,
} from 'lucide-react';
import { demoPatient } from '../../data/mockData';

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
        <span className="text-gray-400">{icon}</span>
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{title}</p>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 w-28 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-800 flex-1">{value}</span>
    </div>
  );
}

export default function PatientProfileTab() {
  const p = demoPatient;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl">
      {/* Demographics */}
      <Card title="Demographics" icon={<User className="w-4 h-4" />}>
        <div className="space-y-0.5">
          <Row label="Full name" value={<strong className="font-semibold">{p.name}</strong>} />
          <Row label="Date of birth" value={p.dateOfBirth} />
          <Row label="Age" value={`${p.age} years old`} />
          <Row label="Gender" value={p.gender} />
          <Row label="Blood type" value={p.bloodType || 'Not on file'} />
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="w-3.5 h-3.5 text-gray-400" />
            {p.phone || 'Not on file'}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-3.5 h-3.5 text-gray-400" />
            {p.email || 'Not on file'}
          </div>
        </div>
      </Card>

      {/* Conditions */}
      <Card title="Conditions" icon={<Heart className="w-4 h-4" />}>
        {p.conditions.length === 0 ? (
          <p className="text-sm text-gray-400">No conditions documented.</p>
        ) : (
          <ul className="space-y-2.5">
            {p.conditions.map((c, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <Activity className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-800">{c}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Medications */}
      <Card title="Current Medications" icon={<Pill className="w-4 h-4" />}>
        {p.medications.length === 0 ? (
          <p className="text-sm text-gray-400">No medications documented.</p>
        ) : (
          <ul className="space-y-3">
            {p.medications.map((m, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <Pill className="w-3.5 h-3.5 text-violet-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{m.name}</p>
                  <p className="text-xs text-gray-500">{m.dose} · {m.frequency}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Allergies */}
      <Card title="Allergies" icon={<AlertTriangle className="w-4 h-4 text-red-400" />}>
        {p.allergies.length === 0 ? (
          <p className="text-sm text-gray-400">No allergies documented.</p>
        ) : (
          <ul className="space-y-2.5">
            {p.allergies.map((a, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-semibold text-red-700">{a}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Family history */}
      <Card title="Family History" icon={<Users className="w-4 h-4" />}>
        {p.familyHistory.length === 0 ? (
          <p className="text-sm text-gray-400">No family history documented.</p>
        ) : (
          <ul className="space-y-3">
            {p.familyHistory.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <Users className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">{f.relationship}</p>
                  <p className="text-xs text-gray-500">{f.conditions.join(', ')}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Care team */}
      {p.careTeam && p.careTeam.length > 0 && (
        <Card title="Care Team" icon={<Shield className="w-4 h-4" />}>
          <ul className="space-y-3">
            {p.careTeam.map((ct, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-teal-700">
                  {ct.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{ct.name}</p>
                  <p className="text-xs text-gray-500">{ct.specialty}</p>
                  {ct.clinic && <p className="text-xs text-gray-400">{ct.clinic}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Access & consent */}
      <Card title="Access & Consent" icon={<Shield className="w-4 h-4" />}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
            <span className="text-sm text-gray-700">Patient has consented to share records with this clinic</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
            <span className="text-sm text-gray-700">Physician access approved</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Last appointment: {p.lastAppointment}
          </p>
        </div>
      </Card>
    </div>
  );
}
