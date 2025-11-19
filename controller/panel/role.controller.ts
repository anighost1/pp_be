import { Request, Response } from 'express';
import { PrismaClient as panelClient } from '../../generated/panel'
import genrateResponse from '../../lib/generateResponse';
import HttpStatus from '../../lib/httpStatus';
import { decryptData, encryptData } from '../../lib/apiCryptography';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
import { AuthPayload } from '../../type/common.type';
import { createRole, getRoles, toggleRole } from '../../dal/panel.dal';

const panel = new panelClient()

export const create = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { role_name, permission_names, ulb_id } = req.body

        let formattedPermissionNames: any[] = [];

        if (Array.isArray(permission_names) && permission_names.length > 0) {
            formattedPermissionNames = permission_names.map((id: number) => ({
                id: id,
            }));
        } else {
            formattedPermissionNames = [];
        }


        // const formattedPermissionNames: any[] = permission_names.map((name: string) => ({ name: name.trim() }));

        const createdRole = await createRole(role_name, ulb_id, formattedPermissionNames);

        genrateResponse(
            res,
            HttpStatus.OK,
            'Role created successfully',
            // encryptData(createdRole)
            createdRole
        )
    } catch (err: any) {
        console.error(`[${new Date().toISOString()}]`, err)
        if (err.code === 'P2002') {
            genrateResponse(
                res,
                HttpStatus.Conflict,
                'Role with this name already exists'
            )
        }
        genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message as string
        )
    }
}

export const getAll = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { role_name, permission_name, status, page, limit } = req.query

        const roles = await getRoles({ name: role_name as string, recstatus: status as string, permission: permission_name as string }, { page: Number(page), limit: Number(limit) } as any);

        genrateResponse(
            res,
            HttpStatus.OK,
            'Roles fetched successfully',
            encryptData({
                data: roles?.data,
                pagination: roles?.pagination
            }),

        )
    } catch (err: any) {
        console.error(`[${new Date().toISOString()}]`, err)
        genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message as string
        )
    }
}

export const getById = async (req: Request, res: Response) => {
    try {
        const { iv, ed } = req.query
        const decryptedData = decryptData({ encryptedData: ed as string, iv: iv as string })

        const role = await panel.role.findUnique({
            where: { id: Number(decryptedData.id) },
            include: {
                permissions: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
        })

        if (!role) {
            return genrateResponse(res, HttpStatus.NotFound, 'No role found not found');
        }

        genrateResponse(
            res,
            HttpStatus.OK,
            'Role fetched successfully',
            encryptData(role)
        );
    } catch (err: any) {
        console.error(`[${new Date().toISOString()}]`, err);
        genrateResponse(res, err?.status || HttpStatus.BadRequest, err?.message);
    }
};

export const update = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { iv, ed } = req.body

        const decryptedData = decryptData({ encryptedData: ed as string, iv: iv as string })

        const updatedRole = await panel.role.update({
            where: {
                id: decryptedData?.id
            },
            data: {
                name: decryptedData?.roleName,
                ...(decryptedData?.ulb_id && { ulb_id: Number(decryptedData?.ulb_id) }),
                permissions: {
                    set: decryptedData?.permission_names.map((permission: number) => ({ id: permission }))
                }
            }
        })

        genrateResponse(
            res,
            HttpStatus.OK,
            'Role updated successfully',
            encryptData(updatedRole)
        )
    } catch (err: any) {
        console.error(`[${new Date().toISOString()}]`, err)
        genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message as string
        )
    }
}

export const toggle = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { iv, ed } = req.body

        const data = decryptData({ encryptedData: ed as string, iv: iv as string })

        const updatedRole = await toggleRole(data?.id);

        genrateResponse(
            res,
            HttpStatus.OK,
            `Role toggled to ${updatedRole?.recstatus} successfully`,
            encryptData(updatedRole)
        )
    } catch (err: any) {
        console.error(`[${new Date().toISOString()}]`, err)
        genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message as string
        )
    }
}