import express from "express";

import { getOdc } from "../../controller/odc/odc.controller";

const router = express.Router();

router.get("/", getOdc);

export default router;
