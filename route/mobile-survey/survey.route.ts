import express from "express";
import { getSurvey, getUserCharges, createSurvey, getUserChargeByPid } from "../../controller/mobile-survey/survey.controller"

const router = express.Router();

router.get('/', getSurvey)
router.get('/user-charges', getUserCharges)
router.get('/user-charges/:pid', getUserChargeByPid)
router.post('/', createSurvey)

export default router