import { Request, Response } from "express";
import genrateResponse from "../../lib/generateResponse";
import HttpStatus from "../../lib/httpStatus";
import { decryptData, encryptData } from "../../lib/apiCryptography";
import { AuthenticatedRequest } from "../../middleware/authMiddleware";
import { AuthPayload } from "../../type/common.type";
import convertBigIntToString from "../../lib/bigIntConversion";
import { io } from "../../index";

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

export const getSurveyList = async (
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

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    // ✅ Apply date logic only when no searchValue
    if (!searchValue) {
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
    }

    const filters: userChargePrisma.survey_masterWhereInput[] = [];

    // ✅ Only apply date filters when no searchValue
    if (!searchValue) {
      if (startDate && endDate)
        filters.push({ created_at: { gte: startDate, lte: endDate } });
      else if (startDate) filters.push({ created_at: { gte: startDate } });
    }

    if (user_id) filters.push({ user_id: Number(user_id) });

    filters.push({ recstatus: 1 });

    // ✅ Search filter (takes precedence)
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

    const where: userChargePrisma.survey_masterWhereInput = filters.length
      ? { AND: filters }
      : {};

    const [data, total] = await Promise.all([
      pp_user.survey_master.findMany({
        where,
        select: {
          id: true,
          user_id: true,
          user_charge_id: true,
          entry_ip: true,
          created_at: true,
          updated_at: true,
          doc_path: true,
          user_charge_data: true,
        },
        orderBy: { id: "desc" },
        skip,
        take: limitNumber,
      }),
      pp_user.survey_master.count({ where }),
    ]);

    const userIds = data
      .map((item) => item.user_id)
      .filter((id): id is number => id !== null && id !== undefined);

    const employees = await pp_panel.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true },
    });

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
      "Survey Details List Fetched Successfully",
      response
    );
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(
      res,
      err?.status || HttpStatus.BadRequest,
      err?.message || "An error occurred while fetching survey data"
    );
  }
};

export const getSurveyDetails = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.body;

    if (!id) {
      return genrateResponse(
        res,
        HttpStatus.BadRequest,
        "Survey ID is required"
      );
    }

    const survey = await pp_user.survey_master.findFirst({
      where: { id: Number(id), recstatus: 1 },
      select: {
        id: true,
        user_id: true,
        user_charge_id: true,
        entry_ip: true,
        created_at: true,
        updated_at: true,
        doc_path: true,
        user_charge_data: true,
      },
    });

    if (!survey) {
      return genrateResponse(res, HttpStatus.NotFound, "Survey not found");
    }

    // Fetch employee full name
    let userDetails = null;

    if (survey.user_id !== null && survey.user_id !== undefined) {
      userDetails = await pp_panel.user.findFirst({
        where: { id: survey.user_id },
        select: { username: true },
      });
    }

    const fullName = userDetails?.username;

    const responseData = {
      ...convertBigIntToString(survey),
      user_full_name: fullName,
    };

    genrateResponse(
      res,
      HttpStatus.OK,
      "Survey Details Fetched Successfully",
      responseData
    );
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(
      res,
      err?.status || HttpStatus.BadRequest,
      err?.message || "An error occurred while fetching survey data"
    );
  }
};

export const getSurveyDashboardCounts = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const currentUser = req.user as AuthPayload;

    const totalSurveyCount = await pp_user.survey_master.count({
      where: { recstatus: 1 },
    });

    const totalConsumerCount = await pp_user.user_charge_data.count({
      where: {},
    });

    const surveyorCount = await pp_panel.user.count({
      where: {
        roles: {
          some: { id: 1 }, // role id = 1 → Surveyor
        },
      },
    });

    const driverCount = await pp_panel.user.count({
      where: {
        roles: {
          some: { id: 2 }, // role id = 2 → Driver
        },
      },
    });

    const data = {
      taggedCount: totalSurveyCount,
      unTaggedCount: totalConsumerCount - totalSurveyCount,
      totalConsumerCount: totalConsumerCount,
      surveyorCount: surveyorCount,
      driverCount: driverCount,
    };

    genrateResponse(
      res,
      HttpStatus.OK,
      "Survey Counts Fetched Successfully",
      data
    );
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(
      res,
      err?.status || HttpStatus.BadRequest,
      err?.message || "An error occurred while fetching survey data"
    );
  }
};
