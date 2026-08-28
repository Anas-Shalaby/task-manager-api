import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
export declare const getOverview: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=dashboardController.d.ts.map