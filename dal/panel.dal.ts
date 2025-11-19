import { Prisma, PrismaClient } from "../generated/panel";

const prisma = new PrismaClient();

//*********************************************************************// Permission Related DAL Functions *********************************************************************//
export const createPermission = async (dataArray: { name: string, ulb_id: number }[]) => {
    return await prisma.permissions.createMany({
        data: dataArray
    });
}

export const getPermission = async (id: number) => {
    return await prisma.permissions.findUnique({
        where: {
            id: id
        }
    });
}

export const getPermissions = async (filters?: { name?: string; recstatus?: string }, pagination?: { page?: number; limit?: number }) => {
    const where: Prisma.permissionsWhereInput = {
        AND: [
            filters?.name
                ? {
                    name: {
                        contains: filters.name, mode: 'insensitive'
                    }
                }
                : {},
            filters?.recstatus
                ? {
                    recstatus: {
                        equals: Number(filters.recstatus)
                    }
                }
                : {}
        ],
    };

    const page = pagination?.page && pagination.page > 0 ? pagination.page : 1;
    const limit = pagination?.limit && pagination.limit > 0 ? pagination.limit : 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        prisma.permissions.findMany({
            where,
            orderBy: { created_at: 'desc' },
            skip,
            take: limit,
        }),
        prisma.permissions.count({ where }),
    ]);

    return {
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}

export const updatePermission = async (id: number, name: string, ulb_id: number) => {
    return await prisma.permissions.update({
        where: {
            id: id
        },
        data: {
            name: name,
            ...(ulb_id && { ulb_id: Number(ulb_id) })
        }
    });
}

export const togglePermission = async (id: number) => {
    const prevStatus = await prisma.permissions.findUnique({
        where: { id: id },
        select: { recstatus: true }
    })

    const newStatus = prevStatus?.recstatus === 1 ? 0 : 1;

    return await prisma.permissions.update({
        where: {
            id: id
        },
        data: {
            recstatus: newStatus
        }
    });
}



//*********************************************************************// Role Related DAL Functions *********************************************************************//
export const createRole = async (roleName: string, ulb_id: number, permissionId: { id: number }[]) => {
    return await prisma.role.create({
        data: {
            name: roleName,
            ulb_id: ulb_id,
            ...(permissionId.length > 0 && {
                permissions: {
                    connect: permissionId
                }
            })
        },
    });
}

export const getRoles = async (filters?: { name?: string; recstatus?: string; permission: string }, pagination?: { page?: number; limit?: number }) => {
    const where: Prisma.roleWhereInput = {
        AND: [
            filters?.name
                ? {
                    name: {
                        contains: filters.name, mode: 'insensitive'
                    }
                }
                : {},
            filters?.permission
                ? {
                    permissions: {
                        some: { name: filters.permission }
                    }
                }
                : {},
            filters?.recstatus
                ? {
                    recstatus: {
                        equals: Number(filters.recstatus)
                    }
                }
                : {}
        ],
    };

    const page = pagination?.page && pagination.page > 0 ? pagination.page : 1;
    const limit = pagination?.limit && pagination.limit > 0 ? pagination.limit : 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        prisma.role.findMany({
            where,
            orderBy: { created_at: 'desc' },
            skip,
            take: limit,
        }),
        prisma.role.count({ where }),
    ]);

    return {
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}

export const toggleRole = async (id: number) => {
    const prevStatus = await prisma.role.findUnique({
        where: { id: id },
        select: { recstatus: true }
    })

    const newStatus = prevStatus?.recstatus === 1 ? 0 : 1;

    return await prisma.role.update({
        where: {
            id: id
        },
        data: {
            recstatus: newStatus
        }
    });
}

export const revokePermissionFromRole = async (user_id: number, permissionId: number) => {
    return await prisma.user.update({
        where: { id: user_id },
        data: {
            revokedPermissions: { connect: { id: permissionId } },
        },
    });
}




// export const createUser = async (username: string, password: string, phone: string, role_id: number, email?: string) => {
//     const user = await prisma.user.create({
//         data: {
//             ...(email && { email: email }),
//             phone: phone,
//             password: password,
//             username: username,
//             roles: { connect: { id: role_id } },
//             permissions: { connect: { name: 'view_reports' } },
//         },
//     });
// }

export const createMenu = async (label: string, path: string, permissionId: number[], parent_id?: number, order?: number) => {
    return await prisma.menu.create({
        data: {
            label: label,
            path: path,
            ...(order && { order: order }),
            ...(parent_id && { parentId: parent_id }),
            permissions: {
                connect: permissionId.map((id) => ({ id }))
            }
        },
    });
}

export async function getUserEffectivePermissions(user_id: number) {
    const user = await prisma.user.findUnique({
        where: { id: user_id },
        include: {
            roles: { include: { permissions: true } },
            permissions: true,
            revokedPermissions: true,
        },
    });

    if (!user) {
        throw new Error('User not found');
    }

    const granted = new Set([
        ...user.roles.flatMap((r) => r.permissions.map((p) => p.name)),
        ...user.permissions.map((p) => p.name),
    ]);
    for (const rp of user.revokedPermissions) {
        granted.delete(rp.name);
    }

    return [...granted];
}

export async function getAuthorizedMenus(user_id: number) {
    const userPerms = await getUserEffectivePermissions(user_id);
    const menus = await prisma.menu.findMany({
        where: {
            permissions: {
                some: {
                    name: { in: userPerms },
                },
            },
        },
        include: {
            children: true,
            permissions: true,
        },
    });
    return menus;
}