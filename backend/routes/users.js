import express from "express";
import { createUser, getUser } from "../controllers/controllers.js";

const router = express.Router();

router.post("/", createUser); // POST endpoint to create new users
router.get("/:id", getUser); // GET endpoint to retrieve user by ID

export default router;