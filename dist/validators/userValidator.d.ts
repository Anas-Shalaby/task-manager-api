import { z } from 'zod';
export declare const createUserSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<{
        admin: "admin";
        employee: "employee";
        manager: "manager";
        supervisor: "supervisor";
    }>>;
    rank: z.ZodNullable<z.ZodOptional<z.ZodEnum<{
        BRIGADIER: 'BRIGADIER';
        LIEUTENANT_COLONEL: 'LIEUTENANT_COLONEL';
        MAJOR: 'MAJOR';
        FIRST_LIEUTENANT: 'FIRST_LIEUTENANT';
        SENIOR_WARRANT_OFFICER: 'SENIOR_WARRANT_OFFICER';
        WARRANT_OFFICER: 'WARRANT_OFFICER';
        STAFF_SERGEANT: 'STAFF_SERGEANT';
        SERGEANT: 'SERGEANT';
        SOLDIER: 'SOLDIER';
        MILITARY_FOLLOW_UP: 'MILITARY_FOLLOW_UP';
        CIVILIAN: 'CIVILIAN';
    }>>>;
    teamId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const updateUserSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<{
        admin: "admin";
        employee: "employee";
        manager: "manager";
        supervisor: "supervisor";
    }>>;
    rank: z.ZodNullable<z.ZodOptional<z.ZodEnum<{
        BRIGADIER: 'BRIGADIER';
        LIEUTENANT_COLONEL: 'LIEUTENANT_COLONEL';
        MAJOR: 'MAJOR';
        FIRST_LIEUTENANT: 'FIRST_LIEUTENANT';
        SENIOR_WARRANT_OFFICER: 'SENIOR_WARRANT_OFFICER';
        WARRANT_OFFICER: 'WARRANT_OFFICER';
        STAFF_SERGEANT: 'STAFF_SERGEANT';
        SERGEANT: 'SERGEANT';
        SOLDIER: 'SOLDIER';
        MILITARY_FOLLOW_UP: 'MILITARY_FOLLOW_UP';
        CIVILIAN: 'CIVILIAN';
    }>>>;
    teamId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
//# sourceMappingURL=userValidator.d.ts.map