import { AuthenticatedRequest } from "../../middleware/authMiddleware";
import { AuthPayload } from "../../type/common.type";
import { PrismaClient as panelClient } from '../../generated/panel'
import genrateResponse from "../../lib/generateResponse";
import HttpStatus from "../../lib/httpStatus";
import { decryptData, encryptData } from "../../lib/apiCryptography";
import { Request, Response } from "express";

const panel = new panelClient()

export const createBank = async(req:Request, res:Response)=>{
    try{
    

      const {bankName} = req.body;

      const bank = await panel.bank.create({
      data: {
        name: bankName
       
      },
    });
      genrateResponse(
        res,
        HttpStatus.OK,
        'Bank created successfully',
        encryptData(bank)
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

export const getAllBank = async(req: Request, res:Response)=>{
    try{
        const page =Number(req.query.page)||1
        const limit = Number(req.query.limit) || 10
        const skip = (page-1) * limit

        const totalCount = await panel.bank.count()

        const bank = await panel.bank.findMany({
            skip,
            take: limit,
            orderBy:{id: "desc"}
        })
        genrateResponse(
            res,
            HttpStatus.OK,
            'All Bank fetched successfully',
            encryptData({data:bank, pagination: totalCount, page, limit, totalPages:Math.ceil(totalCount/limit)})
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

export const getBankById = async(req: Request, res: Response)=>{
    try{
        const {iv, ed} = req.query
        const data = decryptData({encryptedData: ed as string, iv: iv as string})

        const bank = await panel.bank.findUnique({
            where:{id: Number(data?.id)}
        });
        if(!bank){
            return genrateResponse(res, HttpStatus.BadRequest, 'Agency not found')
        }
        genrateResponse(
            res, 
            HttpStatus.OK,
            'Bank Fetched successfully',
            encryptData(bank)
        )

    }catch(err: any){
      console.error(`[${new Date().toISOString()}]`, err);
         genrateResponse(res, err?.status || HttpStatus.BadRequest, err?.message);
    }
}

export const updateBankById = async(req: Request, res:Response )=>{
  try{
    const {iv, ed} = req.body;
    const data = decryptData({encryptedData:ed as string, iv: iv as string})
    
    const bankUpdate = await panel.bank.update({
      where: {id: Number(data.id)},
      data:{
           name: data.bankName
           
      }
    })
    genrateResponse(
      res,
      HttpStatus.OK,
      'Bank Updated Successfully',
      encryptData(bankUpdate)
    )

  }catch(err:any){
    console.error(`[${new Date().toISOString()}]`, err);
   genrateResponse(res, err?.status || HttpStatus.BadRequest, err?.message);
  }
}

export const toggleBank = async(req:Request, res:Response)=>{
  try{
    const {iv, ed} = req.body;
    const data = decryptData({encryptedData:ed as string, iv: iv as string})
    
  const prevStatus = await panel.bank.findUnique({
      where: { id: Number(data?.id) },
      select: { recstatus: true },
    });

    if(!prevStatus){
      return genrateResponse(res, HttpStatus.NotFound,"Not Found")
    }

    const newStatus = prevStatus.recstatus ===1?0:1;

    const updatedStatus = await panel.bank.update({
      where:{id: Number(data?.id)},
      data: {recstatus: newStatus}
    })
    genrateResponse(
      res,
      HttpStatus.OK,
 `Bank toggled to ${updatedStatus.recstatus} successfully`,
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


