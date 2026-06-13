// models/GameStat.ts
import mongoose from "mongoose";

export interface IGameStat extends Document {
  gameId: string;
  playCount: number;
  lastPlayed: Date;
}

const GameStatSchema = new mongoose.Schema({
  gameId: { type: String, required: true, unique: true },
  playCount: { type: Number, default: 0 },
  lastPlayed: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<IGameStat>("GameStat", GameStatSchema);