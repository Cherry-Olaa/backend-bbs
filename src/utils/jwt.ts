

import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "3d";       // e.g., "3d"
const REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "30d"; // e.g., "30d"

export interface JWTPayload {
  id: string;
  role: "admin" | "staff" | "student";
  name: string;
}

export function signAccess(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as SignOptions);
}

export function signRefresh(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN } as SignOptions);
}

export function verifyRefresh(token: string): JWTPayload {
  const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
  if (typeof decoded === "string") throw new Error("Invalid token payload");
  return decoded as JWTPayload;
}