import { Request, Response } from "express"
import genrateResponse from "../../lib/generateResponse"
import { PrismaClient as panelClient } from '../../generated/panel'
import HttpStatus from "../../lib/httpStatus"
import { AuthenticatedRequest } from "../../middleware/authMiddleware"
import { createMenu } from "../../dal/panel.dal"
import { decryptData, encryptData } from "../../lib/apiCryptography"

const panel = new panelClient()

export const createMenuPanel = async (req: AuthenticatedRequest, res: Response) => {
  try {

    const { label, path, parentId, permissionName = [], order } = req.body;

    const newMenu = await createMenu(
      label,
      path,
      permissionName,
      parentId,
      order
    );

    genrateResponse(
      res,
      HttpStatus.OK,
      "Menu created successfully",
      newMenu
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


export const getAllMenu = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const skip = (page - 1) * limit;

    //  fetch total count 
    const totalCount = await panel.menu.count()

    const menuData = await panel.menu.findMany({
      skip,
      take: limit,
      orderBy: { id: 'desc' },
      include: {
        permissions: true
      }
    })

    const allPermissions = await panel.permissions.findMany()

    genrateResponse(
      res,
      HttpStatus.OK,
      'Menu Fetched Successfully ',
      encryptData({
        data: menuData,
        permission: allPermissions,
        pagination: {
          totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        }
      })
    )
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(
      res,
      err?.status || HttpStatus.BadRequest,
      err?.message as string
    )
  }
}

export const getMenuById = async (req: Request, res: Response) => {
  try {
    const { iv, ed } = req.query;
    const id = decryptData({ encryptedData: ed as string, iv: iv as string })

    const menu = await panel.menu.findUnique({
      where: { id: Number(id.id) },
      include: {
        permissions: true
      }
    })
    if (!menu) {
      return genrateResponse(res, HttpStatus.NotFound, 'Menu not found')
    }

    const allPermissions = await panel.permissions.findMany()
    genrateResponse(
      res,
      HttpStatus.OK,
      'Menu fetched successfully',
      encryptData({
        menu: menu,
        permission: allPermissions
      })
    );

  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(res, err?.status || HttpStatus.BadRequest, err?.message);
  }
}

export const updateMenuById = async (req: Request, res: Response) => {
  try {
    const { iv, ed } = req.body;
    const data = decryptData({ encryptedData: ed as string, iv: iv as string });

    // 🔹 Ensure menuPermission is always an array
    const menuPermissions: string[] = Array.isArray(data.menuPermission) ? data.menuPermission : [];

    // 🔹 Fetch IDs of permissions by name
    const permissions = await panel.permissions.findMany({
      where: { name: { in: menuPermissions } },
      select: { id: true },
    });

    // 🔹 Update menu with relation set
    const menuUpdate = await panel.menu.update({
      where: { id: Number(data.id) },
      data: {
        label: data.menuLabel,
        path: data.menuPath,
        parentId: data.menuParentId,
        order: data.order,
        permissions: {
          set: permissions.map(p => ({ id: p.id }))
        },
      },
      include: { permissions: true },
    });

    genrateResponse(
      res,
      HttpStatus.OK,
      "Menu Updated Successfully",
      encryptData(menuUpdate)
    );
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(res, err?.status || HttpStatus.BadRequest, err?.message);
  }
};

export const toggleMenu = async (req: Request, res: Response) => {
  try {
    const { iv, ed } = req.body;
    const data = decryptData({ encryptedData: ed as string, iv: iv as string })

    const prevStatus = await panel.menu.findUnique({
      where: { id: Number(data?.id) },
      select: { recstatus: true },
    });

    if (!prevStatus) {
      return genrateResponse(res, HttpStatus.NotFound, "Not Found")
    }

    const newStatus = prevStatus.recstatus === 1 ? 0 : 1;

    const updatedStatus = await panel.menu.update({
      where: { id: Number(data?.id) },
      data: { recstatus: newStatus }
    })
    genrateResponse(
      res,
      HttpStatus.OK,
      `Agency toggled to ${updatedStatus.recstatus} successfully`,
      encryptData(updatedStatus)
    )

  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(
      res,
      err?.status || HttpStatus.BadRequest,
      err?.message as string
    );
  }
}
