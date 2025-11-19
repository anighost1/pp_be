import express from 'express';
import { getSurveyApp } from "../../controller/download/download.controller"

const router = express.Router()

router.get('/survey-app', getSurveyApp)

export default router