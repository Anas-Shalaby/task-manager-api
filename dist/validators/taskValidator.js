import { z } from 'zod';
export const createTaskSchema = z.object({
    title: z.string().min(3, 'العنوان قصير جداً'),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    deadline: z.string().datetime().optional(),
    assignees: z.array(z.object({
        userId: z.string().uuid('ID المستخدم غير صالح'),
        isOwner: z.boolean().default(false)
    })).min(1, 'يجب تحديد مسؤول واحد على الأقل').refine(assignees => {
        const ownerCount = assignees.filter(a => a.isOwner).length;
        return ownerCount === 1;
    }, 'يجب تحديد مسؤول رئيسي واحد فقط للمهمة'),
});
export const blockTaskSchema = z.object({
    reason: z.string().min(5, 'يجب تقديم سبب واضح للإيقاف'),
});
export const reviewTaskSchema = z.object({
    approved: z.boolean(),
    feedback: z.string().optional(),
});
export const addUpdateSchema = z.object({
    message: z.string().min(3, 'التحديث قصير جداً'),
    progress: z.number().min(0).max(100).optional(),
    status: z.string().optional(),
});
export const addCommentSchema = z.object({
    message: z.string().min(1, 'لا يمكن إضافة تعليق فارغ'),
});
//# sourceMappingURL=taskValidator.js.map