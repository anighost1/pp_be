import { Request, Response } from "express";
import genrateResponse from "../../lib/generateResponse";
import HttpStatus from "../../lib/httpStatus";
import { decryptData, encryptData } from "../../lib/apiCryptography";
import { AuthenticatedRequest } from "../../middleware/authMiddleware";
import { AuthPayload } from "../../type/common.type";
import convertBigIntToString from "../../lib/bigIntConversion";

import {
  PrismaClient as userChargeClient,
  Prisma as userChargePrisma,
} from "../../generated/user_charge";
import {
  PrismaClient as panelClient,
  Prisma as panelPrisma,
} from "../../generated/panel";

const pp_user = new userChargeClient();
const pp_panel = new panelClient();

export const getWasteCollectionList = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const {
      user_id,
      date_from,
      date_upto,
      searchValue,
      today,
      page = "1",
      limit = "10",
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Compute startDate and endDate
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (today === "true") {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (date_from || date_upto) {
      if (date_from) {
        startDate = new Date(String(date_from));
        startDate.setHours(0, 0, 0, 0);
      }
      if (date_upto) {
        endDate = new Date(String(date_upto));
        endDate.setHours(23, 59, 59, 999);
      }
    }

    // Build filters
    const filters: userChargePrisma.waste_collectionWhereInput[] = [];

    if (!searchValue) {
      if (startDate && endDate)
        filters.push({ created_at: { gte: startDate, lte: endDate } });
      else if (startDate) filters.push({ created_at: { gte: startDate } });
    }

    if (user_id) filters.push({ user_id: Number(user_id) });

    filters.push({ recstatus: 1 });

    if (searchValue) {
      filters.push({
        user_charge_data: {
          OR: [
            {
              integrated_property_id: {
                contains: String(searchValue),
                mode: "insensitive",
              },
            },
            {
              mobile: { contains: String(searchValue), mode: "insensitive" },
            },
            {
              owner_name: {
                contains: String(searchValue),
                mode: "insensitive",
              },
            },
            {
              colony: { contains: String(searchValue), mode: "insensitive" },
            },
            {
              address: { contains: String(searchValue), mode: "insensitive" },
            },
          ],
        },
      });
    }

    const where: userChargePrisma.waste_collectionWhereInput = filters.length
      ? { AND: filters }
      : {};

    // Fetch waste collection data
    const [data, total] = await Promise.all([
      pp_user.waste_collection.findMany({
        where,
        select: {
          id: true,
          user_id: true,
          user_charge_id: true,
          entry_ip: true,
          created_at: true,
          updated_at: true,
          user_charge_data: true,
        },
        orderBy: { id: "desc" },
        skip,
        take: limitNumber,
      }),
      pp_user.waste_collection.count({ where }),
    ]);

    // Fetch employee full names for all users in the current page
    const userIds = data.map((item) => item.user_id);
    const employees = await pp_panel.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true },
    });

    // Map employee full name into waste collection data
    const enrichedData = data.map((item) => {
      const employee = employees.find((e) => e.id === item.user_id);
      const fullName = employee?.username;

      return {
        ...convertBigIntToString(item),
        user_full_name: fullName,
      };
    });

    const response = {
      data: enrichedData,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };

    genrateResponse(
      res,
      HttpStatus.OK,
      "Waste Collection Details List Fetched Successfully",
      response
    );
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(
      res,
      err?.status || HttpStatus.BadRequest,
      err?.message || "An error occurred while fetching waste collection data"
    );
  }
};

export const getWasteCollectionDetails = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    // console.log("body",req?.body);

    const { id } = req.body;
    console.log("dc", id);

    if (!id) {
      return genrateResponse(
        res,
        HttpStatus.BadRequest,
        "Waste Collection ID is required"
      );
    }

    const wasteCollection = await pp_user.waste_collection.findFirst({
      where: { id: Number(id), recstatus: 1 },
      select: {
        id: true,
        user_id: true,
        user_charge_id: true,
        entry_ip: true,
        created_at: true,
        updated_at: true,
        user_charge_data: true,
      },
    });

    if (!wasteCollection) {
      return genrateResponse(
        res,
        HttpStatus.NotFound,
        "Waste Collection not found"
      );
    }

    // Fetch employee full name from employee table
    const employee = await pp_panel.user.findFirst({
      where: { id: wasteCollection.user_id },
      select: {
        username: true,
      },
    });

    const fullName = employee?.username;

    const responseData = {
      ...convertBigIntToString(wasteCollection),
      user_full_name: fullName,
    };

    return genrateResponse(
      res,
      HttpStatus.OK,
      "Waste Collection Details Fetched Successfully",
      responseData
    );
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    return genrateResponse(
      res,
      err?.status || HttpStatus.BadRequest,
      err?.message || "An error occurred while fetching waste collection data"
    );
  }
};
