import { Request, Response } from 'express';
import { PrismaClient as panelClient } from '../../generated/panel'
import { PrismaClient as userChargeClient, Prisma } from '../../generated/user_charge'
import genrateResponse from '../../lib/generateResponse';
import HttpStatus from '../../lib/httpStatus'
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
import convertBigIntToString from '../../lib/bigIntConversion';

const panel = new panelClient()
const user_charge = new userChargeClient()

export const createGrievance = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { mobile, email, remark } = req.body

        const currentUser = req?.user as any

        await user_charge.grievance.create({
            data: {
                user_id: Number(currentUser?.userId),
                mobile: String(mobile),
                remark: String(remark),
                ...(email && { email: String(email) }),
                entry_ip: req.ip
            }
        })

        genrateResponse(res, HttpStatus.OK, 'Grievance created successfully');
    } catch (err: any) {
        console.error(`[${new Date().toISOString()}]`, err);
        genrateResponse(res, err?.status || HttpStatus.BadRequest, err?.message || 'Fetching failed');
    }
};

export const getGrievances = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const page = Number(req.query.page) || 1
        const limit = Number(req.query.limit) || 10
        const skip = (page - 1) * limit
        const currentUser = req?.user as any

        const where: Prisma.grievanceWhereInput = {
            AND: [
                {
                    user_id: Number(currentUser?.userId)
                }
            ]
        }

        const totalCount = await user_charge.grievance.count()

        const grievance = await user_charge.grievance.findMany({
            where,
            skip,
            take: limit,
            orderBy: { id: "desc" }
        })

        await Promise.all(
            grievance.map(async (item: any) => {
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
            'Grievances fetched successfully',
            convertBigIntToString(grievance),
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