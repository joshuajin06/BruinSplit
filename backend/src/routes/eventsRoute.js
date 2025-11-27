import express from "express";
import { authenticateUser } from '../middleware/authenticateUser.js';
import * as eventsController from "../controllers/eventsController.js";

const router = express.Router();

router.get("/", eventsController.getEvents);
router.post("/", eventsController.createEvent);
router.get("/:id", eventsController.getEventById);
router.put("/:id", eventsController.updateEvent);
router.delete("/:id", eventsController.deleteEvent);

export default router;