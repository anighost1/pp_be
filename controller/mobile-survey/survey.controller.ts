import { Request, Response } from "express";
import convertBigIntToString from "../../lib/bigIntConversion";
import genrateResponse from "../../lib/generateResponse";
import HttpStatus from "../../lib/httpStatus";
import {
  PrismaClient as userChargeClient,
  Prisma,
} from "../../generated/user_charge";
import { updatedCounts , updatedMapData} from "../../controller/dashboard/dashboard.controller";
import { PrismaClient as panelClient } from "../../generated/panel";
import { AuthenticatedRequest } from "../../middleware/authMiddleware";
import { AuthPayload } from "../../type/common.type";
import { docUploaderLocal } from "../../lib/docUploader";
import { io } from "../../index";

const userCharge = new userChargeClient();
const panel = new panelClient();

export const getSurvey = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { pid, owner, mobile, date } = req.query;
    const currentUser = req.user as AuthPayload;

    const page =
      req.query.page && Number(req.query.page) > 0 ? Number(req.query.page) : 1;
    const limit =
      req.query.limit && Number(req.query.limit) > 0
        ? Number(req.query.limit)
        : 10;
    const skip = (page - 1) * limit;

    let startOfDay: Date | undefined = undefined;
    let endOfDay: Date | undefined = undefined;

    if (date) {
      startOfDay = new Date(String(date));
      startOfDay.setHours(0, 0, 0, 0); // 00:00:00

      endOfDay = new Date(String(date));
      endOfDay.setHours(23, 59, 59, 999); // 23:59:59
    }

    const where: Prisma.survey_masterWhereInput = {
      user_id: currentUser?.userId,
      AND: [
        pid
          ? {
            user_charge_data: {
              integrated_property_id: {
                equals: String(pid),
              },
            },
          }
          : {},
        owner
          ? {
            user_charge_data: {
              integrated_owner_name: {
                contains: String(owner),
                mode: "insensitive",
              },
            },
          }
          : {},
        mobile
          ? {
            user_charge_data: {
              mobile: {
                equals: String(mobile),
              },
            },
          }
          : {},
        date
          ? {
            created_at: {
              gte: startOfDay,
              lte: endOfDay,
            },
          }
          : {},
      ],
    };

    const [data, total] = await Promise.all([
      userCharge.survey_master.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        include: {
          user_charge_data: {
            select: {
              integrated_property_id: true,
              integrated_owner_name: true,
              mobile: true,
              property_image: true,
              address: true,
              colony: true,
            },
          },
        },
      }),
      userCharge.survey_master.count({ where }),
    ]);

    await Promise.all(
      data.map(async (survey: any) => {
        const userData = await panel.user.findUnique({
          where: { id: Number(survey.user_id) },
          select: {
            username: true,
          },
        });
        survey.username = userData?.username || null;
      })
    );

    genrateResponse(
      res,
      HttpStatus.OK,
      "Survey data retrieved successfully",
      convertBigIntToString(data),
      {
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      }
    );
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(
      res,
      err?.status || HttpStatus.BadRequest,
      err?.message as string
    );
  }
};

export const getUserCharges = async (req: Request, res: Response) => {
  try {
    const { pid, owner, mobile } = req.query;

    if (!pid && !owner && !mobile) {
      return genrateResponse(
        res,
        HttpStatus.BadRequest,
        "At least one query parameter (pid, owner, mobile) is required"
      );
    }

    const page =
      req.query.page && Number(req.query.page) > 0 ? Number(req.query.page) : 1;
    const limit =
      req.query.limit && Number(req.query.limit) > 0
        ? Number(req.query.limit)
        : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.user_charge_dataWhereInput = {
      AND: [
        pid
          ? {
            integrated_property_id: {
              equals: String(pid),
            },
          }
          : {},
        owner
          ? {
            integrated_owner_name: {
              contains: String(owner),
              mode: "insensitive",
            },
          }
          : {},
        mobile
          ? {
            mobile: {
              equals: String(mobile),
            },
          }
          : {},
      ],
    };

    const [data, total] = await Promise.all([
      userCharge.user_charge_data.findMany({
        where,
        orderBy: { id: "asc" },
        skip,
        take: limit,
      }),
      userCharge.user_charge_data.count({ where }),
    ]);

    genrateResponse(
      res,
      HttpStatus.OK,
      "Survey data retrieved successfully",
      convertBigIntToString(data),
      {
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      }
    );
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(
      res,
      err?.status || HttpStatus.BadRequest,
      err?.message as string
    );
  }
};

export const createSurvey = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { user_charge, img, lat, long } = req.body;

    const currentUser = req.user as AuthPayload;

    if (!user_charge) {
      return genrateResponse(
        res,
        HttpStatus.BadRequest,
        "User charge ID is required"
      );
    }

    const surveyCount = await userCharge.survey_master.count({
      where: {
        user_charge_id: Number(user_charge),
      },
    });

    if (surveyCount > 4) {
      throw new Error("Only 4 surveys are allowed per user charge entry")
    }

    let docPath = "";
    if (img) {
      docPath = await docUploaderLocal(
        Buffer.from(img, "base64"),
        "uploads/survey"
      );
    }

    const { data } = await userCharge.$transaction(async (tx) => {
      await tx.survey_master.updateMany({
        where: {
          user_charge_id: Number(user_charge),
          recstatus: 1,
        },
        data: {
          recstatus: 0,
        },
      });

      const data = await tx.survey_master.create({
        data: {
          user_id: Number(currentUser?.userId),
          user_charge_id: Number(user_charge),
          ...(docPath && { doc_path: [docPath] }),
          entry_ip: req.ip,
          ...(lat && { latitude: lat }),
          ...(long && { longitude: long }),
        },
      });

      await tx.user_charge_data.update({
        where: { id: Number(user_charge) },
        data: {
          is_tagged: true,
        },
      });

      return {
        data,
      };
    });

    // ✅ After successful DB transaction, fetch updated dashboard counts
    const counts = await updatedCounts();

    // ✅ Emit to all connected WebSocket clients
    io.emit("COUNT_UPDATE", { data: counts });

      // ✅ After successful DB transaction, fetch updated dashboard counts
    const mapData = await updatedMapData();

    // ✅ Emit to all connected WebSocket clients
    io.emit("CHART_UPDATE", { data: mapData });

    genrateResponse(
      res,
      HttpStatus.OK,
      "Survey created successfully",
      convertBigIntToString(data)
    );
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(
      res,
      err?.status || HttpStatus.BadRequest,
      err?.message as string
    );
  }
};

// export const createSurvey = async (req: AuthenticatedRequest, res: Response) => {
//     try {
//         const {
//             user_charge,
//             qr,
//             img,
//             lat,
//             long
//         } = req.body

//         const currentUser = req.user as AuthPayload

//         if (!user_charge || !qr) {
//             return genrateResponse(res, HttpStatus.BadRequest, 'All fields are required');
//         }

//         const surveyCount = await userCharge.survey_master.count({
//             where: {
//                 user_charge_id: Number(user_charge)
//             }
//         })

//         if (surveyCount > 4) {
//             return genrateResponse(res, HttpStatus.BadRequest, 'Only 4 surveys are allowed per user charge entry');
//         }

//         const userChargeCount = await userCharge.user_charge_data.count({
//             where: {
//                 qr_number: String(qr)
//             }
//         })

//         if (userChargeCount > 0) {
//             return genrateResponse(res, HttpStatus.BadRequest, 'The provided QR is already tagged');
//         }

//         let docPath = ''
//         if (img) {
//             docPath = await docUploaderLocal(Buffer.from(img, "base64"), 'uploads/survey')
//         }

//         const { data } = await userCharge.$transaction(async (tx) => {
//             await tx.survey_master.updateMany({
//                 where: {
//                     user_charge_id: Number(user_charge),
//                     recstatus: 1
//                 },
//                 data: {
//                     recstatus: 0
//                 }
//             })

//             const data = await tx.survey_master.create({
//                 data: {
//                     user_id: Number(currentUser?.userId),
//                     is_verified: true,
//                     user_charge_id: Number(user_charge),
//                     qr_number: String(qr),
//                     ...(docPath && { doc_path: [docPath] }),
//                     entry_ip: req.ip,
//                     ...(lat && { latitude: lat }),
//                     ...(long && { longitude: long }),
//                 }
//             })

//             await tx.user_charge_data.update({
//                 where: { id: Number(user_charge) },
//                 data: {
//                     qr_number: String(qr)
//                 }
//             })

//             return {
//                 data
//             }
//         })

//         genrateResponse(
//             res,
//             HttpStatus.OK,
//             'Survey created successfully',
//             convertBigIntToString(data)
//         )
//     } catch (err: any) {
//         console.error(`[${new Date().toISOString()}]`, err)
//         genrateResponse(
//             res,
//             err?.status || HttpStatus.BadRequest,
//             err?.message as string
//         )
//     }
// }

export const getUserChargeByPid = async (req: Request, res: Response) => {
  try {
    const { pid } = req.params;

    if (!pid) {
      return genrateResponse(
        res,
        HttpStatus.BadRequest,
        "Property ID is required"
      );
    }

    const data = await userCharge.user_charge_data.findFirst({
      where: {
        integrated_property_id: String(pid),
      },
    });

    genrateResponse(
      res,
      HttpStatus.OK,
      "Survey data retrieved successfully",
      convertBigIntToString(data)
    );
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(
      res,
      err?.status || HttpStatus.BadRequest,
      err?.message as string
    );
  }
};
