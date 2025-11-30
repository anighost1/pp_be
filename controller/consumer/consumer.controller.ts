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


    await Promise.all(
      data.map(async (consumer: any) => {
        const wasteCollectionStatus = await getCurrentWasteCollectionStatus(Number(consumer?.id))
        consumer.current_waste_collection_status = wasteCollectionStatus
      })
    )

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


export const getCurrentWasteCollectionStatus = async (consumer_id: number): Promise<boolean> => {

  const now = new Date();

  const hour = now.getHours();

  let slotStart: Date;
  let slotEnd: Date;

  if (hour < 12) {
    slotStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    slotEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 59, 59);
  } else {
    slotStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    slotEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  }

  const count = await pp_user.waste_collection.count({
    where: {
      user_charge_id: Number(consumer_id),
      created_at: {
        gte: slotStart,
        lte: slotEnd,
      },
    },
  });

  return count > 0;
}

export const getCurrentWasteCollectionStatusWithDate = async (consumer_id: number): Promise<any> => {

  const now = new Date();

  const hour = now.getHours();

  let slotStart: Date;
  let slotEnd: Date;

  if (hour < 12) {
    slotStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    slotEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 59, 59);
  } else {
    slotStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    slotEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  }

  console.log(consumer_id)

  const count = await pp_user.waste_collection.findMany({
    where: {
      user_charge_id: Number(consumer_id),
      created_at: {
        gte: slotStart,
        lte: slotEnd,
      },
    },
    select: {
      created_at: true
    },
    orderBy: {
      created_at: 'desc'
    }
  });
  
  console.log(count)

  return {
    collectionStatus: count.length > 0,
    lastCollectionDate: count.length > 0 ? count[0].created_at : null
  }
}