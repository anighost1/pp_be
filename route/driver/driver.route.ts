import express from "express";

import { getWasteCollectionList,getWasteCollectionDetails} from "../../controller/driver/driver.controller";

const router = express.Router();

router.get("/get-waste-collection-list", getWasteCollectionList);
router.post("/get-waste-collection-details", getWasteCollectionDetails);

export default router;
