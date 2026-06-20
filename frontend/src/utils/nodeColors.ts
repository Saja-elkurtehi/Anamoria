import type { SourceType, VerificationStatus } from '../types';

export type NodeColor = 'amber' | 'blue' | 'green' | 'purple' | 'red' | 'gray';

export function getNodeColor(node: {
  sourceType: SourceType;
  verificationStatus: VerificationStatus;
}): NodeColor {
  if (node.sourceType === 'PHYSICIAN_CONTRIBUTION') return 'purple';
  if (node.verificationStatus === 'CONFLICTING_INFORMATION') return 'red';
  if (node.sourceType === 'EMR_DATABASE' || node.sourceType === 'UPLOADED_RECORD') return 'blue';
  if (node.sourceType === 'PATIENT_REPORTED_VERIFIED') return 'green';
  if (node.sourceType === 'PATIENT_REPORTED' || node.verificationStatus === 'NEEDS_REVIEW') return 'amber';
  return 'gray';
}

export const colorMap: Record<NodeColor, {
  dot: string;
  line: string;
  border: string;
  bg: string;
  text: string;
  badge: string;
  badgeText: string;
  ring: string;
  hover: string;
}> = {
  amber: {
    dot: 'bg-amber-400',
    line: 'bg-amber-200',
    border: 'border-l-amber-400',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    badge: 'bg-amber-100',
    badgeText: 'text-amber-700',
    ring: 'ring-amber-300',
    hover: 'hover:bg-amber-50',
  },
  blue: {
    dot: 'bg-blue-500',
    line: 'bg-blue-200',
    border: 'border-l-blue-500',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    badge: 'bg-blue-100',
    badgeText: 'text-blue-700',
    ring: 'ring-blue-300',
    hover: 'hover:bg-blue-50',
  },
  green: {
    dot: 'bg-green-500',
    line: 'bg-green-200',
    border: 'border-l-green-500',
    bg: 'bg-green-50',
    text: 'text-green-800',
    badge: 'bg-green-100',
    badgeText: 'text-green-700',
    ring: 'ring-green-300',
    hover: 'hover:bg-green-50',
  },
  purple: {
    dot: 'bg-violet-500',
    line: 'bg-violet-200',
    border: 'border-l-violet-500',
    bg: 'bg-violet-50',
    text: 'text-violet-800',
    badge: 'bg-violet-100',
    badgeText: 'text-violet-700',
    ring: 'ring-violet-300',
    hover: 'hover:bg-violet-50',
  },
  red: {
    dot: 'bg-red-500',
    line: 'bg-red-200',
    border: 'border-l-red-500',
    bg: 'bg-red-50',
    text: 'text-red-800',
    badge: 'bg-red-100',
    badgeText: 'text-red-700',
    ring: 'ring-red-300',
    hover: 'hover:bg-red-50',
  },
  gray: {
    dot: 'bg-gray-400',
    line: 'bg-gray-200',
    border: 'border-l-gray-400',
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    badge: 'bg-gray-100',
    badgeText: 'text-gray-600',
    ring: 'ring-gray-300',
    hover: 'hover:bg-gray-50',
  },
};

export const sourceLabels: Record<SourceType, string> = {
  PATIENT_REPORTED: 'Patient-reported',
  UPLOADED_RECORD: 'Uploaded record',
  EMR_DATABASE: 'EMR database',
  PHYSICIAN_CONTRIBUTION: 'Physician',
  PATIENT_REPORTED_VERIFIED: 'Verified patient report',
  INTAKE_FORM: 'Intake form',
  CHAT_ASSISTANT: 'Assistant',
};

export const verificationLabels: Record<VerificationStatus, string> = {
  NEEDS_REVIEW: 'Needs review',
  PATIENT_REPORTED_ONLY: 'Patient-reported only',
  VERIFIED_BY_PHYSICIAN: 'Verified by physician',
  VERIFIED_BY_EMR: 'Verified by EMR',
  REVIEWED_NOT_VERIFIED: 'Reviewed, not verified',
  CONFLICTING_INFORMATION: 'Conflicting information',
};
