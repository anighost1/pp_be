import { Request, Response } from 'express';
import { PrismaClient as panelClient } from '../../generated/panel'
import genrateResponse from '../../lib/generateResponse';
import HttpStatus from '../../lib/httpStatus';
import { decryptData, encryptData } from '../../lib/apiCryptography';
import { createPermission, getPermission, getPermissions, togglePermission, updatePermission } from '../../dal/panel.dal';
import { AuthenticatedRequest } from "../../middleware/authMiddleware";

const panel = new panelClient()

export const create = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { permission_names, ulb_id } = req.body

        const dataToInsert = permission_names.map((name: string) => ({ name, ulb_id }));

        const createdPermission = await createPermission(dataToInsert);

        genrateResponse(
            res,
            HttpStatus.OK,
            'Permission(s) created successfully',
            encryptData(createdPermission)
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

export const getOne = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { iv, ed } = req.query
        const id = decryptData({ encryptedData: ed as string, iv: iv as string })

        if (isNaN(Number(id))) {
            throw { status: HttpStatus.BadRequest, message: "Invalid id parameter" }
        }

        const permission = await getPermission(Number(id))

        genrateResponse(
            res,
            HttpStatus.OK,
            'Permission fetched successfully',
            encryptData(permission)
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

export const getAll = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { permission_name, status, page, limit } = req.query

        const permissions = await getPermissions({ name: permission_name as string, recstatus: status as string }, { page: Number(page), limit: Number(limit) } as any);

        genrateResponse(
            res,
            HttpStatus.OK,
            'Permissions fetched successfully',
            encryptData({
                data: permissions?.data,
                pagination: permissions?.pagination
            })
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

export const update = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { iv, ed } = req.body

        const dataToUpdate = decryptData({ encryptedData: ed as string, iv: iv as string })

        const updatedPermission = await updatePermission(dataToUpdate?.id, dataToUpdate.name, dataToUpdate?.ulb_id);

        genrateResponse(
            res,
            HttpStatus.OK,
            'Permission updated successfully',
            encryptData(updatedPermission)
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

        const updatedPermission = await togglePermission(data?.id);

        genrateResponse(
            res,
            HttpStatus.OK,
            `Permission toggled to ${updatedPermission?.recstatus} successfully`,
            encryptData(updatedPermission)
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
