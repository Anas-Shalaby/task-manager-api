import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { generateOperationalReport, type ReportFilters } from '../services/reportService.js';
import { canViewOperationalReport } from '../policies/reportPolicy.js';
import { sendSuccess } from '../utils/response.js';

export const getOperationalReport = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || !canViewOperationalReport(user)) {
      return res.status(403).json({ error: { message: 'Unauthorized to view executive reports' } });
    }

    const filters: ReportFilters = {
      period: req.query.period as any || 'last_30_days',
      from: req.query.from as string,
      to: req.query.to as string,
      teamId: req.query.teamId as string,
      status: req.query.status as string,
      priority: req.query.priority as string,
    };

    const report = await generateOperationalReport(filters, user);
    return sendSuccess(res, report);
  } catch (error: any) {
    console.error('Error generating operational report:', error);
    if (error.code === 'FORBIDDEN') {
      return res.status(403).json({ error: { message: 'Unauthorized scope access' } });
    }
    res.status(500).json({ error: { message: 'Failed to generate operational report' } });
  }
};
