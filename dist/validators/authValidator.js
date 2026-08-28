import { z } from 'zod';
export const loginSchema = z.object({
    email: z.string().email('بريد إلكتروني غير صالح'),
    password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});
//# sourceMappingURL=authValidator.js.map