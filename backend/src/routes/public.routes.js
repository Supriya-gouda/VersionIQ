import { Router } from "express";
import { downloadSharedFileController, getSharedFileInfoController } from "../controllers/public.controller.js";

export const publicRouter = Router();

publicRouter.get("/share/:token", getSharedFileInfoController);
publicRouter.get("/share/:token/download", downloadSharedFileController);
