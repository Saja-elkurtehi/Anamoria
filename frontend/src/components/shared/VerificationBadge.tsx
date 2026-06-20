import { CheckCircle, Clock, AlertTriangle, ShieldCheck, Eye, XCircle } from 'lucide-react';
import type { VerificationStatus } from '../../types';

interface Props {
  status: VerificationStatus;
  size?: 'sm' | 'md';
}

const config: Record<VerificationStatus, {
  label: string;
  icon: typeof CheckCircle;
  classes: string;
}> = {
  NEEDS_REVIEW: {
    label: 'Needs review',
    icon: Clock,
    classes: 'bg-amber-100 text-amber-700',
  },
  PATIENT_REPORTED_ONLY: {
    label: 'Patient-reported',
    icon: Eye,
    classes: 'bg-amber-100 text-amber-700',
  },
  VERIFIED_BY_PHYSICIAN: {
    label: 'Verified by physician',
    icon: ShieldCheck,
    classes: 'bg-green-100 text-green-700',
  },
  VERIFIED_BY_EMR: {
    label: 'Verified by EMR',
    icon: CheckCircle,
    classes: 'bg-blue-100 text-blue-700',
  },
  REVIEWED_NOT_VERIFIED: {
    label: 'Reviewed',
    icon: Eye,
    classes: 'bg-gray-100 text-gray-600',
  },
  CONFLICTING_INFORMATION: {
    label: 'Conflicting',
    icon: XCircle,
    classes: 'bg-red-100 text-red-700',
  },
};

export default function VerificationBadge({ status, size = 'sm' }: Props) {
  const { label, icon: Icon, classes } = config[status];
  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${px} ${classes}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

export { config as verificationConfig };
