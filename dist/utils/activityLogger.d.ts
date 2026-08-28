interface LogActivityParams {
    actorId?: string;
    action: string;
    entityType?: string;
    entityId?: string;
    changes?: any;
    metadata?: any;
}
export declare const logActivity: (params: LogActivityParams) => Promise<void>;
export {};
//# sourceMappingURL=activityLogger.d.ts.map