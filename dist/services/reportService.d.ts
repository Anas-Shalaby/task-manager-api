export interface ReportFilters {
    period?: 'today' | 'this_week' | 'this_month' | 'last_30_days' | 'last_90_days' | 'custom';
    from?: string;
    to?: string;
    teamId?: string;
    status?: string;
    priority?: string;
}
export declare const generateOperationalReport: (filters: ReportFilters, user: any) => Promise<{
    meta: {
        generatedAt: string;
        period: "custom" | "last_30_days" | "last_90_days" | "this_month" | "this_week" | "today" | undefined;
        from: Date | undefined;
        to: Date | undefined;
        scope: string;
    };
    summary: {
        totalTasks: number;
        completedTasks: number;
        inProgressTasks: number;
        blockedTasks: number;
        reviewTasks: number;
        overdueTasks: number;
        completionRate: string;
    };
    health: {
        status: string;
        reasons: string[];
    };
    statusDistribution: {
        name: string;
        value: number;
    }[];
    trends: {
        date: string;
        created: number;
        completed: number;
    }[];
    teamWorkload: any[];
    attentionItems: ({
        id: string;
        title: string;
        type: string;
        reason: string;
        blockedSince: Date | undefined;
        owner: string;
    } | {
        id: string;
        title: string;
        type: string;
        priority: string;
        deadline: Date | null;
        progress: number;
        owner: string;
    })[];
}>;
//# sourceMappingURL=reportService.d.ts.map