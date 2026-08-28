export interface CreateNotificationParams {
    userId: string;
    type: string;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
    metadata?: any;
}
export declare const createNotification: (data: CreateNotificationParams, tx?: any) => Promise<any>;
export declare const createManyNotifications: (notificationsData: CreateNotificationParams[], tx?: any) => Promise<any[]>;
export declare const emitNotificationCreated: (notification: any) => void;
export declare const getNotifications: (userId: string, page?: number, limit?: number) => Promise<{
    notifications: {
        id: string;
        userId: string;
        type: string;
        title: string;
        message: string;
        entityType: string;
        entityId: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        readAt: Date | null;
        createdAt: Date;
    }[];
    total: number;
    pages: number;
    unreadCount: number;
}>;
export declare const getUnreadCount: (userId: string) => Promise<{
    unreadCount: number;
}>;
export declare const markAsRead: (id: string, userId: string) => Promise<{
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    entityType: string;
    entityId: string | null;
    metadata: import("@prisma/client/runtime/library").JsonValue | null;
    readAt: Date | null;
    createdAt: Date;
}>;
export declare const markAllAsRead: (userId: string) => Promise<{
    updatedCount: number;
}>;
//# sourceMappingURL=notificationService.d.ts.map