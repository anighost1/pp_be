import express from "express";
import { getWasteCollection,createWasteCollection } from "../../controller/mobile-driver/driver.controller"

const router = express.Router();

router.get('/', getWasteCollection)
router.post('/', createWasteCollection)

export default router