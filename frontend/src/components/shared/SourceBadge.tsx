import type { SourceType } from '../../types';
import { getNodeColor, colorMap, sourceLabels } from '../../utils/nodeColors';

interface Props {
  sourceType: SourceType;
  verificationStatus: Parameters<typeof getNodeColor>[0]['verificationStatus'];
  size?: 'sm' | 'md';
}

export default function SourceBadge({ sourceType, verificationStatus, size = 'sm' }: Props) {
  const color = getNodeColor({ sourceType, verificationStatus });
  const c = colorMap[color];
  const label = sourceLabels[sourceType];
  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${px} ${c.badge} ${c.badgeText}`}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {label}
    </span>
  );
}
