import { z } from 'zod';
import { MilitaryRank } from '@prisma/client';
export const createUserSchema = z.object({
    name: z.string().min(1, 'الاسم مطلوب'),
    email: z.string().email('بريد إلكتروني غير صالح'),
    password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل').optional(),
    role: z.enum(['admin', 'manager', 'supervisor', 'employee']).optional(),
    rank: z.nativeEnum(MilitaryRank).optional().nullable(),
    teamId: z.string().uuid().optional().nullable(),
    isActive: z.boolean().optional(),
});
export const updateUserSchema = z.object({
    name: z.string().min(1, 'الاسم مطلوب').optional(),
    role: z.enum(['admin', 'manager', 'supervisor', 'employee']).optional(),
    rank: z.nativeEnum(MilitaryRank).optional().nullable(),
    teamId: z.string().uuid().optional().nullable(),
    isActive: z.boolean().optional(),
});
//# sourceMappingURL=userValidator.js.map