import { Request, Response } from "express"
import { decryptData, encryptData } from "../../lib/apiCryptography"
import convertBigIntToString from "../../lib/bigIntConversion"
import genrateResponse from "../../lib/generateResponse"
import HttpStatus from "../../lib/httpStatus"

export const decryption = async (req: Request, res: Response) => {
    try {
        const { encryptedData, iv } = req?.body

        const data = decryptData({ encryptedData, iv })

        genrateResponse(
            res,
            HttpStatus.OK,
            'Data decrypted successfully',
            convertBigIntToString(data)
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

export const encryption = async (req: Request, res: Response) => {
    try {
        const { data } = req?.body

        const encryptedData = encryptData(data)

        genrateResponse(
            res,
            HttpStatus.OK,
            'Data encrypted successfully',
            convertBigIntToString(encryptedData)
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