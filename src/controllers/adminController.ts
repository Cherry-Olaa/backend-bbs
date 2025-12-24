import { Request, Response } from "express";
import User from "../models/User";
import { comparePassword } from "../utils/hash";
import { signAccess, signRefresh } from "../utils/jwt";

export async function adminLogin(req: Request, res: Response) {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: "username & password required" });

  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  if (user.role !== "admin") return res.status(403).json({ message: "Not an admin" });

  // ✅ Replace this part
  const payload = {
    id: user._id.toString(),
    role: user.role as "admin" | "staff" | "student",
    name: user.fullName,
  };

  const access = signAccess(payload);
  const refresh = signRefresh(payload);

  user.refreshToken = refresh;
  await user.save();

  res.json({
    access,
    refresh,
    profile: {
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    },
  });
}