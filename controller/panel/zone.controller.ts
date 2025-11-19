import { AuthenticatedRequest } from "../../middleware/authMiddleware";
import { AuthPayload } from "../../type/common.type";
import { PrismaClient as panelClient } from '../../generated/panel'
import genrateResponse from "../../lib/generateResponse";
import { Request, Response } from "express";
import HttpStatus from "../../lib/httpStatus";
import { decryptData, encryptData } from "../../lib/apiCryptography";

const panel = new panelClient()


export const createZoneList = async (req: AuthenticatedRequest, res: Response) => {
  try {

    const { zoneListName, zoneAddress, zoneCommissioner, zoneCommissionerNo, tollfreeNo, latitude, longitude, zoneCode, ulb_id } = req.body;

    const zoneList = await panel.zone_circle_master.create({
      data: {
        name: zoneListName,
        zonecode: zoneCode,
        ulb_id: ulb_id,
        zone_address: zoneAddress,
        zone_commissioner:zoneCommissioner,
        zon_commissioner_contact:zoneCommissionerNo,
        tollFree_No:tollfreeNo,
        latitude:latitude,
        longitude:longitude
      },
    });
    genrateResponse(
      res,
      HttpStatus.OK,
      'Zone created successfully',
      encryptData(zoneList)
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

export const getAllZoneList = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const skip = (page - 1) * limit

    const totalCount = await panel.zone_circle_master.count()

    const zoneList = await panel.zone_circle_master.findMany({
      skip,
      take: limit,
      orderBy: { id: "desc" }
    })
    genrateResponse(
      res,
      HttpStatus.OK,
      'All Zone List fetched successfully',
      encryptData({ data: zoneList, pagination: totalCount, page, limit, totalPages: Math.ceil(totalCount / limit) })
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

export const getZoneById = async (req: Request, res: Response) => {
  try {
    const { iv, ed } = req.query;
    const data = decryptData({ encryptedData: ed as string, iv: iv as string })

    const zone = await panel.zone_circle_master.findUnique({
      where: { id: Number(data?.id) }
    })
    if (!zone) {
      return genrateResponse(res, HttpStatus.NotFound, 'Zone Not found')
    }
    genrateResponse(
      res,
      HttpStatus.OK,
      'Zone fetched successfully',
      encryptData(zone)
    )
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(res, err?.status || HttpStatus.BadRequest, err?.message);
  }
}

export const updateZoneById = async (req: Request, res: Response) => {
  try {
    const { iv, ed } = req.body;
    const data = decryptData({ encryptedData: ed as string, iv: iv as string })

    const zoneUpdate = await panel.zone_circle_master.update({
      where: {id: Number(data.id)},
      data:{
           name: data.zoneListName,
           zonecode: data.zoneCode,
           zone_address:data.zoneAddress,
        zone_commissioner:data.zoneCommissioner,
        zon_commissioner_contact:data.zoneCommissionerNo,
        tollFree_No:data.tollfreeNo,
        latitude:data.latitude,
        longitude:data.longitude
           
      }
    })
    genrateResponse(
      res,
      HttpStatus.OK,
      'Zone Updated Successfully',
      encryptData(zoneUpdate)
    )

  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(res, err?.status || HttpStatus.BadRequest, err?.message);
  }
}

export const togglezone = async (req: Request, res: Response) => {
  try {
    const { iv, ed } = req.body;
    const data = decryptData({ encryptedData: ed as string, iv: iv as string })

    const prevStatus = await panel.zone_circle_master.findUnique({
      where: { id: Number(data?.id) },
      select: { recstatus: true },
    });

    if (!prevStatus) {
      return genrateResponse(res, HttpStatus.NotFound, "Not Found")
    }

    const newStatus = prevStatus.recstatus === 1 ? 0 : 1;

    const updatedStatus = await panel.zone_circle_master.update({
      where: { id: Number(data?.id) },
      data: { recstatus: newStatus }
    })
    genrateResponse(
      res,
      HttpStatus.OK,
      `Zone toggled to ${updatedStatus.recstatus} successfully`,
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