import express from "express";

import { getConsumerList } from "../../controller/consumer/consumer.controller";

const router = express.Router();

router.get("/get-consumer-list", getConsumerList);

export default router;
