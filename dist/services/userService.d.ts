export declare const getUsers: (filters: any, page: number, limit: number, currentUser: any) => Promise<{
    users: {
        _count: {
            tasksAssigned: number;
        };
        email: string;
        id: string;
        isActive: boolean;
        name: string;
        rank: import("@prisma/client").$Enums.MilitaryRank | null;
        role: string;
        team: {
            id: string;
            name: string;
        } | null;
        teamId: string | null;
    }[];
    total: number;
    pages: number;
}>;
export declare const getUserById: (id: string, currentUser: any) => Promise<{
    _count: {
        tasksAssigned: number;
    };
    email: string;
    id: string;
    isActive: boolean;
    name: string;
    rank: import("@prisma/client").$Enums.MilitaryRank | null;
    role: string;
    team: {
        id: string;
        managerId: string | null;
        name: string;
    } | null;
    teamId: string | null;
}>;
export declare const createUser: (data: any, currentUser: any) => Promise<{
    email: string;
    id: string;
    isActive: boolean;
    name: string;
    rank: import("@prisma/client").$Enums.MilitaryRank | null;
    role: string;
    team: {
        name: string;
    } | null;
    teamId: string | null;
}>;
export declare const updateUser: (id: string, data: any, currentUser: any) => Promise<{
    email: string;
    id: string;
    isActive: boolean;
    name: string;
    rank: import("@prisma/client").$Enums.MilitaryRank | null;
    role: string;
    team: {
        name: string;
    } | null;
    teamId: string | null;
}>;
export declare const getAssignableUsers: (currentUser: any, teamId?: string) => Promise<{
    email: string;
    id: string;
    name: string;
    rank: import("@prisma/client").$Enums.MilitaryRank | null;
    role: string;
    teamId: string | null;
}[]>;
export declare const deleteUser: (id: string, currentUser: any) => Promise<{
    success: boolean;
}>;
//# sourceMappingURL=userService.d.ts.map