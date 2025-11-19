import { Request, Response } from "express";
import genrateResponse from "../../lib/generateResponse";
import HttpStatus from "../../lib/httpStatus";
import { decryptData, encryptData } from "../../lib/apiCryptography";
import { AuthenticatedRequest } from "../../middleware/authMiddleware";
import { AuthPayload } from "../../type/common.type";
import convertBigIntToString from "../../lib/bigIntConversion";
import { parse, startOfDay, endOfDay, isValid, format } from "date-fns";

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

export const getChartData = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    // Area chart: survey counts by date
    const areaChartRaw = await pp_user.$queryRawUnsafe<
      { date: string; count: bigint }[]
    >(`
      SELECT TO_CHAR(created_at, 'YYYY-MM-DD') AS date, COUNT(id) AS count
      FROM survey_master
      WHERE recstatus = 1  
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date ASC;
    `);

    let barChartRaw = await pp_user.$queryRawUnsafe<
      { user_id: number; count: bigint }[]
    >(`
      SELECT user_id, COUNT(id) AS count
      FROM survey_master
      WHERE DATE(created_at) = CURRENT_DATE 
      AND recstatus = 1
      GROUP BY user_id
      ORDER BY user_id ASC;
    `);

    if (!barChartRaw) {
      barChartRaw = await pp_user.$queryRawUnsafe<
        { user_id: number; count: bigint }[]
      >(`
    SELECT user_id, COUNT(id) AS count
    FROM survey_master
    WHERE created_at >= NOW() - INTERVAL '7 days'
    AND recstatus = 1
    GROUP BY user_id
    ORDER BY user_id ASC;
  `);
    }

    const userIds = barChartRaw.map((r) => r.user_id);
    const employees = await pp_panel.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true },
    });

    const barChartData = barChartRaw.map((row) => {
      const emp = employees.find((e) => e.id === row.user_id);
      return {
        user_id: row.user_id,
        fullName: emp?.username,
        count: Number(row.count),
      };
    });

    const pieChartData = {
      untaggedCount: await pp_user.user_charge_data.count({
        where: { is_tagged: false },
      }),
      totalSurveyCount: await pp_user.survey_master.count({
        where: {
          recstatus: 1,
        },
      }),
      totalConsumerCount: await pp_user.user_charge_data.count(),
    };

    const areaChartData = areaChartRaw.map((row) => ({
      date: row.date,
      count: Number(row.count),
    }));

    const data = { areaChartData, barChart: barChartData, pieChartData };

    genrateResponse(
      res,
      HttpStatus.OK,
      "Charts Counts Fetched Successfully",
      data
    );
  } catch (err: any) {
    console.error(err);
    genrateResponse(
      res,
      err?.status || HttpStatus.BadRequest,
      err?.message || "Error fetching chart data"
    );
  }
};

export const getUserListByRole = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const currentUser = req.user as AuthPayload;

    const roleParam = req.params.role;

    if (!roleParam || typeof roleParam !== "string") {
      return genrateResponse(
        res,
        HttpStatus.BadRequest,
        "Role must be provided as a string"
      );
    }
    console.log("role", roleParam);

    const normalizedRole = roleParam.toLowerCase();
    let userList = [];

    if (normalizedRole == "driver") {
      userList = await pp_panel.user.findMany({
        where: {
          roles: {
            some: { id: 2 }, // Driver
          },
        },
        select: {
          id: true,
          username: true,
        },
      });
    } else if (normalizedRole == "surveyor") {
      userList = await pp_panel.user.findMany({
        where: {
          roles: {
            some: { id: 3 }, // Surveyor
          },
        },
        select: {
          id: true,
          username: true,
        },
      });
    } else {
      return genrateResponse(
        res,
        HttpStatus.BadRequest,
        "Invalid role provided"
      );
    }

    const data = { userList };

    genrateResponse(res, HttpStatus.OK, "User List Fetched Successfully", data);
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(
      res,
      err?.status || HttpStatus.BadRequest,
      err?.message || "An error occurred while fetching User List data"
    );
  }
};

export const getMapData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUser = req.user as AuthPayload;

    const id = req.query.id ? String(req.query.id) : undefined;
    const role = req.query.role
      ? String(req.query.role).toLowerCase()
      : undefined;

    console.log("Req ", role);

    const dateStr = req.query.date ? String(req.query.date) : undefined;

    if (!role) {
      return genrateResponse(res, HttpStatus.BadRequest, "Role is required");
    }

    // Parse date from 'dd-MM-yyyy' format
    let targetDate: Date;
    if (dateStr) {
      targetDate = parse(dateStr, "dd-MM-yyyy", new Date());
      if (!isValid(targetDate)) {
        return genrateResponse(
          res,
          HttpStatus.BadRequest,
          "Invalid date format. Use dd-MM-yyyy"
        );
      }
    } else {
      targetDate = new Date();
    }

    // Get start and end of day in UTC
    const dayStart = startOfDay(targetDate); // local start
    const dayEnd = endOfDay(targetDate); // local end

    // Convert to ISO strings for DB comparison
    const dayStartISO = dayStart.toISOString(); // e.g., '2025-10-10T00:00:00.000Z'
    const dayEndISO = dayEnd.toISOString(); // e.g., '2025-10-10T23:59:59.999Z'

    let groupedData: any[] = [];

    if (role == "surveyor") {
      const surveyData = await pp_user.survey_master.findMany({
        where: {
          ...(id ? { user_id: Number(id) } : {}),
          created_at: { gte: dayStartISO, lte: dayEndISO },
          recstatus: 1,
        },
        select: {
          user_id: true,
          latitude: true,
          longitude: true,
          created_at: true,
        },
        orderBy: { created_at: "asc" },
      });

      groupedData = surveyData.reduce((acc: any, curr) => {
        const existing = acc.find((u: any) => u.user_id === curr.user_id);
        const formattedDate = format(
          new Date(curr.created_at),
          "dd-MM-yyyy HH:mm:ss"
        );
        if (existing) {
          existing.locations.push({
            latitude: curr.latitude,
            longitude: curr.longitude,
            created_date: formattedDate,
          });
        } else {
          acc.push({
            user_id: curr.user_id,
            locations: [
              {
                latitude: curr.latitude,
                longitude: curr.longitude,
                created_date: formattedDate,
              },
            ],
          });
        }
        return acc;
      }, []);
    } else if (role == "driver") {
      const wasteCollectionData = await pp_user.waste_collection.findMany({
        where: {
          ...(id ? { user_id: Number(id) } : {}),
          created_at: { gte: dayStartISO, lte: dayEndISO },
          recstatus: 1,
        },
        select: {
          user_id: true,
          latitude: true,
          longitude: true,
          created_at: true,
        },
        orderBy: { created_at: "asc" },
      });

      groupedData = wasteCollectionData.reduce((acc: any, curr) => {
        const existing = acc.find((u: any) => u.user_id === curr.user_id);
        const formattedDate = format(
          new Date(curr.created_at),
          "dd-MM-yyyy HH:mm:ss"
        );
        if (existing) {
          existing.locations.push({
            latitude: curr.latitude,
            longitude: curr.longitude,
            created_date: formattedDate,
          });
        } else {
          acc.push({
            user_id: curr.user_id,
            locations: [
              {
                latitude: curr.latitude,
                longitude: curr.longitude,
                created_date: formattedDate,
              },
            ],
          });
        }
        return acc;
      }, []);
    } else {
      return genrateResponse(
        res,
        HttpStatus.BadRequest,
        "Invalid role provided"
      );
    }

    genrateResponse(
      res,
      HttpStatus.OK,
      "Map Data Fetched Successfully",
      groupedData
    );
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(
      res,
      err?.status || HttpStatus.BadRequest,
      err?.message || "An error occurred while fetching map data"
    );
  }
};

export const updatedCounts = async () => {
  try {
    const totalSurveyCount = await pp_user.survey_master.count({
      where: {},
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

    return data;
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    return null;
  }
};

export const updatedMapData = async () => {
  try {
    // Area chart: survey counts by date
    const areaChartRaw = await pp_user.$queryRawUnsafe<
      { date: string; count: bigint }[]
    >(`
      SELECT TO_CHAR(created_at, 'YYYY-MM-DD') AS date, COUNT(id) AS count
      FROM survey_master
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date ASC;
    `);

    let barChartRaw = await pp_user.$queryRawUnsafe<
      { user_id: number; count: bigint }[]
    >(`
      SELECT user_id, COUNT(id) AS count
      FROM survey_master
      WHERE DATE(created_at) = CURRENT_DATE
      GROUP BY user_id
      ORDER BY user_id ASC;
    `);

    if (!barChartRaw) {
      barChartRaw = await pp_user.$queryRawUnsafe<
        { user_id: number; count: bigint }[]
      >(`
    SELECT user_id, COUNT(id) AS count
    FROM survey_master
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY user_id
    ORDER BY user_id ASC;
  `);
    }

    const userIds = barChartRaw.map((r) => r.user_id);
    const employees = await pp_panel.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true },
    });

    const barChartData = barChartRaw.map((row) => {
      const emp = employees.find((e) => e.id === row.user_id);
      return {
        user_id: row.user_id,
        fullName: emp?.username,
        count: Number(row.count),
      };
    });

    const pieChartData = {
      untaggedCount: await pp_user.user_charge_data.count({
        where: { is_tagged: false },
      }),
      totalSurveyCount: await pp_user.survey_master.count(),
      totalConsumerCount: await pp_user.user_charge_data.count(),
    };

    const areaChartData = areaChartRaw.map((row) => ({
      date: row.date,
      count: Number(row.count),
    }));

    const data = { areaChartData, barChart: barChartData, pieChartData };

    return data;
  } catch (err: any) {
    console.error(err);
    return null;
  }
};
