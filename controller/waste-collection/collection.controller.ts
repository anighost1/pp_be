import { Request, Response } from "express"
import convertBigIntToString from "../../lib/bigIntConversion"
import genrateResponse from "../../lib/generateResponse"
import HttpStatus from "../../lib/httpStatus"
import { PrismaClient as userChargeClient, Prisma } from '../../generated/user_charge'
import { PrismaClient as panelClient } from '../../generated/panel'
import { AuthenticatedRequest } from "../../middleware/authMiddleware"
import { AuthPayload } from "../../type/common.type"
import { docUploaderLocal } from "../../lib/docUploader"

const userCharge = new userChargeClient()
const panel = new panelClient()

export const markWorkDone = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const {
            user_charge,
            img,
            lat,
            long
        } = req.body

        const currentUser = req.user as AuthPayload


        genrateResponse(
            res,
            HttpStatus.OK,
            'Survey created successfully',
            // convertBigIntToString(data)
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