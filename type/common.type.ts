
export type pagination = {
    next?: {
        page: number
        take: number
    }
    prev?: {
        page: number
        take: number
    }
    currentPage?: number
    currentTake?: number
    totalPage?: number
    totalResult?: number
}

export interface AuthPayload {
    userId: number;
    isSuperAdmin: Boolean,
    email: string;
    roles: string[];
    permissions: string[];
    menus: string[];
    ulb_id: number[];
    ward: any[],
    iat: number;
    exp: number;
}