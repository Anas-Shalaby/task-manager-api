export declare const getTasks: (filters: any, page: number, limit: number, user: any) => Promise<{
    tasks: ({
        assignees: ({
            user: {
                id: string;
                name: string;
            };
        } & {
            taskId: string;
            userId: string;
            isOwner: boolean;
            createdAt: Date;
        })[];
    } & {
        id: string;
        title: string;
        description: string | null;
        priority: string;
        status: string;
        progress: number;
        deadline: Date | null;
        teamId: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[];
    total: number;
    pages: number;
}>;
export declare const getTaskMetrics: (user: any, filters?: any) => Promise<{
    totalTasks: number;
    activeTasks: number;
    blockedTasks: number;
    reviewTasks: number;
    overdueTasks: number;
}>;
export declare const fetchMyTasks: (user: any, filters: any, page: number, limit: number) => Promise<{
    tasks: ({
        assignees: ({
            user: {
                id: string;
                name: string;
                role: string;
            };
        } & {
            taskId: string;
            userId: string;
            isOwner: boolean;
            createdAt: Date;
        })[];
    } & {
        id: string;
        title: string;
        description: string | null;
        priority: string;
        status: string;
        progress: number;
        deadline: Date | null;
        teamId: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[];
    total: number;
    pages: number;
}>;
export declare const fetchMyTaskMetrics: (user: any) => Promise<{
    totalTasks: number;
    activeTasks: number;
    blockedTasks: number;
    reviewTasks: number;
    overdueTasks: number;
}>;
export declare const getTaskById: (id: string, user: any) => Promise<({
    assignees: ({
        user: {
            id: string;
            name: string;
            role: string;
        };
    } & {
        taskId: string;
        userId: string;
        isOwner: boolean;
        createdAt: Date;
    })[];
    blockers: ({
        user: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        taskId: string;
        userId: string;
        reason: string;
        resolved: boolean;
        resolvedAt: Date | null;
        createdAt: Date;
    })[];
    comments: ({
        user: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        taskId: string;
        userId: string;
        message: string;
        createdAt: Date;
        updatedAt: Date;
    })[];
    updates: ({
        user: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        taskId: string;
        userId: string;
        message: string;
        progress: number | null;
        status: string | null;
        createdAt: Date;
    })[];
} & {
    id: string;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    progress: number;
    deadline: Date | null;
    teamId: string | null;
    createdAt: Date;
    updatedAt: Date;
}) | null>;
export declare const createTask: (data: any, user: any) => Promise<({
    assignees: ({
        user: {
            email: string;
            id: string;
            name: string;
            role: string;
        };
    } & {
        taskId: string;
        userId: string;
        isOwner: boolean;
        createdAt: Date;
    })[];
} & {
    id: string;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    progress: number;
    deadline: Date | null;
    teamId: string | null;
    createdAt: Date;
    updatedAt: Date;
}) | null>;
export declare const updateTask: (id: string, data: any, user: any) => Promise<({
    assignees: ({
        user: {
            id: string;
            name: string;
            role: string;
        };
    } & {
        taskId: string;
        userId: string;
        isOwner: boolean;
        createdAt: Date;
    })[];
} & {
    id: string;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    progress: number;
    deadline: Date | null;
    teamId: string | null;
    createdAt: Date;
    updatedAt: Date;
}) | null>;
export declare const deleteTask: (id: string, user: any) => Promise<{
    success: boolean;
}>;
export declare const startTask: (id: string, user: any) => Promise<{
    id: string;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    progress: number;
    deadline: Date | null;
    teamId: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const blockTask: (id: string, reason: string, user: any) => Promise<{
    id: string;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    progress: number;
    deadline: Date | null;
    teamId: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const unblockTask: (id: string, user: any) => Promise<{
    id: string;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    progress: number;
    deadline: Date | null;
    teamId: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const submitForReview: (id: string, user: any) => Promise<{
    id: string;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    progress: number;
    deadline: Date | null;
    teamId: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const reviewTask: (id: string, approved: boolean, feedback: string | undefined, user: any) => Promise<{
    id: string;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    progress: number;
    deadline: Date | null;
    teamId: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const addOperationalUpdate: (id: string, data: {
    message: string;
    progress?: number;
    status?: string;
}, user: any) => Promise<{
    id: string;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    progress: number;
    deadline: Date | null;
    teamId: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const addComment: (id: string, message: string, user: any) => Promise<{
    id: string;
    taskId: string;
    userId: string;
    message: string;
    createdAt: Date;
    updatedAt: Date;
}>;
//# sourceMappingURL=taskService.d.ts.map