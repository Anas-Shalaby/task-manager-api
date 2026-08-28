import { verifyToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';
export const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return sendError(res, 'UNAUTHORIZED', 'غير مصرح لك بالوصول', 401);
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = verifyToken(token);
        // Check if user still exists in DB
        const { default: prisma } = await import('../config/prisma.js');
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) {
            return sendError(res, 'UNAUTHORIZED', 'الحساب غير موجود أو تم حذفه', 401);
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        return sendError(res, 'UNAUTHORIZED', 'جلسة غير صالحة أو منتهية', 401);
    }
};
export const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return sendError(res, 'FORBIDDEN', 'لا تملك صلاحية لهذه العملية', 403);
        }
        next();
    };
};
//# sourceMappingURL=auth.js.map