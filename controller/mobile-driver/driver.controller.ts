import { Request, Response } from "express";
import convertBigIntToString from "../../lib/bigIntConversion";
import genrateResponse from "../../lib/generateResponse";
import HttpStatus from "../../lib/httpStatus";
import {
  PrismaClient as userChargeClient,
  Prisma,
} from "../../generated/user_charge";
import { PrismaClient as panelClient } from "../../generated/panel";
import { AuthenticatedRequest } from "../../middleware/authMiddleware";
import { AuthPayload } from "../../type/common.type";

const userCharge = new userChargeClient();
const panel = new panelClient();

export const createWasteCollection = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { user_charge, lat, long } = req.body;
    const currentUser = req.user as AuthPayload;

    if (!user_charge) {
      return genrateResponse(
        res,
        HttpStatus.BadRequest,
        "User charge ID is required"
      );
    }

    // Find latest record for the current user
    const existingRecord = await userCharge.waste_collection.findFirst({
      where: {
        user_charge_id: Number(user_charge),
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const currentDateTime = new Date();

    // Check time difference (in hours)
    if (existingRecord) {
      const timeDiffHours =
        (currentDateTime.getTime() - existingRecord.created_at.getTime()) / (1000 * 60 * 60);

      // If record created less than 7 hours ago, disallow new one
      if (timeDiffHours < 7) {
        throw new Error("Cannot create record — please wait at least 7 hours before creating a new entry")
      }
    }

    // Create new waste collection record
    const data = await userCharge.$transaction(async (tx) => {
      return await tx.waste_collection.create({
        data: {
          user_id: Number(currentUser.userId),
          user_charge_id: Number(user_charge),
          entry_ip: req.ip || null,
          latitude: lat ?? null,
          longitude: long ?? null,
        },
      });
    });

    genrateResponse(
      res,
      HttpStatus.OK,
      "Waste Collection created successfully",
      convertBigIntToString(data)
    );
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(
      res,
      err?.status || HttpStatus.BadRequest,
      err?.message || "An error occurred while creating waste collection record"
    );
  }
};


export const getWasteCollection = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { pid, owner, mobile, date } = req.query
    const currentUser = req.user as AuthPayload

    const page = req.query.page && Number(req.query.page) > 0 ? Number(req.query.page) : 1
    const limit = req.query.limit && Number(req.query.limit) > 0 ? Number(req.query.limit) : 10
    const skip = (page - 1) * limit

    let startOfDay: Date | undefined = undefined
    let endOfDay: Date | undefined = undefined

    if (date) {
      startOfDay = new Date(String(date));
      startOfDay.setHours(0, 0, 0, 0); // 00:00:00

      endOfDay = new Date(String(date));
      endOfDay.setHours(23, 59, 59, 999); // 23:59:59
    }

    const where: Prisma.waste_collectionWhereInput = {
      user_id: currentUser?.userId,
      AND: [
        pid
          ? {
            user_charge_data: {
              integrated_property_id: {
                equals: String(pid)
              }
            }
          }
          : {},
        owner
          ? {
            user_charge_data: {
              integrated_owner_name: {
                contains: String(owner),
                mode: 'insensitive'
              }
            }
          }
          : {},
        mobile
          ? {
            user_charge_data: {
              mobile: {
                equals: String(mobile)
              }
            }
          }
          : {},
        date
          ? {
            created_at: {
              gte: startOfDay,
              lte: endOfDay,
            }
          }
          : {}
      ],
    };

    const [data, total] = await Promise.all([
      userCharge.waste_collection.findMany({
        where,
        orderBy: { created_at: 'desc' },
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
              colony: true
            }
          }
        }
      }),
      userCharge.waste_collection.count({ where }),
    ]);

    await Promise.all(
      data.map(async (waste_collection: any) => {
        const userData = await panel.user.findUnique({
          where: { id: Number(waste_collection.user_id) },
          select: {
            username: true
          }
        })
        waste_collection.username = userData?.username || null
      })
    )

    genrateResponse(
      res,
      HttpStatus.OK,
      'Driver data retrieved successfully',
      convertBigIntToString(data),
      {
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      }
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