import express from 'express';
import { login } from "../../controller/citizen/auth.controller"

const router = express.Router()

router.post('/login', login)

export default router