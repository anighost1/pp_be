import { Request, Response } from "express";
import genrateResponse from "../../lib/generateResponse";
import HttpStatus from "../../lib/httpStatus";
import { decryptData, encryptData } from "../../lib/apiCryptography";
import { AuthenticatedRequest } from "../../middleware/authMiddleware";
import { AuthPayload } from "../../type/common.type";
import convertBigIntToString from "../../lib/bigIntConversion";

import { PrismaClient, Prisma } from "../../generated/user_charge";

const pp_user = new PrismaClient();

export const getConsumerList = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    // const { iv, encryptedData } = req.query;
    // const decryptedData = decryptData({
    //   encryptedData: encryptedData as string,
    //   iv: iv as string,
    // });

    const { searchValue, page = "1", limit = "10", tagged } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Build dynamic filters
    const filters: Prisma.user_charge_dataWhereInput[] = [];

    if (searchValue) {
      filters.push({
        OR: [
          {
            integrated_property_id: {
              contains: String(searchValue),
              mode: "insensitive",
            },
          },
          { mobile: { contains: String(searchValue), mode: "insensitive" } },
          {
            owner_name: { contains: String(searchValue), mode: "insensitive" },
          },
          { colony: { contains: String(searchValue), mode: "insensitive" } },
          { address: { contains: String(searchValue), mode: "insensitive" } },
        ],
      });
    }

    if (tagged) {
      if (tagged == "tagged") {
        filters.push({
          is_tagged: true,
        });
      }
      if (tagged == "untagged") {
        filters.push({
          is_tagged: false,
        });
      }
    }

    const where: Prisma.user_charge_dataWhereInput = filters.length
      ? { AND: filters }
      : {};

    // Fetch paginated results
    const [data, total] = await Promise.all([
      pp_user.user_charge_data.findMany({
        where,
        select: {
          id: true,
          mc_name: true,
          pid_type: true,
          property_id: true,
          owner_name: true,
          integrated_property_id: true,
          integrated_owner_name: true,
          latitude: true,
          longitude: true,
          authority: true,
          colony: true,
          address: true,
          mobile: true,
          category: true,
          type: true,
          sub_type: true,
          area: true,
          unit: true,
          authorized_area: true,
          property_image: true,
          bill_sequence: true,
          is_tagged: true,
        },
        orderBy: { id: "desc" },
        skip,
        take: limitNumber,
      }),
      pp_user.user_charge_data.count({ where }),
    ]);

    // Send paginated response
    genrateResponse(
      res,
      HttpStatus.OK,
      "Consumer List Fetched Successfully",
      convertBigIntToString(data),
      {
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber),
        },
      }
    );
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(
      res,
      err?.status || HttpStatus.BadRequest,
      err?.message || "An error occurred while fetching consumer data"
    );
  }
};
