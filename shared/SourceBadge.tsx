import type { DataSource, VerificationStatus } from '../../types';

interface SourceBadgeProps {
  sourceType: DataSource;
  verificationStatus: VerificationStatus;
  size?: 'sm' | 'md';
}

export function getSourceConfig(sourceType: DataSource, verificationStatus: VerificationStatus) {
  if (sourceType === 'PHYSICIAN_EDIT') {
    return {
      label: 'Physician',
      colorClass: 'bg-violet-50 text-violet-700 border-violet-200',
      dotClass: 'bg-violet-500',
      borderClass: 'border-l-violet-400',
      bgClass: 'bg-violet-50',
      ringClass: 'ring-violet-400',
    };
  }
  if (sourceType === 'EMR_INGEST' || verificationStatus === 'CONFIRMED_BY_EMR') {
    return {
      label: sourceType === 'EMR_INGEST' ? 'EMR Record' : 'EMR Confirmed',
      colorClass: 'bg-blue-50 text-blue-700 border-blue-200',
      dotClass: 'bg-blue-400',
      borderClass: 'border-l-blue-400',
      bgClass: 'bg-blue-50',
      ringClass: 'ring-blue-400',
    };
  }
  if (sourceType === 'UPLOAD' && verificationStatus === 'PHYSICIAN_VERIFIED') {
    return {
      label: 'Upload · Verified',
      colorClass: 'bg-green-50 text-green-700 border-green-200',
      dotClass: 'bg-green-500',
      borderClass: 'border-l-green-500',
      bgClass: 'bg-green-50',
      ringClass: 'ring-green-500',
    };
  }
  if (sourceType === 'UPLOAD') {
    return {
      label: 'Uploaded',
      colorClass: 'bg-blue-50 text-blue-700 border-blue-200',
      dotClass: 'bg-blue-400',
      borderClass: 'border-l-blue-400',
      bgClass: 'bg-blue-50',
      ringClass: 'ring-blue-400',
    };
  }
  if (
    verificationStatus === 'PHYSICIAN_VERIFIED' &&
    (sourceType === 'INTAKE_FORM' || sourceType === 'PROFILE' || sourceType === 'CHAT_ASSISTANT')
  ) {
    return {
      label: 'Patient · Verified',
      colorClass: 'bg-green-50 text-green-700 border-green-200',
      dotClass: 'bg-green-500',
      borderClass: 'border-l-green-500',
      bgClass: 'bg-green-50',
      ringClass: 'ring-green-500',
    };
  }
  if (sourceType === 'INTAKE_FORM') {
    return {
      label: 'Intake Form',
      colorClass: 'bg-amber-50 text-amber-700 border-amber-200',
      dotClass: 'bg-amber-400',
      borderClass: 'border-l-amber-400',
      bgClass: 'bg-amber-50',
      ringClass: 'ring-amber-400',
    };
  }
  if (sourceType === 'CHAT_ASSISTANT') {
    return {
      label: 'Via Assistant',
      colorClass: 'bg-amber-50 text-amber-700 border-amber-200',
      dotClass: 'bg-amber-400',
      borderClass: 'border-l-amber-400',
      bgClass: 'bg-amber-50',
      ringClass: 'ring-amber-400',
    };
  }
  return {
    label: 'Patient-Reported',
    colorClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-400',
    borderClass: 'border-l-amber-400',
    bgClass: 'bg-amber-50',
    ringClass: 'ring-amber-400',
  };
}

export function getVerificationBadge(status: VerificationStatus) {
  switch (status) {
    case 'PHYSICIAN_VERIFIED': return { label: 'Physician Verified', colorClass: 'text-green-600' };
    case 'CONFIRMED_BY_EMR':  return { label: 'EMR Confirmed',      colorClass: 'text-blue-600'  };
    case 'PATIENT_REPORTED':  return { label: 'Patient-Reported',   colorClass: 'text-gray-500'  };
    case 'NEEDS_REVIEW':      return { label: 'Needs Review',        colorClass: 'text-amber-600' };
    case 'FLAGGED':           return { label: 'Flagged',             colorClass: 'text-red-600'   };
    case 'CLARIFICATION_REQUESTED': return { label: 'Clarification Requested', colorClass: 'text-sky-600' };
    default: return { label: status, colorClass: 'text-gray-400' };
  }
}

export default function SourceBadge({ sourceType, verificationStatus }: SourceBadgeProps) {
  const config = getSourceConfig(sourceType, verificationStatus);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border text-xs font-medium px-2 py-0.5 ${config.colorClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dotClass}`} />
      {config.label}
    </span>
  );
}
