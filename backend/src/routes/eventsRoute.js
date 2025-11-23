import express from "express";
import * as eventsController from "../controllers/eventsController.js";

const router = express.Router();

router.get("/", eventsController.getEvents);
router.post("/", eventsController.createEvent);

export default router;