import { useApp } from '../../context/AppContext';

const conditionColors: Record<string, string> = {
  'Asthma': 'bg-sky-50 text-sky-700 border-sky-200',
  'Seasonal allergies': 'bg-amber-50 text-amber-700 border-amber-200',
  'Rheumatoid Arthritis': 'bg-violet-50 text-violet-700 border-violet-200',
  'Eczema': 'bg-pink-50 text-pink-700 border-pink-200',
  'Type 2 Diabetes': 'bg-orange-50 text-orange-700 border-orange-200',
  'Hypertension': 'bg-red-50 text-red-700 border-red-200',
  'Severe shellfish allergy': 'bg-red-50 text-red-700 border-red-200',
  'Allergic rhinitis': 'bg-amber-50 text-amber-700 border-amber-200',
};

function ConditionPill({ label }: { label: string }) {
  const cls = conditionColors[label] ?? 'bg-gray-50 text-gray-500 border-gray-200';
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded border font-medium ${cls}`}>
      {label}
    </span>
  );
}

interface PersonNodeProps {
  name: string;
  relationship: string;
  age?: number;
  deceased?: boolean;
  conditions: string[];
  isPatient?: boolean;
}

function PersonNode({ name, relationship, age, deceased, conditions, isPatient }: PersonNodeProps) {
  return (
    <div className={`flex flex-col rounded-lg border px-3 py-3 min-w-[160px] max-w-[200px] ${
      isPatient
        ? 'border-teal-400 bg-teal-50 ring-1 ring-teal-400 ring-offset-2'
        : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {/* Gender symbol circle (medical pedigree convention simplified) */}
        <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 ${
          isPatient ? 'border-teal-500 bg-teal-100' : deceased ? 'border-gray-400 bg-gray-100' : 'border-gray-300 bg-white'
        }`} />
        <div className="min-w-0">
          <p className={`text-xs font-semibold leading-tight truncate ${isPatient ? 'text-teal-900' : 'text-gray-800'}`}>
            {name}
          </p>
          <p className="text-xs text-gray-400 leading-tight">
            {relationship}{age ? ` · ${age}` : ''}
          </p>
        </div>
      </div>
      {conditions.length > 0 && (
        <div className="flex flex-col gap-1 mt-0.5">
          {conditions.map((c) => <ConditionPill key={c} label={c} />)}
        </div>
      )}
      {conditions.length === 0 && (
        <p className="text-xs text-gray-300 italic">No conditions recorded</p>
      )}
    </div>
  );
}

const CONNECTOR = "bg-gray-200";

// Shared conditions across the family for the table view
const sharedConditions = [
  {
    condition: 'Asthma',
    color: 'bg-sky-50 text-sky-700 border-sky-200',
    members: ['Maternal Grandmother', 'Mother (Nadia)', 'Layla (Patient)'],
  },
  {
    condition: 'Eczema / Atopic Dermatitis',
    color: 'bg-pink-50 text-pink-700 border-pink-200',
    members: ['Maternal Aunt (Hana)', 'Layla (Patient)'],
  },
  {
    condition: 'Rheumatoid Arthritis',
    color: 'bg-violet-50 text-violet-700 border-violet-200',
    members: ['Maternal Grandmother', 'Maternal Aunt (Hana)'],
  },
  {
    condition: 'Allergies (seasonal / food)',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    members: ['Mother (Nadia)', 'Brother (Karim)', 'Layla (Patient)'],
  },
];

export default function FamilyTree() {
  const { patient } = useApp();

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full scrollbar-thin">

      <div className="text-xs text-gray-400 border border-gray-100 rounded-lg px-3 py-2 bg-gray-50">
        Family history is patient-reported. Conditions shown have not been independently verified against relatives' medical records.
      </div>

      {/* Pedigree chart */}
      <div className="bg-white border border-gray-100 rounded-xl p-6">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-6">Family Pedigree — {patient.name}</p>

        {/* Row 1: Grandparents */}
        <div className="flex justify-center mb-0">
          <PersonNode
            name="Maternal Grandmother"
            relationship="Maternal grandmother"
            age={78}
            conditions={['Asthma', 'Rheumatoid Arthritis']}
          />
        </div>

        {/* Connector down */}
        <div className="flex justify-center">
          <div className={`w-px h-6 ${CONNECTOR}`} />
        </div>

        {/* Row 2: Parents + Aunt */}
        <div className="flex items-start justify-center gap-0">
          {/* Left branch line from grandmother */}
          <div className="flex flex-col items-end pt-0 mr-0">
            <PersonNode
              name="Nadia Hassan"
              relationship="Mother"
              age={52}
              conditions={['Asthma', 'Seasonal allergies']}
            />
          </div>

          {/* Horizontal connector between mother and father */}
          <div className="flex items-center pt-5">
            <div className={`h-px w-8 ${CONNECTOR}`} />
            <div className={`h-px w-8 ${CONNECTOR}`} />
          </div>

          <PersonNode
            name="Tariq Hassan"
            relationship="Father"
            age={55}
            conditions={['Type 2 Diabetes', 'Hypertension']}
          />

          <div className="flex items-center pt-5 ml-6">
            <div className={`h-px w-8 ${CONNECTOR}`} />
          </div>

          <PersonNode
            name="Hana Yousef"
            relationship="Maternal aunt"
            age={48}
            conditions={['Rheumatoid Arthritis', 'Eczema']}
          />
        </div>

        {/* Connector down to patient row */}
        <div className="flex justify-center" style={{ marginLeft: '-180px' }}>
          <div className={`w-px h-6 ${CONNECTOR}`} />
        </div>

        {/* Row 3: Patient + Sibling */}
        <div className="flex items-start justify-center gap-0" style={{ marginLeft: '-180px' }}>
          <PersonNode
            name="Layla Hassan"
            relationship="Patient"
            age={28}
            conditions={['Asthma', 'Eczema', 'Severe shellfish allergy', 'Allergic rhinitis']}
            isPatient
          />
          <div className="flex items-center pt-5">
            <div className={`h-px w-8 ${CONNECTOR}`} />
          </div>
          <PersonNode
            name="Karim Hassan"
            relationship="Brother"
            age={24}
            conditions={['Seasonal allergies']}
          />
        </div>
      </div>

      {/* Shared conditions table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-700">Hereditary Pattern Summary</p>
        </div>
        <div className="divide-y divide-gray-50">
          {sharedConditions.map((sc) => (
            <div key={sc.condition} className="px-4 py-3 flex items-start gap-4">
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded border flex-shrink-0 mt-0.5 ${sc.color}`}>
                {sc.condition}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {sc.members.map((m) => (
                  <span key={m} className={`text-xs px-2 py-0.5 rounded ${m.includes('Patient') ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-500'}`}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clinical note */}
      <div className="border border-gray-100 rounded-xl px-4 py-3 bg-gray-50">
        <p className="text-xs font-medium text-gray-600 mb-1">Clinical significance</p>
        <p className="text-xs text-gray-500 leading-relaxed">
          Strong maternal lineage of atopic disease across three generations (asthma, eczema). Autoimmune predisposition on the maternal side (RA in grandmother and aunt). Paternal line shows metabolic risk (T2DM, hypertension). Monitor Layla for progression toward more severe atopic disease or early signs of autoimmune conditions.
        </p>
      </div>
    </div>
  );
}
