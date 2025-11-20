import express from 'express';
import * as eventsController from "../controllers/eventsController.js";
import { supabase } from '../src/lib/supabase.js';

const router = express.Router();

router.get("/", eventsController.getEvents);


export default router;