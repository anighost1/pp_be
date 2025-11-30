import { Request, Response } from 'express';
import { PrismaClient as panelClient, user } from '../../generated/panel'
import { PrismaClient as userChargeClient } from '../../generated/user_charge'
import genrateResponse from '../../lib/generateResponse';
import HttpStatus from '../../lib/httpStatus'
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
import convertBigIntToString from '../../lib/bigIntConversion';
import { getCurrentWasteCollectionStatus, getCurrentWasteCollectionStatusWithDate } from '../consumer/consumer.controller';

const panel = new panelClient()
const user_charge = new userChargeClient()

export const getUserCharge = async (req: AuthenticatedRequest, res: Response) => {
    try {

        const currentUser = req?.user as any

        const userDetails = await panel.user.findFirst({
            where: {
                id: Number(currentUser?.userId)
            },
            select: {
                phone: true
            }
        })

        if (!userDetails) {
            throw new Error('No user data found')
        }

        const userChargeData: any = await user_charge.user_charge_data.findFirst({
            where: {
                mobile: String(userDetails?.phone)
            }
        })

        const { collectionStatus, lastCollectionDate } = await getCurrentWasteCollectionStatusWithDate(Number(userChargeData?.id))

        userChargeData.current_waste_collection_status = collectionStatus
        userChargeData.last_collection_date = lastCollectionDate

        genrateResponse(res, HttpStatus.OK, 'Data fetched successfully', convertBigIntToString(userChargeData));
    } catch (err: any) {
        console.error(`[${new Date().toISOString()}]`, err);
        genrateResponse(res, err?.status || HttpStatus.BadRequest, err?.message || 'Fetching failed');
    }
};

