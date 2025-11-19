import express from "express";

import { getMapData,getUserListByRole,getChartData} from "../../controller/dashboard/dashboard.controller";

const router = express.Router();

router.get("/get-chart-data", getChartData);
router.get("/get-user-list/:role", getUserListByRole);
router.get("/get-map-data", getMapData);

export default router;
