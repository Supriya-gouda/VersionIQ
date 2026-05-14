import { Router } from "express";

import {
  listPipelineStatusController,
  syncPipelineStatusController,
  getPipelineStatsController,
  pipelineWebhookController,
} from "../controllers/pipeline.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const pipelineRouter = Router();

// Public webhook — called by Jenkins to push build results into MongoDB.
// Protected by a shared secret header (X-Jenkins-Token) rather than JWT
// so Jenkins does not need a user account.
pipelineRouter.post("/webhook", pipelineWebhookController);

// All remaining routes require a logged-in user.
pipelineRouter.use(requireAuth);
pipelineRouter.get("/status", listPipelineStatusController);
pipelineRouter.post("/sync", syncPipelineStatusController);
pipelineRouter.get("/stats", getPipelineStatsController);
