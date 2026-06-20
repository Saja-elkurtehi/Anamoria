import api from './api';
import type { ReferralPacket } from '../../../shared/types';

export const referralService = {
  create: (data: Partial<ReferralPacket>) =>
    api.post<ReferralPacket>('/api/referrals', data).then(r => r.data),
  getById: (id: string) =>
    api.get<ReferralPacket>(`/api/referrals/${id}`).then(r => r.data),
};
