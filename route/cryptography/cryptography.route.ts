import express from "express";
import { decryption, encryption } from "../../controller/cryptography/cryptography.controller";


const router = express.Router();

router.post('/encrypt', encryption)
router.post('/decrypt', decryption)

export default router