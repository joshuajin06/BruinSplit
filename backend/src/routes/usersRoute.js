import express from "express";
import { createUser } from "../controllers/controllers.js";


const router = express.Router();

router.post("/", createUser); //Route for creating a new user

export default router;