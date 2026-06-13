// routes/gameRoutes.ts
import { Router } from "express";
import { getAllGameStats, incrementPlayCount } from "../controllers/gameStatController";

const router = Router();

router.get("/stats", getAllGameStats);
router.post("/:gameId/play", incrementPlayCount);

export default router;