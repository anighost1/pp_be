import { Request, Response } from 'express';
import { PrismaClient as panelClient } from '../../generated/panel'
// import convertBigIntToString from '../../lib/bigIntConversion';
import genrateResponse from '../../lib/generateResponse';
import HttpStatus from '../../lib/httpStatus';
// import { encryptData } from '../../lib/apiCryptography';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';
import { deleteById } from '../panel/employee.controller';

const panel = new panelClient()

const JWT_SECRET = process.env.JWT_SECRET

export function buildMenuTree(menus: Array<{ id: number; label: string; path: string; parentId: number | null }>) {
    const menusById = new Map<number, any>();
    const tree: any[] = [];

    // First, create placeholder entries for each menu
    menus.forEach(menu => {
        menusById.set(menu.id, { ...menu, children: [] });
    });

    // Assign children to parent menus
    menus.forEach(menu => {
        if (menu.parentId && menusById.has(menu.parentId)) {
            menusById.get(menu.parentId).children.push(menusById.get(menu.id));
        } else {
            tree.push(menusById.get(menu.id));
        }
    });

    return tree;
}

export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return genrateResponse(res, HttpStatus.BadRequest, 'Username and password are required');
        }

        const user = await panel.user.findUnique({
            where: { username },
            include: {
                roles: { include: { permissions: { include: { menus: true } } } },
                permissions: { include: { menus: true } },
                revokedPermissions: { include: { menus: true } },
                ulb: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                ward:{
                    select:{
                        id: true,
                        ward_no: true
                    }
                }
            },
        });

        if (!user) {
            return genrateResponse(res, HttpStatus.Unauthorized, 'Invalid credentials');
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return genrateResponse(res, HttpStatus.Unauthorized, 'Invalid credentials');
        }

        let permissions = new Set<any>();
        let menus: any[] = [];

        // 🔹 Check if Super Admin
        const isSuperAdmin = user.roles.some(role => role.name === "super-admin");

        if (isSuperAdmin) {
            // ✅ Super Admin → get all permissions & all menus
            const allPermissions = await panel.permissions.findMany();
            permissions = new Set(allPermissions.map(p => ({ id: p.id, name: p.name })));

            const allMenus = await panel.menu.findMany();
            menus = buildMenuTree(
                allMenus.map(menu => ({
                    id: menu.id,
                    label: menu.label,
                    path: menu.path,
                    parentId: menu.parentId ?? null,
                }))
            );

        } else {
            // ✅ Normal user → aggregate permissions & menus
            permissions = new Set<any>(
                user.roles.flatMap(role => role.permissions.map(p => ({ id: p.id, name: p.name, from: 'role' }))),
            );
            user.permissions.forEach(p => permissions.add({ id: p.id, name: p.name, from: 'permission' }));
            // user.revokedPermissions.forEach(p => permissions.delete(p.id));
            user.revokedPermissions.forEach(p => deleteById(permissions, p.id));

            // Collect menus
            const menuMap = new Map<number, { id: number; label: string; path: string; parentId: number | null }>();

            // Menus from roles' permissions
            user.roles.forEach(role => {
                role.permissions.forEach(permission => {
                    permission.menus.forEach(menu => {
                        menuMap.set(menu.id, {
                            id: menu.id,
                            label: menu.label,
                            path: menu.path,
                            parentId: menu.parentId ?? null,
                        });
                    });
                });
            });

            // Menus from user's direct permissions
            user.permissions.forEach(permission => {
                permission.menus.forEach(menu => {
                    menuMap.set(menu.id, {
                        id: menu.id,
                        label: menu.label,
                        path: menu.path,
                        parentId: menu.parentId ?? null,
                    });
                });
            });

            // Remove menus from revoked permissions
            user.revokedPermissions.forEach(permission => {
                permission.menus.forEach(menu => {
                    menuMap.delete(menu.id);
                });
            });

            const flatMenus = Array.from(menuMap.values());
            menus = buildMenuTree(flatMenus);
        }

        // Build JWT payload
        const payload = {
            userId: user.id,
            email: user.email,
            roles: user.roles.map(r => r.name),
            permissions: Array.from(permissions),
            ulb: user?.ulb.map((ulb) => ({ id: ulb?.id, name: ulb?.name })),
            ward: user?.ward.map((w)=>({
                id: w.id,
                ward_no: w.ward_no
            })),
            isSuperAdmin,
        };

        const token = jwt.sign(payload, String(JWT_SECRET), { expiresIn: '8h' });

        genrateResponse(res, HttpStatus.OK, 'Logged in successfully', token);
    } catch (err: any) {
        console.error(`[${new Date().toISOString()}]`, err);
        genrateResponse(res, err?.status || HttpStatus.BadRequest, err?.message || 'Login failed');
    }
};




// export const register = async (req: Request, res: Response) => {
//     try {
//         const { email, password, roleIds, permissionIds } = req.body;

//         // Basic validation
//         if (!email || !password) {
//             return genrateResponse(res, HttpStatus.BadRequest, 'Email and password are required');
//         }

//         // Check if user already exists
//         const existingUser = await panel.user.findUnique({ where: { email } });
//         if (existingUser) {
//             return genrateResponse(res, HttpStatus.BadRequest, 'Email already registered');
//         }

//         // Hash the password
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // Create user with optional roles and permissions
//         const user = await panel.user.create({
//             data: {
//                 email,
//                 password: hashedPassword,
//                 roles: roleIds ? { connect: roleIds.map((id: number) => ({ id })) } : undefined,
//                 permissions: permissionIds ? { connect: permissionIds.map((id: number) => ({ id })) } : undefined,
//             },
//         });

//         // Respond with success (you can omit password etc. from response)
//         genrateResponse(res, HttpStatus.OK, 'User registered successfully', { userId: user.id, email: user.email });
//     } catch (err: any) {
//         console.error(`[${new Date().toISOString()}]`, err);
//         genrateResponse(res, err?.status || HttpStatus.BadRequest, err?.message || 'Registration failed');
//     }
// };