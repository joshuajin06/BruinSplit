import express from "express";
import { authenticateUser } from '../middleware/authenticateUser.js';
import * as eventsController from "../controllers/eventsController.js";

const router = express.Router();

router.get("/", eventsController.getEvents);
router.post("/", authenticateUser, eventsController.createEvent);
router.get("/:id", eventsController.getEventById);
router.put("/:id", authenticateUser, eventsController.updateEvent);
router.delete("/:id", authenticateUser, eventsController.deleteEvent);

export default router;