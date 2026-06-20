import api from './api';
import type {
  VisitBriefRequest,
  VisitBriefResponse,
  ReferralPackageRequest,
  ReferralPackageResponse,
  RequisitionDraftRequest,
  RequisitionDraftResponse,
} from '../../../shared/types';

export const aiService = {
  generateVisitBrief: (data: VisitBriefRequest) =>
    api.post<VisitBriefResponse>('/api/ai/visit-brief', data).then(r => r.data),

  generateReferralPackage: (data: ReferralPackageRequest) =>
    api.post<ReferralPackageResponse>('/api/ai/reference-package', data).then(r => r.data),

  generateRequisitionDraft: (data: RequisitionDraftRequest) =>
    api.post<RequisitionDraftResponse>('/api/ai/requisition-draft', data).then(r => r.data),
};
