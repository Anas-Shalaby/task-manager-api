import { generateOperationalReport } from '../services/reportService.js';
import { canViewOperationalReport } from '../policies/reportPolicy.js';
import { sendSuccess } from '../utils/response.js';
export const getOperationalReport = async (req, res) => {
    try {
        const user = req.user;
        if (!user || !canViewOperationalReport(user)) {
            return res.status(403).json({ error: { message: 'Unauthorized to view executive reports' } });
        }
        const filters = {
            period: req.query.period || 'last_30_days',
            from: req.query.from,
            to: req.query.to,
            teamId: req.query.teamId,
            status: req.query.status,
            priority: req.query.priority,
        };
        const report = await generateOperationalReport(filters, user);
        return sendSuccess(res, report);
    }
    catch (error) {
        console.error('Error generating operational report:', error);
        if (error.code === 'FORBIDDEN') {
            return res.status(403).json({ error: { message: 'Unauthorized scope access' } });
        }
        res.status(500).json({ error: { message: 'Failed to generate operational report' } });
    }
};
//# sourceMappingURL=reportController.js.map