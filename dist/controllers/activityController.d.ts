import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
export declare const getActivities: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=activityController.d.ts.map