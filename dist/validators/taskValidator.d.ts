import { z } from 'zod';
export declare const createTaskSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodEnum<{
        critical: "critical";
        high: "high";
        low: "low";
        medium: "medium";
    }>>;
    deadline: z.ZodOptional<z.ZodString>;
    assignees: z.ZodArray<z.ZodObject<{
        userId: z.ZodString;
        isOwner: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const blockTaskSchema: z.ZodObject<{
    reason: z.ZodString;
}, z.core.$strip>;
export declare const reviewTaskSchema: z.ZodObject<{
    approved: z.ZodBoolean;
    feedback: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const addUpdateSchema: z.ZodObject<{
    message: z.ZodString;
    progress: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const addCommentSchema: z.ZodObject<{
    message: z.ZodString;
}, z.core.$strip>;
//# sourceMappingURL=taskValidator.d.ts.map