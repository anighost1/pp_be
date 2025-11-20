import express from 'express';
import { getUserCharge } from "../../controller/citizen/user_charge.controller"
import { createGrievance, getGrievances } from '../../controller/citizen/grievance.controller';

const router = express.Router()

router.get('/user-charge', getUserCharge)

//Grievance
router.post('/grievance', createGrievance)
router.get('/grievance', getGrievances)

export default router