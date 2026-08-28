import type { Response } from 'express';
export declare const sendSuccess: <T>(res: Response, data: T, message?: string, statusCode?: number) => Response<any, Record<string, any>>;
export declare const sendError: (res: Response, code: string, message: string, statusCode?: number, details?: any) => Response<any, Record<string, any>>;
//# sourceMappingURL=response.d.ts.map