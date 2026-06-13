// controllers/gameStatController.ts
import { Request, Response } from "express";
import GameStat from "../models/GameStat";

// Get all game stats (for KidsZone display)
export async function getAllGameStats(req: Request, res: Response) {
  try {
    const stats = await GameStat.find().lean();
    // Return as object with gameId as key for easy frontend mapping
    const statsMap = stats.reduce((acc, stat) => {
      acc[stat.gameId] = {
        playCount: stat.playCount,
        lastPlayed: stat.lastPlayed
      };
      return acc;
    }, {} as Record<string, { playCount: number; lastPlayed: Date }>);
    res.json(statsMap);
  } catch (error) {
    console.error("Error fetching game stats:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Increment play count for a specific game (called when game starts)
export async function incrementPlayCount(req: Request, res: Response) {
  try {
    const { gameId } = req.params;
    const stat = await GameStat.findOneAndUpdate(
      { gameId },
      { $inc: { playCount: 1 }, $set: { lastPlayed: new Date() } },
      { upsert: true, new: true }
    );
    res.json({ success: true, playCount: stat.playCount });
  } catch (error) {
    console.error("Error incrementing play count:", error);
    res.status(500).json({ message: "Server error" });
  }
}