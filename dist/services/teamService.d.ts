export declare const getTeams: (filters: any, page: number, limit: number, user: any) => Promise<{
    teams: ({
        _count: {
            tasks: number;
            users: number;
        };
        manager: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        name: string;
        code: string;
        description: string | null;
        managerId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[];
    total: number;
    pages: number;
}>;
export declare const getTeamById: (id: string, user: any) => Promise<({
    manager: {
        id: string;
        name: string;
        role: string;
    } | null;
    users: {
        _count: {
            tasksAssigned: number;
        };
        id: string;
        isActive: boolean;
        name: string;
        role: string;
    }[];
} & {
    id: string;
    name: string;
    code: string;
    description: string | null;
    managerId: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}) | null>;
export declare const createTeam: (data: any, user: any) => Promise<{
    _count: {
        tasks: number;
        users: number;
    };
    manager: {
        id: string;
        name: string;
    } | null;
} & {
    id: string;
    name: string;
    code: string;
    description: string | null;
    managerId: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const updateTeam: (id: string, data: any, user: any) => Promise<{
    _count: {
        tasks: number;
        users: number;
    };
    manager: {
        id: string;
        name: string;
    } | null;
} & {
    id: string;
    name: string;
    code: string;
    description: string | null;
    managerId: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const deleteTeam: (id: string, user: any) => Promise<{
    success: boolean;
}>;
//# sourceMappingURL=teamService.d.ts.map