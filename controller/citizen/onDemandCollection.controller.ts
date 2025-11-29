import { Request, Response } from 'express';
import { PrismaClient as panelClient } from '../../generated/panel'
import { PrismaClient as userChargeClient, Prisma } from '../../generated/user_charge'
import genrateResponse from '../../lib/generateResponse';
import HttpStatus from '../../lib/httpStatus'
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
import convertBigIntToString from '../../lib/bigIntConversion';

const panel = new panelClient()
const user_charge = new userChargeClient()

export const getVehicleType = async (req: AuthenticatedRequest, res: Response) => {
    try {

        const vehicle_type = await user_charge.vehicle_type.findMany({
            where: {
                recstatus: 1
            }
        })

        genrateResponse(
            res,
            HttpStatus.OK,
            'Vehicle type fetched successfully',
            vehicle_type
        )
    } catch (err: any) {
        console.error(`[${new Date().toISOString()}]`, err);
        genrateResponse(res, err?.status || HttpStatus.BadRequest, err?.message || 'Fetching failed');
    }
};

export const createOdc = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { mobile, email, remark, address, vehicle_type } = req.body

        const currentUser = req?.user as any

        await user_charge.on_demand_collection.create({
            data: {
                user_id: Number(currentUser?.userId),
                vehicle_type_id: Number(vehicle_type),
                mobile: String(mobile),
                ...(remark && { remark: String(remark) }),
                ...(email && { email: String(email) }),
                entry_ip: req.ip,
                address: String(address)
            }
        })

        genrateResponse(res, HttpStatus.OK, 'ODC created successfully');
    } catch (err: any) {
        console.error(`[${new Date().toISOString()}]`, err);
        genrateResponse(res, err?.status || HttpStatus.BadRequest, err?.message || 'Creation failed');
    }
};

export const getOdc = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const page = Number(req.query.page) || 1
        const limit = Number(req.query.limit) || 10
        const skip = (page - 1) * limit
        const currentUser = req?.user as any

        const where: Prisma.on_demand_collectionWhereInput = {
            AND: [
                {
                    user_id: Number(currentUser?.userId),
                    recstatus: 1
                }
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
                        username: true
                    }
                })
                item.username = userData?.username
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