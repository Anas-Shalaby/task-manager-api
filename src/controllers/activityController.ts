import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';
import { getActivityLogs, type ActivityFilters } from '../services/activityService.js';
import { getActivityScope } from '../policies/activityPolicy.js';
import { sendSuccess } from '../utils/response.js';

const getActivitiesSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  actorId: z.string().uuid().optional(),
  entityType: z.string().optional(),
  action: z.string().optional(),
  taskId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  search: z.string().optional(),
});

export const getActivities = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    // Validate query parameters
    const validatedQuery = getActivitiesSchema.safeParse(req.query);
    if (!validatedQuery.success) {
      return res.status(400).json({ 
        error: { 
          message: 'معلمات البحث غير صالحة',
          details: validatedQuery.error.format()
        } 
      });
    }

    const filters = validatedQuery.data as ActivityFilters;

    // Resolve Authorization Scope
    const authScope = await getActivityScope(user);
    if (authScope.id === 'blocked-scope-impossible-id') {
      return res.status(403).json({ error: { message: 'Unauthorized access to activity logs' } });
    }

    // Execute Service
    const data = await getActivityLogs(filters, authScope);

    return sendSuccess(res, data);
  } catch (error: any) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: { message: 'Failed to fetch activity logs' } });
  }
};
