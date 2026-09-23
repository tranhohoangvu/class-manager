import { ReportRepo } from '../repositories/report.repo.js';

export const ReportService = {
  async getSchoolSummary(dateStr?: string) {
    return ReportRepo.getSchoolSummary(dateStr);
  },

  async getGradeBreakdown(dateStr?: string) {
    return ReportRepo.getGradeBreakdown(dateStr);
  },
};
