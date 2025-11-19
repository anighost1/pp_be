import { Request, Response } from 'express';
import { PrismaClient as panelClient } from '../../generated/panel'
import convertBigIntToString from '../../lib/bigIntConversion';
import genrateResponse from '../../lib/generateResponse';
import HttpStatus from '../../lib/httpStatus';
import { decryptData, encryptData } from '../../lib/apiCryptography';

const panel = new panelClient()

// *******************ULB Type*********************//

export const createUlbType = async (req: Request, res: Response) => {
  try {
    const {
      ulbTypeName: name,
    } = req.body

    const ulb = await panel.ulb_type.create({
      data: {
        name
      },
    })
    genrateResponse(
      res,
      HttpStatus.OK,
      'ULB type created successfully',
      encryptData(ulb) // returns all columns
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


export const getAllUlbType = async (req: Request, res: Response) => {
  try {
    // read query params (default page = 1, limit = 10)
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // get data with pagination (descending order)
    const ulbType = await panel.ulb_type.findMany({
      skip,
      take: limit,
      orderBy: { id: "desc" }
    });

    // get total count
    const total = await panel.ulb_type.count();

    genrateResponse(
      res,
      HttpStatus.OK,
      "ULB Types fetched successfully",
      encryptData({
        data: ulbType,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      })
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



/**
 * UPDATE ULB Type
 */
export const updateUlbType = async (req: Request, res: Response) => {
  try {

    const { iv, ed } = req.body;
    // decrypt the id
    const data = decryptData({
      encryptedData: ed as string,
      iv: iv as string,
    });

    const ulbType = await panel.ulb_type.update({
      where: { id: Number(data.ulbTypeId) },
      data: {
        name: data.ulbTypeName,
      },
    });

    genrateResponse(
      res,
      HttpStatus.OK,
      'ULB type updated successfully',
      encryptData(ulbType)
    );
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(res, err?.status || HttpStatus.BadRequest, err?.message);
  }
};


/**
 * DELETE ULB Type
 */
export const toggleUlbType = async (req: Request, res: Response) => {
  try {
    const { iv, ed } = req.body;

    // decrypt request data
    const data = decryptData({
      encryptedData: ed as string,
      iv: iv as string,
    });

    // find current status
    const prevStatus = await panel.ulb_type.findUnique({
      where: { id: Number(data?.id) },
      select: { recstatus: true },
    });

    if (!prevStatus) {
      return genrateResponse(res, HttpStatus.NotFound, "ULB Type not found");
    }

    // toggle status
    const newStatus = prevStatus.recstatus === 1 ? 0 : 1;

    const updatedUlb = await panel.ulb_type.update({
      where: { id: Number(data?.id) },
      data: { recstatus: newStatus },
    });

    genrateResponse(
      res,
      HttpStatus.OK,
      `ULB Type toggled to ${updatedUlb.recstatus} successfully`,
      encryptData(updatedUlb)
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



// ******************ULB Master***********************//

export const createUlb = async (req: Request, res: Response) => {
  try {
    const {
      ulbName: name,
      ulbTypeId: ulb_type_id,
      ulbNameHindi: name_hindi,
      ulbAddress: address,
      ulbNigamTollFreeNo: nigamtollfreeno,
      ulbReceiptTollfreeNo: receipttollfreeno,
      ulbMunicipalLogo: municipallogo,
      ulbAgencyFullName: agencyfullname,
      ulbAgencyLogo: agencylogo,
      ulbDomainName: domainname,
      ulbGST: gstno,
      ulbEntry: entryby,
      ulbRecStatus: recstatus,
      ulbPayId: payee_id,
      ulbLatitude: latitude,
      ulbLogintude: longitude,
      ulbBankName: bankname,
      ulbAccountno: accountno,
      ulbIFSCcode: ifsccode,

    } = req.body;

    const ulb = await panel.ulb_master.create({
      data: {
        name,
        ulb_type_id,
        name_hindi,
        address,
        nigamtollfreeno,
        receipttollfreeno,
        municipallogo,
        agencyfullname,
        agencylogo,
        domainname,
        gstno,
        entryby,
        recstatus,
        payee_id,
        latitude,
        longitude,
        bankname,
        accountno,
        ifsccode,
      },
    });

    genrateResponse(
      res,
      HttpStatus.OK,
      'ULB master created successfully',
      encryptData(ulb)
    );
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(res, err?.status || HttpStatus.BadRequest, err?.message);
  }
};

export const getAllUlbs = async (req: Request, res: Response) => {
  try {
    // get page & limit from query params, with defaults
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // fetch total count for pagination metadata
    const totalCount = await panel.ulb_master.count();

    // fetch paginated data
    const ulbs = await panel.ulb_master.findMany({
      skip,
      take: limit,
      include: {
        ulb_type: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const pagination = {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };

    genrateResponse(
      res,
      HttpStatus.OK,
      'ULB Master list fetched successfully',
      encryptData({ data: ulbs, pagination })
    );
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(res, err?.status || HttpStatus.BadRequest, err?.message);
  }
};


/**
 * GET ULB Master by ID
 */
export const getById = async (req: Request, res: Response) => {
  try {
    const { iv, ed } = req.query
    // decrypt the id
    const id = decryptData({ encryptedData: ed as string, iv: iv as string })

    const ulb = await panel.ulb_master.findUnique({
      where: { id: Number(id.id) },

      include: {
        ulb_type: true,
        zone_circle_master: true,
      },

    });
    if (!ulb) {
      return genrateResponse(res, HttpStatus.NotFound, 'ULB Master not found');
    }

    genrateResponse(
      res,
      HttpStatus.OK,
      'ULB Master fetched successfully',
      encryptData(ulb)
    );
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(res, err?.status || HttpStatus.BadRequest, err?.message);
  }
};

/**
 * UPDATE ULB Master
 */
export const update = async (req: Request, res: Response) => {
  try {
    const { iv, ed } = req.body;

    // decrypt the payload
    const dataToUpdate = decryptData({
      encryptedData: ed as string,
      iv: iv as string,
    });

    // destructure required fields
    const {
      id,
      ulbName: name,
      ulbTypeId: ulb_type_id,
      ulbNameHindi: name_hindi,
      ulbAddress: address,
      ulbNigamTollFreeNo: nigamtollfreeno,
      ulbReceiptTollfreeNo: receipttollfreeno,
      ulbMunicipalLogo: municipallogo,
      ulbAgencyFullName: agencyfullname,
      ulbAgencyLogo: agencylogo,
      ulbDomainName: domainname,
      ulbGST: gstno,
      ulbEntry: entryby,
      ulbRecStatus: recstatus,
      ulbPayId: payee_id,
      ulbLatitude: latitude,
      ulbLogintude: longitude,
      ulbBankName: bankname,
      ulbAccountno: accountno,
      ulbIFSCcode: ifsccode,
    } = dataToUpdate;

    const ulb = await panel.ulb_master.update({
      where: { id: Number(id) },
      data: {
        name,
        ulb_type_id,
        name_hindi,
        address,
        nigamtollfreeno,
        receipttollfreeno,
        municipallogo,
        agencyfullname,
        agencylogo,
        domainname,
        gstno,
        entryby,
        recstatus,
        payee_id,
        latitude,
        longitude,
        bankname,
        accountno,
        ifsccode,
      },
    });

    genrateResponse(
      res,
      HttpStatus.OK,
      'ULB Master updated successfully',
      encryptData(ulb)
    );
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(res, err?.status || HttpStatus.BadRequest, err?.message);
  }
};



/**
 * DELETE ULB Master
 */
export const toggleUlb = async (req: Request, res: Response) => {
  try {
    const { iv, ed } = req.body;

    // decrypt request data
    const data = decryptData({
      encryptedData: ed as string,
      iv: iv as string,
    });

    // find current status
    const prevStatus = await panel.ulb_master.findUnique({
      where: { id: Number(data?.id) },
      select: { recstatus: true },
    });

    if (!prevStatus) {
      return genrateResponse(res, HttpStatus.NotFound, "ULB Type not found");
    }

    // toggle status
    const newStatus = prevStatus.recstatus === 1 ? 0 : 1;

    const updatedUlb = await panel.ulb_master.update({
      where: { id: Number(data?.id) },
      data: { recstatus: newStatus },
    });

    genrateResponse(
      res,
      HttpStatus.OK,
      `ULB Master toggled to ${updatedUlb.recstatus} successfully`,
      encryptData(updatedUlb)
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