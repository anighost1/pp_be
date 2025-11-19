import { Request, Response } from "express";
import generateResponse from "../../lib/generateResponse";
import HttpStatus from "../../lib/httpStatus";
import { AuthenticatedRequest } from "../../middleware/authMiddleware";
import convertBigIntToString from "../../lib/bigIntConversion";

import { PrismaClient, Prisma } from "../../generated/user_charge";

const pp_user = new PrismaClient();

export const getProperty = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { int_pid } = req.params
    const data = await pp_user.user_charge_data.findFirst({
      where: {
        integrated_property_id: String(int_pid)
      }
    })

    generateResponse(
      res,
      HttpStatus.OK,
      "Property Fetched Successfully",
      convertBigIntToString(data)
    );
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    generateResponse(
      res,
      err?.status || HttpStatus.BadRequest,
      err?.message || "An error occurred while fetching consumer data"
    );
  }
};
