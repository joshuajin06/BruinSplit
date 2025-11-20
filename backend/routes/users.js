import express from "express";
import { createUser, getUser } from "../controllers/controllers.js";


const router = express.Router();

router.post("/", createUser); // Route for creating a new user
router.get("/:id", getUser); // Route for fetching a user by id

export default router;