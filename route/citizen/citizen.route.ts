import express from 'express';
import { getUserCharge } from "../../controller/citizen/user_charge.controller"
import { createGrievance, getGrievances } from '../../controller/citizen/grievance.controller';
import { createOdc, getOdc, getVehicleType } from '../../controller/citizen/onDemandCollection.controller';

const router = express.Router()

router.get('/user-charge', getUserCharge)

//Grievance
router.post('/grievance', createGrievance)
router.get('/grievance', getGrievances)

//Grievance
router.post('/odc', createOdc)
router.get('/odc', getOdc)
router.get('/vehicle-type', getVehicleType)

export default router