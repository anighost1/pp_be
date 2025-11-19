import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/authMiddleware";
import { AuthPayload } from "../../type/common.type";
import { PrismaClient as panelClient } from '../../generated/panel'
import genrateResponse from "../../lib/generateResponse";
import HttpStatus from "../../lib/httpStatus";
import { decryptData, encryptData } from "../../lib/apiCryptography";


const panel = new panelClient()


export const createModule = async (req: AuthenticatedRequest, res: Response) => {
  try {

    const { moduleName, ulb_id } = req.body

    const module = await panel.module.create({
      data: {
        name: moduleName,
        ulb_id: ulb_id
      }

    });
    genrateResponse(
      res,
      HttpStatus.OK,
      'Module Created successfully',
      encryptData(module)
    )

  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(
      res,
      err?.status || HttpStatus.BadRequest,
      err?.message as string
    );
  }
}

export const getAllModule = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const skip = (page - 1) * limit

    const totalCount = await panel.module.count()
    const module = await panel.module.findMany({
      skip,
      take: limit,
      orderBy: { id: "desc" }
    })
    genrateResponse(
      res,
      HttpStatus.OK,
      'Module Fetched sucessfully',
      encryptData({
        data: module,
        pagination: totalCount, page, limit, totalPages: Math.ceil(totalCount / limit)
      })
    )

  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(
      res,
      err?.status || HttpStatus.BadRequest,
      err?.message as string
    )
  }
}

export const getModuleById = async (req: Request, res: Response) => {
  try {
    const { iv, ed } = req.query
    const data = decryptData({ encryptedData: ed as string, iv: iv as string })

    const module = await panel.module.findUnique({
      where: { id: Number(data?.id) }
    });
    if (!module) {
      return genrateResponse(res, HttpStatus.BadRequest, 'Agency not found')
    }
    genrateResponse(
      res,
      HttpStatus.OK,
      'Module Fetched successfully',
      encryptData(module)
    )

  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(res, err?.status || HttpStatus.BadRequest, err?.message);
  }
}

export const updateModuleById = async (req: Request, res: Response) => {
  try {
    const { iv, ed } = req.body;
    const data = decryptData({ encryptedData: ed as string, iv: iv as string })

    const moduleUpdate = await panel.module.update({
      where: { id: Number(data.id) },
      data: {
        name: data.moduleName,
        ...(data?.ulb_id && { ulb_id: data?.ulb_id })
      }
    })
    genrateResponse(
      res,
      HttpStatus.OK,
      'Module Updated Successfully',
      encryptData(moduleUpdate)
    )

  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(res, err?.status || HttpStatus.BadRequest, err?.message);
  }
}

export const toggleModule = async (req: Request, res: Response) => {
  try {
    const { iv, ed } = req.body;
    const data = decryptData({ encryptedData: ed as string, iv: iv as string })

    const prevStatus = await panel.module.findUnique({
      where: { id: Number(data?.id) },
      select: { recstatus: true },
    });

    if (!prevStatus) {
      return genrateResponse(res, HttpStatus.NotFound, "Not Found")
    }

    const newStatus = prevStatus.recstatus === 1 ? 0 : 1;

    const updatedStatus = await panel.module.update({
      where: { id: Number(data?.id) },
      data: { recstatus: newStatus }
    })
    genrateResponse(
      res,
      HttpStatus.OK,
      `Module toggled to ${updatedStatus.recstatus} successfully`,
      encryptData(updatedStatus)
    )

  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(
      res,
      err?.status || HttpStatus.BadRequest,
      err?.message as string
    );
  }
}
