import { useParams } from 'react-router-dom';
import { AlertCircle, FileText, ShieldAlert } from 'lucide-react';
import type { ReferralPackageResponse, PackageType } from '../../../shared/types';
import SourceChip from '../components/shared/SourceChip';

const PACKAGE_TYPE_LABELS: Record<PackageType, string> = {
  LAB_REQUISITION: 'Lab Requisition',
  IMAGING_REQUISITION: 'Imaging Requisition',
  SPECIALIST_REFERRAL: 'Specialist Referral',
  GENERAL_HANDOFF: 'General Handoff',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

export default function SharedPackagePage() {
  const { packageId } = useParams<{ packageId: string }>();

  const stored = packageId ? localStorage.getItem(`anamoria_pkg_${packageId}`) : null;
  const pkg: ReferralPackageResponse | null = stored ? JSON.parse(stored) : null;

  if (!pkg) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-md text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-base font-bold text-gray-900 mb-2">Package not found</h2>
          <p className="text-sm text-gray-500">
            This link may have expired or the package was never shared from this browser.
            In a real deployment, packages would be stored server-side with authentication and expiry.
          </p>
        </div>
      </div>
    );
  }

  const isApproved = pkg.status === 'APPROVED';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs font-semibold text-teal-600 uppercase tracking-widest mb-0.5">Anamoria</p>
              <h1 className="text-lg font-bold text-gray-900">Medical Referral Package</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {PACKAGE_TYPE_LABELS[pkg.recipientContext.packageType as PackageType] ?? pkg.recipientContext.packageType}
                {' → '}{pkg.recipientContext.recipientSpecialty}
              </p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
              isApproved
                ? 'bg-green-100 text-green-700 border-green-200'
                : 'bg-amber-100 text-amber-700 border-amber-200'
            }`}>
              {isApproved ? '✓ Approved by physician' : 'Draft'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">
        {/* Demo disclaimer */}
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Demo share link only.</strong> This page reads from browser localStorage.
            In a real deployment, this would require recipient authentication, link expiry, audit logs, and patient consent.
            This system does not diagnose conditions or recommend treatment.
          </p>
        </div>

        {/* Recipient context */}
        <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-2">Referral Details</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            {pkg.recipientContext.recipientName && (
              <><span className="text-gray-500">Recipient</span><span className="text-gray-800 font-medium">{pkg.recipientContext.recipientName}</span></>
            )}
            <span className="text-gray-500">Specialty</span>
            <span className="text-gray-800 font-medium">{pkg.recipientContext.recipientSpecialty}</span>
            <span className="text-gray-500">Reason</span>
            <span className="text-gray-800 leading-snug">{pkg.recipientContext.reasonForRequest}</span>
            <span className="text-gray-500">Generated</span>
            <span className="text-gray-500 text-xs">{new Date(pkg.generatedAt).toLocaleString()}</span>
          </div>
        </div>

        {/* Sections */}
        {pkg.relevantMedicalHistory.length > 0 && (
          <Section title="Relevant Medical History">
            <ul className="space-y-2">
              {pkg.relevantMedicalHistory.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0 mt-1.5" />
                  <div className="flex-1">
                    <span className="text-sm text-gray-800">{item.text}</span>
                    {item.verificationStatus && <span className="ml-2 text-xs text-gray-400 italic">({item.verificationStatus})</span>}
                    {item.sourceIds.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.sourceIds.map(sid => <SourceChip key={sid} sourceId={sid} sourceMap={pkg.sourceMap} />)}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {pkg.currentRelevantSymptoms.length > 0 && (
          <Section title="Current Relevant Symptoms">
            <ul className="space-y-2">
              {pkg.currentRelevantSymptoms.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
                  <div className="flex-1">
                    <span className="text-sm text-gray-800">{item.text}</span>
                    {item.verificationStatus && <span className="ml-2 text-xs text-gray-400 italic">({item.verificationStatus})</span>}
                    {item.sourceIds.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.sourceIds.map(sid => <SourceChip key={sid} sourceId={sid} sourceMap={pkg.sourceMap} />)}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {pkg.relevantConditions.length > 0 && (
          <Section title="Relevant Conditions">
            <ul className="space-y-1.5">
              {pkg.relevantConditions.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0 mt-1.5" />
                  <span className="text-sm text-gray-800">{item.text}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {pkg.relevantMedications.length > 0 && (
          <Section title="Relevant Medications">
            <ul className="space-y-1.5">
              {pkg.relevantMedications.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0 mt-1.5" />
                  <span className="text-sm text-gray-800">{item.text}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {pkg.relevantAllergies.length > 0 && (
          <Section title="Allergies">
            <ul className="space-y-1.5">
              {pkg.relevantAllergies.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />
                  <span className="text-sm text-gray-800">{item.text}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {pkg.relevantFamilyHistory && pkg.relevantFamilyHistory.length > 0 && (
          <Section title="Relevant Family History">
            <ul className="space-y-1.5">
              {pkg.relevantFamilyHistory.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0 mt-1.5" />
                  <span className="text-sm text-gray-800">{item.text}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {pkg.notesForRecipient && pkg.notesForRecipient.trim() && (
          <Section title="Notes from Referring Physician">
            <p className="text-sm text-gray-800 leading-relaxed">{pkg.notesForRecipient}</p>
          </Section>
        )}

        {pkg.documentsToInclude.length > 0 && (
          <Section title="Referenced Documents">
            <ul className="space-y-2">
              {pkg.documentsToInclude.map((doc, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{doc.fileName}</p>
                    <p className="text-xs text-gray-500">{doc.relevanceReason}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {pkg.missingOrUnverifiedInfo.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">
              Missing / Unverified Information
            </p>
            <ul className="space-y-2">
              {pkg.missingOrUnverifiedInfo.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-amber-900">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Source map */}
        <Section title={`Source References — ${pkg.sourceMap.length}`}>
          <div className="space-y-2">
            {pkg.sourceMap.map(src => (
              <div key={src.sourceId} className="flex items-start gap-3">
                <SourceChip sourceId={src.sourceId} sourceMap={pkg.sourceMap} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">{src.sourceType.replace(/_/g, ' ')}</p>
                  {src.excerpt && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{src.excerpt}</p>}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Warnings */}
        {pkg.warnings.length > 0 && (
          <div className="space-y-1.5">
            {pkg.warnings.map((w, i) => (
              <p key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />{w}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
