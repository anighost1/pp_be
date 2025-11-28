import { Request, Response } from "express";
import genrateResponse from "../../lib/generateResponse";
import HttpStatus from "../../lib/httpStatus";
import { AuthenticatedRequest } from "../../middleware/authMiddleware";
import convertBigIntToString from "../../lib/bigIntConversion";

import { PrismaClient as panelClient } from '../../generated/panel'
import { PrismaClient as userChargeClient, Prisma } from '../../generated/user_charge'

const panel = new panelClient()
const user_charge = new userChargeClient()

export const getOdc = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const skip = (page - 1) * limit
    const currentUser = req?.user as any

    const where: Prisma.on_demand_collectionWhereInput = {
      AND: [
        {
          recstatus: 1
        }
        // {
        //   user_id: Number(currentUser?.userId)
        // }
      ]
    }

    const totalCount = await user_charge.on_demand_collection.count()

    const odc = await user_charge.on_demand_collection.findMany({
      where,
      include: {
        vehicle_type: {
          select: {
            name: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { id: "desc" }
    })

    await Promise.all(
      odc.map(async (item: any) => {
        const userData = await panel.user.findFirst({
          where: {
            id: Number(item.user_id)
          },
          select: {
            username: true,
            phone: true
          }
        })
        item.username = userData?.username

        const user_charge_data = await user_charge.user_charge_data.findFirst({
          where: {
            mobile: userData?.phone
          },
          select: {
            integrated_owner_name: true
          }
        })

        item.name = user_charge_data?.integrated_owner_name
      })
    )

    genrateResponse(
      res,
      HttpStatus.OK,
      'ODC fetched successfully',
      convertBigIntToString(odc),
      {
        pagination: {
          pagination: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
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
