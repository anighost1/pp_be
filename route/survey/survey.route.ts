import express from "express";

import { getSurveyList , getSurveyDetails , getSurveyDashboardCounts} from "../../controller/survey/survey.controller";

const router = express.Router();

router.get("/get-survey-list", getSurveyList);
router.post("/get-survey-details", getSurveyDetails);
router.get("/get-survey-dashboard-count", getSurveyDashboardCounts);


export default router;
