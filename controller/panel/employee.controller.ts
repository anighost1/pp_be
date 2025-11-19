import { AuthenticatedRequest } from "../../middleware/authMiddleware";
import { AuthPayload } from "../../type/common.type";
import { PrismaClient as panelClient } from '../../generated/panel'
import genrateResponse from "../../lib/generateResponse";
import HttpStatus from "../../lib/httpStatus";
import { Response, Request } from "express";
import { decryptData, encryptData } from "../../lib/apiCryptography";
import { buildMenuTree } from "../auth/auth.controller"
import bcrypt from 'bcrypt'
import sharp from "sharp";
import fs from "fs"

const panel = new panelClient()

export function deleteById(permissions: Set<any>, id: number) {
    for (const perm of permissions) {
        if (perm.id === id) {
            permissions.delete(perm);
            break;
        }
    }
}

export async function sizeReducer(filePath: string): Promise<void> {
    const MAX_WIDTH = 2000;
    const MAX_HEIGHT = 2000;
    const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

    let quality = 90;

    // Read original file into buffer first
    const originalBuffer = fs.readFileSync(filePath);

    let buffer = await sharp(originalBuffer)
        .resize({ width: MAX_WIDTH, height: MAX_HEIGHT, fit: "inside" })
        .jpeg({ quality })
        .toBuffer();

    while (buffer.length > MAX_FILE_SIZE && quality >= 50) {
        quality -= 10;
        buffer = await sharp(originalBuffer)
            .resize({ width: MAX_WIDTH, height: MAX_HEIGHT, fit: "inside" })
            .jpeg({ quality })
            .toBuffer();
    }

    if (buffer.length > MAX_FILE_SIZE) {
        throw new Error("Resized image still exceeds 1MB limit");
    }

    fs.writeFileSync(filePath, buffer);
}

export const createEmployee = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUser = req.user as AuthPayload;
        const empIp = req.ip;

        const {
            userEmail,
            userPhone,
            agencyId,
            moduleTypeId,
            emp_FirstName,
            emp_LastName,
            emp_aadharNo,
            emp_Address,
            emp_JoiningDate,
            emp_HolderName,
            emp_accountNo,
            emp_ifscCode,
            emp_bankName,
            emp_jobTitle,
            emp_companyName,
            emp_experienceYears,
            emp_jobDescription,
            // emp_reportToTypeId,
            // emp_reportToUserId,
            emp_blockPayment,
            ulbIds,
            roles,
            wards
        } = req.body;

        const file = req?.file
        if (file && file.mimetype.startsWith("image/")) {
            sizeReducer(file.path);
        }

        // Default password
        const defaultPassword = "bira@123";
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        // Run inside transaction
        const [newUser, newEmployee] = await panel.$transaction(async (tx) => {
            // Create a temp user first (with placeholder username)
            const createdUser = await tx.user.create({
                data: {
                    username: "TEMP",
                    email: userEmail,
                    phone: userPhone,
                    password: hashedPassword,
                    ulb: {
                        connect: JSON.parse(ulbIds)?.map((id: number) => ({ id: Number(id) })) || [],
                    },
                    roles: {
                        connect: JSON.parse(roles)?.map((id: number) => ({ id: Number(id) })),
                    },
                    ward: {
                        connect: JSON.parse(wards)?.map((id: number) => ({ id: Number(id) })),
                    }
                },
            });

            const empName = `${emp_FirstName}${emp_LastName || ""}`.toLowerCase();
            const roleName = (emp_jobTitle?.replace(/\s+/g, "") || "Employee").toLowerCase();

            const shortEmp = empName.slice(0, 3);
            const shortRole = roleName.slice(0, 3);

            const generatedUsername = `${shortEmp}${shortRole}${createdUser.id}`;

            // Update user with correct username
            const finalUser = await tx.user.update({
                where: { id: createdUser.id },
                data: { username: generatedUsername },
            });

            // Create employee linked to user
            const createdEmployee = await tx.employee.create({
                data: {
                    user_id: finalUser.id,
                    agency_id: Number(agencyId),
                    moduleType_id: Number(moduleTypeId),
                    empCode: generatedUsername,
                    empFirstName: emp_FirstName,
                    empLastName: emp_LastName,
                    empEmail: userEmail,
                    aadharNo: emp_aadharNo,
                    empAddress: emp_Address,
                    joiningDate: emp_JoiningDate,
                    accountHolderName: emp_HolderName,
                    accountNo: emp_accountNo,
                    ifscCode: emp_ifscCode,
                    bankName: emp_bankName,
                    jobTitle: emp_jobTitle,
                    companyName: emp_companyName,
                    experienceYears: emp_experienceYears,
                    jobDescription: emp_jobDescription,
                    ...(file?.path && { empImage: file?.path }),
                    // reportToTypeId: emp_reportToTypeId,
                    // reportToUserId: emp_reportToUserId,
                    blockPayment: emp_blockPayment,
                    contactNo: userPhone,
                    entryBy: currentUser.userId.toString(),
                    entryIpAddress: empIp,
                },
            });

            return [finalUser, createdEmployee];
        });

        // Remove password from response
        const { password, ...userWithoutPassword } = newUser;

        const responseData = {
            userData: userWithoutPassword,
            employeeData: newEmployee,
        };

        genrateResponse(
            res,
            HttpStatus.OK,
            "Employee created successfully",
            encryptData(responseData)
        );
    } catch (err: any) {
        console.error(`[${new Date().toISOString()}]`, err);
        genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message as string
        );
    }
};


export const getAllEmployeesWithUsers = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const page = Number(req.query.page) || 1
        const limit = Number(req.query.limit) || 10
        const skip = (page - 1) * limit


        const totalCount = await panel.user.count()


        const users = await panel.user.findMany({
            skip,
            take: limit,
            orderBy: { id: "desc" },
            include: {
                ulb: true,
                employee: true
            },
        });

        const safeUsers = users.map(({ password, ...rest }) => rest);

        genrateResponse(res, HttpStatus.OK, "All Employee with users Fetched Successfully",
            encryptData({
                data: safeUsers,
                pagination: {
                    total: totalCount,
                    page,
                    limit,
                    totalPages: Math.ceil(totalCount / limit),
                }
            }));
    } catch (err: any) {
        console.error(`[${new Date().toISOString()}]`, err);
        genrateResponse(res, HttpStatus.BadRequest, err?.message);
    }
};

export const getEmplyoeeWithUserId = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { iv, ed } = req.query;
        const data = decryptData({ encryptedData: ed as string, iv: iv as string })

        const employee = await panel.user.findUnique({
            where: { id: Number(data?.id) },
            select: {
                id: true,
                username: true,
                email: true,
                phone: true,
                ulb: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                employee: true,
                ward: {
                    select: {
                        id: true,
                        ward_no: true,
                        ward_code: true
                    }
                },
                roles: {
                    include: {
                        permissions: {
                            include: { menus: true },
                        },
                    },
                },
                permissions: true,
                revokedPermissions: {
                    select: {
                        id: true,
                        name: true
                    }
                },
            }
        })

        let permissions = new Set<any>();

        if (!employee) {
            throw new Error('No data found')
        }

        permissions = new Set<any>(
            employee.roles.flatMap(role => role.permissions.map(p => ({ id: p.id, name: p.name, from: 'role' })))
        );

        employee.permissions.forEach(p => permissions.add(({ id: p.id, name: p.name, from: 'permission' })));
        // employee.revokedPermissions.forEach(p => permissions.delete(p.id));
        employee.revokedPermissions.forEach(p => deleteById(permissions, p.id));

        const customizedRoles = employee.roles.map((item) => ({ id: item?.id, name: item?.name }))
        employee.roles = customizedRoles as any

        genrateResponse(
            res,
            HttpStatus.OK,
            'Employee fetched successfully',
            encryptData({ ...employee, permissions: Array.from(permissions), })
        )
    } catch (err: any) {
        genrateResponse(res, err?.status || HttpStatus.BadRequest, err?.message);
    }
}


export const updateEmployeeWithUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUser = req.user as AuthPayload;
        const empIp = req.ip;

        // // 🔹 Decrypt incoming data
        // const { iv, ed } = req.body;
        // const decrypted = decryptData({ encryptedData: ed as string, iv: iv as string });

        const {
            userId,
            userEmail,
            userPhone,
            agencyId,
            moduleTypeId,
            emp_FirstName,
            emp_LastName,
            emp_aadharNo,
            emp_Address,
            emp_JoiningDate,
            emp_HolderName,
            emp_accountNo,
            emp_ifscCode,
            emp_bankName,
            emp_jobTitle,
            emp_companyName,
            emp_experienceYears,
            emp_jobDescription,
            emp_blockPayment,
            ulbIds,
            roles,
            wards,
            revokedPermissions
        } = req.body;

        const file = req?.file
        if (file && file.mimetype.startsWith("image/")) {
            sizeReducer(file.path);
        }

        const [updatedUser, updatedEmployee] = await panel.$transaction(async (tx) => {
            // 1. Update user (no username / password change)
            const updatedUser = await tx.user.update({
                where: { id: Number(userId) },
                data: {
                    email: userEmail,
                    phone: userPhone,
                    ulb: {
                        set: ulbIds?.map((id: number) => ({ id: Number(id) })) || [],
                    },
                    roles: {
                        set: roles?.map((id: number) => ({ id: Number(id) })),
                    },
                    ward: {
                        set: wards?.map((id: number) => ({ id: Number(id) })),
                    },
                    ...(revokedPermissions && {
                        revokedPermissions: {
                            set: revokedPermissions?.map((id: number) => ({ id: Number(id) }))
                        }
                    })
                },
            });

            // 2. Update employee
            const updatedEmployee = await tx.employee.update({
                where: { user_id: updatedUser?.id },
                data: {
                    agency_id: Number(agencyId),
                    moduleType_id: Number(moduleTypeId),
                    empFirstName: emp_FirstName,
                    empLastName: emp_LastName,
                    empEmail: userEmail,
                    aadharNo: emp_aadharNo,
                    empAddress: emp_Address,
                    joiningDate: emp_JoiningDate,
                    accountHolderName: emp_HolderName,
                    accountNo: emp_accountNo,
                    ifscCode: emp_ifscCode,
                    bankName: emp_bankName,
                    jobTitle: emp_jobTitle,
                    companyName: emp_companyName,
                    experienceYears: emp_experienceYears,
                    jobDescription: emp_jobDescription,
                    blockPayment: emp_blockPayment,
                    updateBy: String(currentUser?.userId),
                    updateIpAddress: empIp,
                    contactNo: userPhone,
                    ...(file?.path && { empImage: file?.path })
                },
            });

            return [updatedUser, updatedEmployee];
        });

        // Remove password from response
        const { password, ...userWithoutPassword } = updatedUser;

        const responseData = {
            userData: userWithoutPassword,
            employeeData: updatedEmployee,
        };

        genrateResponse(
            res,
            HttpStatus.OK,
            "Employee updated successfully",
            encryptData(responseData)
        );
    } catch (err: any) {
        console.error(`[${new Date().toISOString()}]`, err);
        genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message as string
        );
    }
};

export const toggleUserStatus = async (req: Request, res: Response) => {
    try {
        const { iv, ed } = req.body;
        const data = decryptData({ encryptedData: ed as string, iv: iv as string });

        const userId = Number(data?.id);

        if (!userId) {
            return genrateResponse(res, HttpStatus.BadRequest, "User ID is required");
        }

        // Run in a transaction
        const result = await panel.$transaction(async (tx) => {
            // 1. Get current user status
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { recstatus: true },
            });

            if (!user) {
                throw { status: HttpStatus.NotFound, message: "User not found" };
            }

            const newStatus = user.recstatus === 1 ? 0 : 1;

            // 2. Update user recstatus
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: { recstatus: newStatus },
            });

            // 3. Update related employee recstatus
            await tx.employee.updateMany({
                where: { user_id: userId },
                data: { recstatus: newStatus },
            });

            return updatedUser;
        });

        genrateResponse(
            res,
            HttpStatus.OK,
            `User status toggled to ${result.recstatus} successfully`,
            encryptData(result)
        );
    } catch (err: any) {
        console.error(`[${new Date().toISOString()}]`, err)
        genrateResponse(
            res,

            err?.status || HttpStatus.BadRequest,
            err?.message as string
        );
    }
};




// Map wards to a user and return updated list
export const mapWardsToUser = async (req: Request, res: Response) => {
    try {
        const { iv, ed } = req.body;
        const data = decryptData({ encryptedData: ed as string, iv: iv as string });
        const userId = Number(data.userId);
        const wardIds: number[] = data.wardIds;

        // Assign wards to the user
        await panel.user.update({
            where: { id: userId },
            data: {
                ward: {
                    connect: wardIds.map(id => ({ id })),
                },
            },
        });

        //  Get updated user with wards
        const userWithWards = await panel.user.findUnique({
            where: { id: userId },
            include: {
                ward: {
                    select: {
                        id: true,
                        ward_no: true,
                        name: true,
                        ward_code: true,
                        area: true,
                        recstatus: true,
                    },
                },
            },
        });

        if (!userWithWards) {
            return genrateResponse(res, HttpStatus.NotFound, "User not found");
        }

        const mappedData = {
            userId: userWithWards.id,
            username: userWithWards.username,
            wards: userWithWards.ward,
        };

        return genrateResponse(
            res,
            HttpStatus.OK,
            "Wards mapped successfully",
            encryptData(mappedData)
        );
    } catch (err: any) {
        console.error(`[${new Date().toISOString()}]`, err);
        return genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message || "Something went wrong"
        );
    }
};

export const removeWardFromUser = async (req: Request, res: Response) => {
    try {
        const { iv, ed } = req.body;
        const data = decryptData({ encryptedData: ed as string, iv: iv as string })

        const userId = Number(data.userId)
        const wardId = Number(data.id)

        await panel.user.update({
            where: { id: userId },
            data: {
                ward: {
                    disconnect: [{ id: wardId }]
                },
            },
        });
        const userWithWards = await panel.user.findUnique({
            where: { id: userId },
            include: {
                ward: {
                    select: {
                        id: true,
                        ward_no: true,
                        name: true,
                        ward_code: true,
                        area: true,
                        recstatus: true,
                    },
                },
            },
        });

        if (!userWithWards) {
            return genrateResponse(res, HttpStatus.NotFound, "User not found");
        }

        const mappedData = {
            userId: userWithWards.id,
            username: userWithWards.username,
            wards: userWithWards.ward,
        };

        return genrateResponse(
            res,
            HttpStatus.OK,
            "Wards mapped successfully",
            encryptData(mappedData)
        );
    } catch (err: any) {
        console.error(`[${new Date().toISOString()}]`, err);
        return genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message || "Something went wrong"
        );
    }
}

export const mapPermissionToUser = async (req: Request, res: Response) => {
    try {
        const { iv, ed } = req.body;
        const data = decryptData({ encryptedData: ed as string, iv: iv as string });

        const userId = Number(data.userId);
        const permissionIds: number[] = data.permissionId;

        // 🔹 Assign permissions to user
        await panel.user.update({
            where: { id: userId },
            data: {
                permissions: {
                    connect: permissionIds.map(id => ({ id })),
                },
            },
        });

        // 🔹 Get updated user with permissions
        const updatedUser = await panel.user.findUnique({
            where: { id: userId },
            include: {
                permissions: {
                    select: {
                        id: true,
                        name: true,
                        ulb_id: true,
                    },
                },
            },
        });

        if (!updatedUser) {
            return genrateResponse(res, HttpStatus.NotFound, "User not found");
        }

        const mappedData = {
            userId: updatedUser.id,
            username: updatedUser.username,
            permissions: updatedUser.permissions,
        };

        return genrateResponse(
            res,
            HttpStatus.OK,
            "Permissions mapped successfully",
            encryptData(mappedData)
        );
    } catch (err: any) {
        console.error(`[${new Date().toISOString()}]`, err);
        return genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message || "Something went wrong"
        );
    }
};

export const removePermissionFromUser = async (req: Request, res: Response) => {
    try {
        const { iv, ed } = req.body;
        const data = decryptData({ encryptedData: ed as string, iv: iv as string })

        const userId = Number(data.userId)
        const permissionId = Number(data.id)

        await panel.user.update({
            where: { id: userId },
            data: {
                permissions: {
                    disconnect: [{ id: permissionId }]
                }
            }
        })

        const updatedUser = await panel.user.findUnique({
            where: { id: userId },
            include: {
                permissions: {
                    select: {
                        id: true,
                        name: true,
                        ulb_id: true
                    }
                }
            }
        })
        if (!updatedUser) {
            return genrateResponse(res, HttpStatus.NotFound, "User not found");
        }

        const mappedData = {
            userId: updatedUser.id,
            username: updatedUser.username,
            permission: updatedUser.permissions
        }
        return genrateResponse(
            res,
            HttpStatus.OK,
            "Permissions mapped successfully",
            encryptData(mappedData)
        );
    } catch (err: any) {
        console.error(`[${new Date().toISOString()}]`, err);
        return genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message || "Something went wrong"
        );
    }
}

export const connectUlb = async (req: Request, res: Response) => {
    try {
        const { iv, ed } = req.body;
        const data = decryptData({ encryptedData: ed as string, iv: iv as string });

        const { user_id, ulb_id } = data;

        if (!user_id || ulb_id?.length === 0) {
            return genrateResponse(res, HttpStatus.BadRequest, "Both User ID and ULB ID(s) are required");
        }

        await panel.user.update({
            where: {
                id: Number(user_id)
            },
            data: {
                ulb: {
                    connect: ulb_id.map((id: number) => ({ id }))
                }
            }
        })

        genrateResponse(
            res,
            HttpStatus.OK,
            `ULB connected successfully`
        );
    } catch (err: any) {
        genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message as string
        );
    }
}

export const disconnectUlb = async (req: Request, res: Response) => {
    try {
        const { iv, ed } = req.body;
        const data = decryptData({ encryptedData: ed as string, iv: iv as string });

        const { user_id, ulb_id } = data;

        if (!user_id || !ulb_id) {
            return genrateResponse(res, HttpStatus.BadRequest, "Both User ID and ULB ID are required");
        }

        await panel.user.update({
            where: {
                id: Number(user_id)
            },
            data: {
                ulb: {
                    disconnect: {
                        id: Number(ulb_id)
                    }
                }
            }
        })

        genrateResponse(
            res,
            HttpStatus.OK,
            `ULB disconnected successfully`
        );
    } catch (err: any) {
        genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message as string
        );
    }
}

export const connectRole = async (req: Request, res: Response) => {
    try {
        const { iv, ed } = req.body;
        const data = decryptData({ encryptedData: ed as string, iv: iv as string });

        const { user_id, roles } = data;
        console.log("Updating user:", user_id, "with roles:", roles);


        if (!user_id || roles?.length === 0) {
            return genrateResponse(res, HttpStatus.BadRequest, "Both User ID and Role(s) are required");
        }

        await panel.user.update({
            where: {
                id: Number(user_id)
            },
            data: {
                roles: {
                    connect: roles.map((id: number) => ({ id }))
                }
            }
        })

        genrateResponse(
            res,
            HttpStatus.OK,
            `Role(s) connected successfully`
        );
    } catch (err: any) {
        genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message as string
        );
    }
}

export const disconnectRole = async (req: Request, res: Response) => {
    try {
        const { iv, ed } = req.body;
        const data = decryptData({ encryptedData: ed as string, iv: iv as string });

        const { user_id, role } = data;

        if (!user_id || !role) {
            return genrateResponse(res, HttpStatus.BadRequest, "Both User ID and Role ID are required");
        }

        await panel.user.update({
            where: {
                id: Number(user_id)
            },
            data: {
                roles: {
                    disconnect: {
                        id: Number(role)
                    }
                }
            }
        })

        genrateResponse(
            res,
            HttpStatus.OK,
            `Role disconnected successfully`
        );
    } catch (err: any) {
        genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message as string
        );
    }
}


export const getModuleByEmployeeId = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUser = req.user as any;
        const userId = currentUser.userId;
        const ulb_id = req.query.ulb_id

        // 🔹 Fetch user with roles, permissions, revokedPermissions
        const user = await panel.user.findUnique({
            where: { id: userId },
            include: {
                roles: {
                    ...(ulb_id && {
                        where: {
                            ulb_id: Number(ulb_id)
                        }
                    }),
                    include: {
                        permissions: {
                            include: { menus: true },
                        },
                    },
                },
                permissions: true,
                revokedPermissions: true,
            },
        });

        if (!user) {
            return genrateResponse(res, HttpStatus.NotFound, "User not found");
        }

        let permissions = new Set<string>();
        let menus: any[] = [];

        // 🔹 Check if Super Admin
        const isSuperAdmin = user.roles.some(role => role.name === "super-admin");

        if (isSuperAdmin) {
            //  Super Admin → get all active permissions & menus
            const allPermissions = await panel.permissions.findMany();
            permissions = new Set(allPermissions.map(p => p.name));

            const allMenus = await panel.menu.findMany({
                where: { recstatus: 1 }, //  only active menus
                orderBy: {
                    order: 'desc'
                }
            });

            menus = buildMenuTree(
                allMenus.map(menu => ({
                    id: menu.id,
                    label: menu.label,
                    path: menu.path,
                    parentId: menu.parentId ?? null,
                    recstatus: menu.recstatus, //  return recstatus in response
                }))
            );
        } else {
            //  Normal user → aggregate permissions & menus
            permissions = new Set<string>(
                user.roles.flatMap(role => role.permissions.map(p => p.name))
            );

            user.permissions.forEach(p => permissions.add(p.name));
            user.revokedPermissions.forEach(p => permissions.delete(p.name));

            // Collect menus
            const menuMap = new Map<
                number,
                { id: number; label: string; path: string; parentId: number | null; recstatus: number }
            >();

            // Menus from roles' permissions
            user.roles.forEach(role => {
                role.permissions.forEach(permission => {
                    permission.menus
                        .filter(menu => menu.recstatus === 1) //  only active menus
                        .forEach(menu => {
                            menuMap.set(menu.id, {
                                id: menu.id,
                                label: menu.label,
                                path: menu.path,
                                parentId: menu.parentId ?? null,
                                recstatus: menu.recstatus, // ✅ return recstatus
                            });
                        });
                });
            });

            menus = buildMenuTree(Array.from(menuMap.values()));
        }

        return genrateResponse(res, HttpStatus.OK, "Menus fetched successfully", {
            // permissions: Array.from(permissions),
            menus,
        });
    } catch (err: any) {
        return genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message || "Something went wrong"
        );
    }
};






