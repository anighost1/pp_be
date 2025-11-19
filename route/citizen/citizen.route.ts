import express from 'express';
import { getUserCharge } from "../../controller/citizen/user_charge.controller"

const router = express.Router()

router.get('/user-charge', getUserCharge)

export default router