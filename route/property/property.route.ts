import express from "express";

import { getProperty } from "../../controller/property/property.controller";

const router = express.Router();

router.get("/:int_pid", getProperty);


export default router;
