import { AuthenticatedRequest } from "../../middleware/authMiddleware";
import { AuthPayload } from "../../type/common.type";
import { PrismaClient as panelClient } from '../../generated/panel'
import { Request, Response } from "express";
import genrateResponse from "../../lib/generateResponse";
import HttpStatus from "../../lib/httpStatus";
import { decryptData, encryptData } from "../../lib/apiCryptography";

const panel = new panelClient()

export const createWardList = async(req:Request, res:Response)=>{
    try{
      const {zoneCircleId, wardNo, wardName, wardCode, wardArea} = req.body;
      const wardList = await panel.ward_master.create({
      data: {
        zone_circle_id: zoneCircleId,
        ward_no: wardNo,
        name: wardName,
        ward_code: wardCode,
        area: wardArea,
        
      },
    });
      genrateResponse(
        res,
        HttpStatus.OK,
        'Ward created successfully',
        encryptData(wardList)
      )
    }catch(err: any){
      console.error(`[${new Date().toISOString()}]`, err);
       genrateResponse(
      res,
      err?.status || HttpStatus.BadRequest,
      err?.message as string
    );
    }
}

export const getWardList = async(req:Request, res:Response)=>{
      try{
        const page = Number(req.query.page) || 1
        const limit = Number(req.query.limit) || 10
        const skip = (page-1) * limit

        const totalCount = await panel.ward_master.count()

        const zoneList = await panel.ward_master.findMany({
            skip,
            take:limit,
            orderBy:{id:"desc"}
        })
        genrateResponse(
            res,
            HttpStatus.OK,
            'All Ward List fetched successfully',
            encryptData({data:zoneList, pagination: totalCount, page, limit, totalPages:Math.ceil(totalCount/limit)})
        )

    }catch(err:any){
      console.error(`[${new Date().toISOString()}]`, err);
     genrateResponse(
      res,
      err?.status || HttpStatus.BadRequest,
      err?.message as string
    )
    }
}

export const getWardById = async(req: Request, res: Response)=>{
    try{
       const {iv, ed} = req.query;
       const data = decryptData({encryptedData: ed as string, iv: iv as string})

       const zone = await panel.ward_master.findUnique({
        where:{id: Number(data?.id)}
       })
       if(!zone){
        return genrateResponse(res, HttpStatus.NotFound, 'Ward Not found')
       }
       genrateResponse(
        res, 
        HttpStatus.OK,
        'Ward fetched successfully',
        encryptData(zone)
       )
    }catch(err:any){
      console.error(`[${new Date().toISOString()}]`, err);
        genrateResponse(res, err?.status || HttpStatus.BadRequest, err?.message);
    }
}

export const updateWardById = async(req: Request, res:Response )=>{
  try{
    const {iv, ed} = req.body;
    const data = decryptData({encryptedData:ed as string, iv: iv as string})
    
    const wardUpdate = await panel.ward_master.update({
      where: {id: Number(data.id)},
      data:{
           zone_circle_id: data.zoneCircleId,
        ward_no: data.wardNo,
        name: data.wardName,
        ward_code: data.wardCode,
        area: data.wardArea,
      }
    })
    genrateResponse(
      res,
      HttpStatus.OK,
      'Ward Updated Successfully',
      encryptData(wardUpdate)
    )

  }catch(err:any){
    console.error(`[${new Date().toISOString()}]`, err);
   genrateResponse(res, err?.status || HttpStatus.BadRequest, err?.message);
  }
}

export const toggleWard = async(req:Request, res:Response)=>{
  try{
    const {iv, ed} = req.body;
    const data = decryptData({encryptedData:ed as string, iv: iv as string})
    
  const prevStatus = await panel.ward_master.findUnique({
      where: { id: Number(data?.id) },
      select: { recstatus: true },
    });

    if(!prevStatus){
      return genrateResponse(res, HttpStatus.NotFound,"Not Found")
    }

    const newStatus = prevStatus.recstatus ===1?0:1;

    const updatedStatus = await panel.ward_master.update({
      where:{id: Number(data?.id)},
      data: {recstatus: newStatus}
    })
    genrateResponse(
      res,
      HttpStatus.OK,
 `Ward toggled to ${updatedStatus.recstatus} successfully`,
   encryptData(updatedStatus)
)

  }catch(err:any){
    console.error(`[${new Date().toISOString()}]`, err);
   genrateResponse(
      res,
      err?.status || HttpStatus.BadRequest,
      err?.message as string
    );
  }
}


// helpers/zoneHelper.ts
export const fetchUniqueZones = async (user: AuthPayload) => {
  if (!user.ward || user.ward.length === 0) return [];

  const wardIds = user.ward.map(w => w.id);

  const wards = await panel.ward_master.findMany({
    where: { id: { in: wardIds } },
    select: { zone_circle_id: true },
  });

  const uniqueZone = Array.from(new Set(wards.map(w => w.zone_circle_id)));

  return uniqueZone;
};


