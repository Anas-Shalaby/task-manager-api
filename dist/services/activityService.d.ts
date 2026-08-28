export interface ActivityFilters {
    page?: number;
    limit?: number;
    from?: string;
    to?: string;
    actorId?: string;
    entityType?: string;
    action?: string;
    taskId?: string;
    teamId?: string;
    search?: string;
}
export declare const getActivityLogs: (filters: ActivityFilters, authScope: any) => Promise<{
    items: {
        id: string;
        action: string;
        entityType: string;
        entityId: string | null;
        actor: {
            id: string;
            name: string;
            rank: import("@prisma/client").$Enums.MilitaryRank | null;
            role: string;
        } | null;
        entity: {
            id: string | null;
            title: any;
            type: string;
        };
        changes: import("@prisma/client/runtime/library").JsonValue;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
    }[];
    summary: {
        total: number;
        tasks: number;
        creates: number;
        status: number;
        reviews: number;
    };
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}>;
//# sourceMappingURL=activityService.d.ts.map